(function() {
    'use strict';
    // deferredSetup.js must be loaded first

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
            !R.progRedQuad ||
            !R.progRedSphere ||
            !R.progClear ||
            !R.prog_Ambient ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug)) {
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
        R.pass_copy.render(state);

        if (cfg && cfg.debugView >= 0 && cfg.debugView != 6) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            R.pass_debug.render(state);
        } else {
            
            // * Deferred pass and postprocessing pass(es)
            var colorTex = R.pass_deferred.render(state);
            if (cfg && cfg.enableBloom == true) {
            colorTex = R.pass_bloom.render(R.pass_deferred.colorTex);
            }
            R.pass_final.render(colorTex);
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

        // TODO: Go write code in glsl/copy.frag.glsl

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
        // TODO: uncomment
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
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        var shaderProg = R.prog_BlinnPhong_PointLight;
        if (cfg && cfg.debugView == 6) {
            shaderProg = R.progRedQuad;
            if( cfg.scissorMode == MyScissorEnum.ScissorSphere )
                shaderProg = R.progRedSphere;
        }

        if (cfg.scissorMode == MyScissorEnum.ScissorQuad) {
            gl.enable(gl.SCISSOR_TEST);
        }
        
        var camPos = vec3.create();
        camPos =[state.cameraPos.x, state.cameraPos.y, state.cameraPos.z];
        gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_cameraPos, camPos);
        
        for (var i = 0; i < R.lights.length; i++) {
            //   Set the uniforms of R.prog_BlinnPhong_PointLight,
                
            gl.uniform3fv(shaderProg.u_lightPos, R.lights[i].pos);
            gl.uniform3fv(shaderProg.u_lightCol, R.lights[i].col);
            gl.uniform1f(shaderProg.u_lightRad, R.lights[i].rad);
            if (cfg.scissorMode == MyScissorEnum.ScissorQuad) {
                var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                if (sc) { // sc is  an array [xmin, ymin, width, height]
                    gl.scissor(sc[0], sc[1], sc[2], sc[3]);

                }
                else { // getScissorForLight returns null if the scissor is off the screen.
                    continue;
                }
            }
            //   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).
            if (cfg.scissorMode == MyScissorEnum.ScissorSphere) {
                renderSphere(state, shaderProg, R.lights[i], R.sphereModel);
            }
            else{
                renderFullScreenQuad(shaderProg);
            }
        }
        
        if (cfg.scissorMode == MyScissorEnum.ScissorQuad) {
            gl.disable(gl.SCISSOR_TEST);
        }

        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
        return R.pass_deferred.colorTex;
    };

    /**
     * 'Post-Bloom' pass: Perform (first) pass of post-processing
     */
    R.pass_bloom.render = function(colorTex) {

        // * Disable the framebuffer depth
        gl.disable(gl.DEPTH_TEST);

        // * Bind the postprocessing shader program
        gl.useProgram(R.prog_brightner.prog);

        // * Bind brightFbo.
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.bloomFbo[0]);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        gl.bindTexture(gl.TEXTURE_2D, colorTex);

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.prog_brightner.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.prog_brightner);

        // * Bind the postprocessing shader program
        gl.useProgram(R.prog_gaussBlur.prog);
        
        gl.uniform1i(R.prog_gaussBlur.u_color, 0);
        gl.uniform1fv(R.prog_gaussBlur.u_kernel,
        [1.0, 0.1945946, 0.1216216, 0.054054, 0.016216]);
        gl.uniform2f(R.prog_gaussBlur.u_texSize, width, height);

        var horizontalBlur = 1;
        for (var i = 0; i < 2 * cfg.bloomIterations; i++) {
            
            // * Bind blurFbo.
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.bloomFbo[horizontalBlur]);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.bloomTex[1-horizontalBlur]);
            gl.uniform1i(R.prog_gaussBlur.horizontal, horizontalBlur);
            
            renderFullScreenQuad(R.prog_gaussBlur);
            horizontalBlur = 1 - horizontalBlur;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.bloomFbo[1-horizontalBlur]);
        // Enable blending and use gl.blendFunc to blend with:
        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        gl.useProgram(R.prog_final.prog);
        
        gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.activeTexture(gl.TEXTURE0);

        gl.uniform1i(R.prog_final.u_color, 0);
        renderFullScreenQuad(R.prog_final);
        
        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
                
        gl.enable(gl.DEPTH_TEST);
        return R.pass_bloom.bloomTex[0];
    };

    R.pass_final.render = function(colorTex) {

        // * Disable the framebuffer depth
        gl.disable(gl.DEPTH_TEST);
        
        gl.useProgram(R.prog_final.prog);
       
        // * Unbind any framebuffer, so we can write to the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.uniform1i(R.prog_final.u_color, 0);

       // * Render a fullscreen quad to perform shading on
       renderFullScreenQuad(R.prog_final);

       gl.enable(gl.DEPTH_TEST);
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

    var renderSphere = function(state, prog, light, model) {

            var worldMtx = new THREE.Matrix4();
            {
                var scaleMtx = new THREE.Matrix4();
                var transMtx = new THREE.Matrix4();

                scaleMtx.makeScale(light.rad, light.rad, light.rad);
                transMtx.makeTranslation(light.pos[0], light.pos[1], light.pos[2]);
            
                worldMtx.multiplyMatrices(transMtx, scaleMtx);
            }
            
            // Bind the program to use to draw the quad
            gl.useProgram(prog.prog);

            // * Upload the camera matrix m to the uniform R.progCopy.u_cameraMat
            //   using gl.uniformMatrix4fv
            gl.uniformMatrix4fv(prog.u_cameraMtx, false, state.cameraMat.elements);
            gl.uniformMatrix4fv(prog.u_worldMtx,false, worldMtx.elements); 

            // Bind the VBO as the gl.ARRAY_BUFFER
            gl.bindBuffer(gl.ARRAY_BUFFER, model.position);

            // Enable the bound buffer as the vertex attrib array for
            // prog.a_position, using gl.enableVertexAttribArray
            gl.enableVertexAttribArray(prog.a_position);

            // Use gl.vertexAttribPointer to tell WebGL the type/layout for
            // prog.a_position's access pattern.
            gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idx);

             // Use gl.drawArrays (or gl.drawElements) to draw your quad.
            gl.drawElements(gl.TRIANGLES, model.elemCount, gl.UNSIGNED_INT, 0);

            // Unbind the array buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
            // TODO: uncomment
            vbo = gl.createBuffer();

            // Bind the VBO as the gl.ARRAY_BUFFER
            // TODO: uncomment
            gl.bindBuffer(gl.ARRAY_BUFFER,vbo);

            // Upload the positions array to the currently-bound array buffer
            // using gl.bufferData in static draw mode.
            // TODO: uncomment
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
            // TODO: uncomment
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

            // Enable the bound buffer as the vertex attrib array for
            // prog.a_position, using gl.enableVertexAttribArray
            // TODO: uncomment
            gl.enableVertexAttribArray(prog.a_position);

            // Use gl.vertexAttribPointer to tell WebGL the type/layout for
            // prog.a_position's access pattern.
            // TODO: uncomment
            gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);

            // Use gl.drawArrays (or gl.drawElements) to draw your quad.
            // TODO: uncomment
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Unbind the array buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        };
    })();
})();
