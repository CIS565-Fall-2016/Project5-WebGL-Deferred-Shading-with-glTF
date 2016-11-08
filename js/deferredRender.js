(function() {
    'use strict';
    // deferredSetup.js must be loaded first

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
            !R.progRed ||
            !R.progClear ||
            !R.prog_Ambient ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug ||
            !R.progHighlights||
            !R.progFinal
            )) {
            console.log('waiting for programs to load...');
            return;
        }

        // Move the R.lights
        for (var i = 0; i < R.lights.length; i++) {
            // OPTIONAL TODO: Edit if you want to change how lights move
            var mn = R.light_min[1];
            var mx = R.light_max[1];
            R.lights[i].pos[1] = (R.lights[i].pos[1] + R.light_dt - mn + mx) % mx + mn;
        }

        // Execute deferred shading pipeline

        // CHECKITOUT: START HERE! You can even uncomment this:
        // debugger;

        // testing renderFullScreenQuad
        /*{
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            renderFullScreenQuad(R.progRed);
            return;
        }*/

        R.pass_copy.render(state);

        if (cfg && cfg.debugView >= 0) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            R.pass_debug.render(state);
        } else {
            // * Deferred pass and postprocessing pass(es)
            var tex;
            if (cfg.tiled) {
                tex = R.pass_tile_deferred.render(state);
            } else {
                tex = R.pass_deferred.render(state);
            }
            if (cfg.enableBloom) {
                tex = R.pass_bloom.render(tex);
            }
            R.pass_final.render(tex);
            

            // OPTIONAL TODO: call more postprocessing passes, if any
        }
    };

    /**
     * 'copy' pass: Render into g-buffers
     */
    R.pass_copy.render = function(state) {
        // * Bind the framebuffer R.pass_copy.fbo
        gl.bindFramebuffer(gl.FRAMEBUFFER,R.pass_copy.fbo);


        // * Clear screen using R.progClear
        renderFullScreenQuad(R.progClear);

        // * Clear depth buffer to value 1.0 using gl.clearDepth and gl.clear
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * "Use" the program R.progCopy.prog
        gl.useProgram(R.progCopy.prog);

        var m = state.cameraMat.elements;
        // * Upload the camera matrix m to the uniform R.progCopy.u_cameraMat
        //   using gl.uniformMatrix4fv
        gl.uniformMatrix4fv(R.progCopy.u_cameraMat, false, m);

        // * Draw the scene
        drawScene(state);
    };

    var drawScene = function(state) {
        for (var i = 0; i < state.models.length; i++) {
            var m = state.models[i];
            
            // If you want to render one model many times, note:
            // readyModelForDraw only needs to be called once.
            readyModelForDraw(R.progCopy, m);

            drawReadyModel(m);
        }
    };

    R.pass_debug.render = function(state) {
        // * Unbind any framebuffer, so we can write to the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Bind/setup the debug "lighting" pass
        // * Tell shader which debug view to use
        bindTexturesForLightPass(R.prog_Debug);
        gl.uniform1i(R.prog_Debug.u_debug, cfg.debugView);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.prog_Debug);
    };

    /**
     * 'deferred' pass: Add lighting results for each individual light
     */
    R.pass_deferred.render = function(state) {
        // * Bind R.pass_deferred.fbo to write into for later postprocessing
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_deferred.fbo);

        // * Clear depth to 1.0 and color to black
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // * _ADD_ together the result of each lighting pass

        // Enable blending and use gl.blendFunc to blend with:
        //   color = 1 * src_color + 1 * dst_color
        // Here is a wonderful demo of showing how blend function works: 
        // http://mrdoob.github.io/webgl-blendfunctions/blendfunc.html
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        //   loop over the values in R.lights, which sets the
        //   uniforms R.prog_BlinnPhong_PointLight.u_lightPos/Col/Rad etc.,
        //   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).
        gl.uniform3f(R.prog_BlinnPhong_PointLight.u_cameraPos, 
            state.cameraPos.x, 
            state.cameraPos.y, 
            state.cameraPos.z);

        if (cfg.scissorLights) gl.enable(gl.SCISSOR_TEST);
        for (var i = 0; i < R.lights.length; i++) {
            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, R.lights[i].pos);
            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, R.lights[i].col);
            gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, R.lights[i].rad);

            if (cfg.scissorLights) {
                // get bounding box of light in clip space and do scissor test
                var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                if (sc) {
                    gl.scissor(sc[0], sc[1], sc[2], sc[3]);
                    renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
                    if (cfg.debugScissor) {
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                        gl.useProgram(R.progDebug.prog);
                        gl.uniform4f(R.progDebug.u_color, 1, 1, 0, 0.1);
                        renderFullScreenQuad(R.progDebug);
                        gl.blendFunc(gl.ONE, gl.ONE);
                        gl.useProgram(R.prog_BlinnPhong_PointLight.prog);
                    }
                }
            } else {
                renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
            }
            
        }
        if (cfg.scissorLights) gl.disable(gl.SCISSOR_TEST);

        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);

        return R.pass_deferred.colorTex;
    };

    R.pass_tile_deferred.render = function(state) {

        for (var i = 0; i < R.lights.length; i++) {
            R.pass_tile_deferred.light_data.buffer[4 * i + 0] = R.lights[i].pos[0];
            R.pass_tile_deferred.light_data.buffer[4 * i + 1] = R.lights[i].pos[1];
            R.pass_tile_deferred.light_data.buffer[4 * i + 2] = R.lights[i].pos[2];
            R.pass_tile_deferred.light_data.buffer[4 * i + 3] = R.lights[i].rad;
            R.pass_tile_deferred.light_data.buffer[4 * i + 0 + 4 * R.lights.length] = R.lights[i].col[0];
            R.pass_tile_deferred.light_data.buffer[4 * i + 1 + 4 * R.lights.length] = R.lights[i].col[1];
            R.pass_tile_deferred.light_data.buffer[4 * i + 2 + 4 * R.lights.length] = R.lights[i].col[2];
            // R.pass_tile_deferred.light_data.buffer[4 * i + 3 + 4 * R.lights.length] = R.lights[i].rad;
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 0 + i] = R.lights[i].pos[0];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 1 + i] = R.lights[i].pos[1];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 2 + i] = R.lights[i].pos[2];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 4 + i] = R.lights[i].col[0];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 5 + i] = R.lights[i].col[1];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 6 + i] = R.lights[i].col[2];
            // R.pass_tile_deferred.light_data.buffer[R.lights.length * 7 + i] = R.lights[i].rad;
        }
        gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.light_data.tex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 
            R.pass_tile_deferred.light_data.dimx, 
            R.pass_tile_deferred.light_data.dimy, gl.RGBA, gl.FLOAT, 
            R.pass_tile_deferred.light_data.buffer);
        // gl.bindTexture(gl.TEXTURE_2D, null);
        
        // gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_tile_deferred.light_mask)
 
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_tile_deferred.fbo);

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, 
            gl.COLOR_ATTACHMENT0, 
            gl.TEXTURE_2D, 
            R.pass_tile_deferred.tile_data.tex, 
            0
        );

        gl.useProgram(R.progMapToTiles.prog)
        
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.light_data.tex)
        gl.uniform1i(R.progMapToTiles.u_lightbuffer, 0)

        gl.uniformMatrix4fv(R.progMapToTiles.u_viewMat, false, state.viewMat.elements);
        gl.uniformMatrix4fv(R.progMapToTiles.u_projMat, false, state.projMat.elements);

        gl.uniform1f(R.progMapToTiles.u_nlights, R.lights.length)
        gl.uniform2f(
            R.progMapToTiles.u_tilesize, 
            R.pass_tile_deferred.tile_size, 
            R.pass_tile_deferred.tile_size)
        gl.uniform1f(R.progMapToTiles.u_ntiles, R.pass_tile_deferred.nTiles)
        gl.uniform2f(R.progMapToTiles.u_resolution, width, height);
        
        gl.viewport(0, 0, 
            R.pass_tile_deferred.tile_data.dimx,
            R.pass_tile_deferred.tile_data.dimy);
        renderFullScreenQuad(R.progMapToTiles)
        gl.viewport(0, 0, width, height);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_tile_deferred.fboOut)

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);        
        // gl.useProgram(R.prog_BlinnPhong_PointLight_Tiled.prog);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight_Tiled)
        gl.activeTexture(gl['TEXTURE' + (R.NUM_GBUFFERS + 1)]);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.light_data.tex);
        gl.uniform1i(R.prog_BlinnPhong_PointLight_Tiled.u_lightbuffer, R.NUM_GBUFFERS + 1);
        gl.activeTexture(gl['TEXTURE' + (R.NUM_GBUFFERS + 2)]);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.tile_data.tex);
        gl.uniform1i(R.prog_BlinnPhong_PointLight_Tiled.u_tilebuffer, R.NUM_GBUFFERS + 2);

        gl.uniform1f(R.prog_BlinnPhong_PointLight_Tiled.u_nlights, R.lights.length)
        gl.uniform2f(R.prog_BlinnPhong_PointLight_Tiled.u_tilesize, R.pass_tile_deferred.tile_size, R.pass_tile_deferred.tile_size)
        gl.uniform1f(R.prog_BlinnPhong_PointLight_Tiled.u_ntiles, R.pass_tile_deferred.nTiles)
        gl.uniform2f(R.prog_BlinnPhong_PointLight_Tiled.u_resolution, width, height);

        gl.uniform3f(R.prog_BlinnPhong_PointLight_Tiled.u_cameraPos, 
            state.cameraPos.x, 
            state.cameraPos.y, 
            state.cameraPos.z);

        gl.uniform1i(R.prog_BlinnPhong_PointLight_Tiled.u_debug, cfg.debugTiles);

        renderFullScreenQuad(R.prog_BlinnPhong_PointLight_Tiled);

        gl.disable(gl.BLEND)
        return R.pass_tile_deferred.colorTex;

    };

    /**
     * 'bloom' pass: Perform bloom pass of post-processing
     */
    R.pass_bloom.render = function(inTex) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[0]);

        // we're only rendering the screen here so we don't need depth
        gl.disable(gl.DEPTH_TEST)

        // * Bind the postprocessing shader program
        gl.useProgram(R.progHighlights.prog);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, inTex to the active texture unit
        gl.bindTexture(gl.TEXTURE_2D, inTex);

        // Configure the R.progHighlights.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progHighlights.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progHighlights);
        
        gl.useProgram(R.progBlur.prog);
        
        gl.uniform1i(R.progBlur.u_color, 0);
        gl.uniform1f(R.progBlur.u_amount, cfg.bloomAmount);
        gl.uniform2f(R.progBlur.u_resolution, canvas.width, canvas.height);

        for (var i = 0; i < cfg.bloomIterations; ++i) {
            // flip-flop. bind one fbo, read from the other's texture
            gl.uniform2f(R.progBlur.u_dir, 1, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[1])
            gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.bufs[0]);
            renderFullScreenQuad(R.progBlur);

            gl.uniform2f(R.progBlur.u_dir, 0, 1);
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[0])
            gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.bufs[1]);
            renderFullScreenQuad(R.progBlur);
        }

        // add the result to the original input texture
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.useProgram(R.progFinal.prog);
        gl.bindTexture(gl.TEXTURE_2D, inTex);
        gl.uniform1i(R.progFinal.u_color, 0);
        renderFullScreenQuad(R.progFinal);

        // set things back to normal
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST)

        return R.pass_bloom.bufs[0];
    };

    R.pass_final.render = function(inTex) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.useProgram(R.progFinal.prog);

        gl.activeTexture(gl.TEXTURE0);
        
        gl.bindTexture(gl.TEXTURE_2D, inTex);

        gl.uniform1i(R.progFinal.u_color, 0);

        renderFullScreenQuad(R.progFinal);
    }

    var bindTexturesForLightPass = function(prog) {
        gl.useProgram(prog.prog);

        // * Bind all of the g-buffers and depth buffer as texture uniform
        //   inputs to the shader
        for (var i = 0; i < R.NUM_GBUFFERS; i++) {
            gl.activeTexture(gl['TEXTURE' + i]);
            gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.gbufs[i]);
            gl.uniform1i(prog.u_gbufs[i], i);
        }
        gl.activeTexture(gl['TEXTURE' + R.NUM_GBUFFERS]);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.depthTex);
        gl.uniform1i(prog.u_depth, R.NUM_GBUFFERS);
    };

    var renderFullScreenQuad = (function() {
        // The variables in this function are private to the implementation of
        // renderFullScreenQuad. They work like static local variables in C++.

        // Create an array of floats, where each set of 3 is a vertex position.
        // You can render in normalized device coordinates (NDC) so that the
        // vertex shader doesn't have to do any transformation; draw two
        // triangles which cover the screen over x = -1..1 and y = -1..1.
        // This array is set up to use gl.drawArrays with gl.TRIANGLE_STRIP.
        var positions = new Float32Array([
            -1.0, -1.0, 0.0,
             1.0, -1.0, 0.0,
            -1.0,  1.0, 0.0,
             1.0,  1.0, 0.0
        ]);

        var vbo = null;

        var init = function() {
            // Create a new buffer with gl.createBuffer, and save it as vbo.
            vbo = gl.createBuffer();

            // Bind the VBO as the gl.ARRAY_BUFFER
            gl.bindBuffer(gl.ARRAY_BUFFER,vbo);

            // Upload the positions array to the currently-bound array buffer
            // using gl.bufferData in static draw mode.
            gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
        };

        return function(prog) {
            if (!vbo) {
                // If the vbo hasn't been initialized, initialize it.
                init();
            }

            // Bind the program to use to draw the quad
            gl.useProgram(prog.prog);

            // Bind the VBO as the gl.ARRAY_BUFFER
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

            // Enable the bound buffer as the vertex attrib array for
            // prog.a_position, using gl.enableVertexAttribArray
            gl.enableVertexAttribArray(prog.a_position);

            // Use gl.vertexAttribPointer to tell WebGL the type/layout for
            // prog.a_position's access pattern.
            gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);

            // Use gl.drawArrays (or gl.drawElements) to draw your quad.
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Unbind the array buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        };
    })();
})();
