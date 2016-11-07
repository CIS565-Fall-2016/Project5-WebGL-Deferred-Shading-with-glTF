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
            !R.progPost1 ||
            !R.prog_bloom||
            !R.prog_bloom_combine||
            !R.prog_bloom_extract)) {
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
        //debugger;

        R.pass_copy.render(state);

        if (cfg && cfg.debugView >= 0)
        {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            if (cfg.debugView <= 5)
            {
                R.pass_debug.render(state);
            }
            else if (cfg.debugView == 6) // TODO: maybe use dicts instead of numbers
            {
                R.pass_debug.render_scissor(state);
            }
        }
        else
        {
            // * Deferred pass and postprocessing pass(es)
            // DONE: uncomment these
            R.pass_deferred.render(state);
            if (cfg.enableBloom)
            {
                R.pass_bloom.render(state);
            }
            R.pass_post1.render(state);

            // OPTIONAL TODO: call more postprocessing passes, if any
        }
    };

    /**
     * 'copy' pass: Render into g-buffers
     */
    R.pass_copy.render = function(state) {
        // * Bind the framebuffer R.pass_copy.fbo
        // DONE: uncomment
        gl.bindFramebuffer(gl.FRAMEBUFFER,R.pass_copy.fbo);


        // * Clear screen using R.progClear
        // DONE: uncomment
        renderFullScreenQuad(R.progClear);

        // * Clear depth buffer to value 1.0 using gl.clearDepth and gl.clear
        // DONE: uncomment
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * "Use" the program R.progCopy.prog
        // DONE: uncomment
        gl.useProgram(R.progCopy.prog);

        // DONE: Go write code in glsl/copy.frag.glsl

        var m = state.cameraMat.elements;
        // * Upload the camera matrix m to the uniform R.progCopy.u_cameraMat
        //   using gl.uniformMatrix4fv
        // DONE: uncomment
        gl.uniformMatrix4fv(R.progCopy.u_cameraMat, false, m);

        // * Draw the scene
        // DONE: uncomment
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
        // DONE: uncomment
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Bind/setup the debug "lighting" pass
        // * Tell shader which debug view to use
        // DONE: uncomment
        bindTexturesForLightPass(R.prog_Debug);
        gl.uniform1i(R.prog_Debug.u_debug, cfg.debugView);

        // * Render a fullscreen quad to perform shading on
        // DONE: uncomment
        renderFullScreenQuad(R.prog_Debug);
    };

    R.pass_debug.render_scissor = function(state)
    {
        // * Bind R.pass_deferred.fbo to write into for later postprocessing
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        //bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        gl.enable(gl.SCISSOR_TEST);

        for (let light of R.lights)
        {
            var sc = getScissorForLight(state.viewMat, state.projMat, light);
            if (!sc){continue;}
            gl.scissor(sc[0], sc[1], sc[2], sc[3]);

            renderFullScreenQuad(R.progRed);
        }

        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.BLEND);
    }

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
        // DONE: uncomment
        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        // Bind camera position
        gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_camPos, state.cameraPos.toArray());

        gl.enable(gl.SCISSOR_TEST);

        // DONE: add a loop here, over the values in R.lights, which sets the
        //   uniforms R.prog_BlinnPhong_PointLight.u_lightPos/Col/Rad etc.,
        //   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).
        for (let light of R.lights)
        {
            var sc = getScissorForLight(state.viewMat, state.projMat, light);
            if (!sc){continue;}
            gl.scissor(sc[0], sc[1], sc[2], sc[3]);

            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, light.col);
            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, light.pos);
            gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, light.rad);
            renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
        }

        if (cfg.debugScissor)
        {
            gl.blendEquation( gl.FUNC_ADD );
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            for (let light of R.lights)
            {
                var sc = getScissorForLight(state.viewMat, state.projMat, light);
                if (!sc){continue;}
                gl.scissor(sc[0], sc[1], sc[2], sc[3]);

                renderFullScreenQuad(R.progRed);
            }
        }

        gl.disable(gl.SCISSOR_TEST);

        // DONE: In the lighting loop, use the scissor test optimization
        // Enable gl.SCISSOR_TEST, render all lights, then disable it.
        //
        // getScissorForLight returns null if the scissor is off the screen.
        // Otherwise, it returns an array [xmin, ymin, width, height].
        //
        //   var sc = getScissorForLight(state.viewMat, state.projMat, light);

        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
        R.previous_pass_tex_output = R.pass_deferred.colorTex;
    };

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

    /**
     * 'bloom' pass: apply bloom to the scene
     */
    R.pass_bloom.render = function(state) {
        // Step1: extract bright area
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[0]);
        //gl.clearDepth(1.0);
        gl.useProgram(R.prog_bloom_extract.prog)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.previous_pass_tex_output);
        gl.uniform1i(R.prog_bloom_extract.u_color, 0);
        renderFullScreenQuad(R.prog_bloom_extract);

        // Step2: two-pass blur
        gl.useProgram(R.prog_bloom.prog);
        gl.uniform2fv(R.prog_bloom.u_tex_offset, [1.0 / width, 1.0/ height]);
        gl.uniform1f(R.prog_bloom.u_scale, 0.003);
        for (let i = 1; i < 3; i++)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[i]);
            //gl.clearDepth(1.0);
            // gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.uniform1i(R.prog_bloom.u_horizontal, i - 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.colorTexs[i-1]);
            gl.uniform1i(R.prog_bloom.u_color, 0);

            renderFullScreenQuad(R.prog_bloom);
        }

        // Step3: combine
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_bloom.fbos[3]);
        //gl.clearDepth(1.0);
        gl.useProgram(R.prog_bloom_combine.prog)

        // output of deferred pass
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.previous_pass_tex_output);
        gl.uniform1i(R.prog_bloom_combine.u_scene, 0);

        // blur pass output
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.colorTexs[2]);
        gl.uniform1i(R.prog_bloom_combine.u_bloom, 1);

        renderFullScreenQuad(R.prog_bloom_combine);

        R.previous_pass_tex_output = R.pass_bloom.colorTexs[3];
    };

    /**
     * 'post1' pass: Perform (first) pass of post-processing
     */
    R.pass_post1.render = function(state) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progPost1.prog);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        // DONE: uncomment
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        // DONE: uncomment
        gl.bindTexture(gl.TEXTURE_2D, R.previous_pass_tex_output);
        //gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progPost1.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progPost1);
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
            // DONE: uncomment
            vbo = gl.createBuffer();

            // Bind the VBO as the gl.ARRAY_BUFFER
            // DONE: uncomment
            gl.bindBuffer(gl.ARRAY_BUFFER,vbo);

            // Upload the positions array to the currently-bound array buffer
            // using gl.bufferData in static draw mode.
            // DONE: uncomment
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
            // DONE: uncomment
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

            // Enable the bound buffer as the vertex attrib array for
            // prog.a_position, using gl.enableVertexAttribArray
            // DONE: uncomment
            gl.enableVertexAttribArray(prog.a_position);

            // Use gl.vertexAttribPointer to tell WebGL the type/layout for
            // prog.a_position's access pattern.
            // DONE: uncomment
            gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);

            // Use gl.drawArrays (or gl.drawElements) to draw your quad.
            // DONE: uncomment
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Unbind the array buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        };
    })();
})();
