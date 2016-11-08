(function() {
    'use strict';
    // deferredSetup.js must be loaded first

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
			!R.progCopyDepth ||
            !R.progRed ||
			!R.progSphereRed ||
            !R.progClear ||
            !R.prog_Ambient ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug ||
            !R.progPost1 ||
			!R.progOutput ||
			!R.progPost2)) {
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

/*         { // TODO: this block should be removed after testing renderFullScreenQuad
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // TODO: Implement/test renderFullScreenQuad first
            renderFullScreenQuad(R.progRed);
            return;
        } */

        R.pass_copy.render(state);
		R.pass_copyDepth.render(state);

		if (cfg && cfg.debugScissor)
		{
			if (cfg.sphereProxy)
			{
				R.pass_sphereProxyDebug.render(state);
			}
			else
			{
				R.pass_scissorTestDebug.render(state);
			}
		}
        else if (cfg && cfg.debugView >= 0) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            R.pass_debug.render(state);
        } else {
            // * Deferred pass and postprocessing pass(es)
            // TODO: uncomment these
			R.pass_deferred.render = cfg.sphereProxy ? sphereProxyLighting : scissorTestLighting;
            R.pass_deferred.render(state);
            R.pass_post1.render(state);

            // OPTIONAL TODO: call more postprocessing passes, if any
			R.pass_post2.render(state);
			R.pass_output.render(state);
        }
    };

	R.pass_copyDepth.render = function(state)
	{
		gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_copyDepth.fbo);
		gl.depthFunc(gl.ALWAYS);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.depthTex);
		gl.useProgram(R.progCopyDepth.prog);
		gl.uniform1i(R.progCopyDepth.u_depth, 0);
		renderFullScreenQuad(R.progCopyDepth);
		gl.depthFunc(gl.LEQUAL);
	};
	
    /**
     * 'copy' pass: Render into g-buffers
     */
    R.pass_copy.render = function(state) {
        // * Bind the framebuffer R.pass_copy.fbo
        // TODO: uncomment
        gl.bindFramebuffer(gl.FRAMEBUFFER,R.pass_copy.fbo);


        // * Clear screen using R.progClear
        // TODO: uncomment
        renderFullScreenQuad(R.progClear);

        // * Clear depth buffer to value 1.0 using gl.clearDepth and gl.clear
        // TODO: uncomment
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * "Use" the program R.progCopy.prog
        // TODO: uncomment
        gl.useProgram(R.progCopy.prog);

        // TODO: Go write code in glsl/copy.frag.glsl

        var m = state.cameraMat.elements;
		var viewMat = state.viewMat.elements;
        // * Upload the camera matrix m to the uniform R.progCopy.u_cameraMat
        //   using gl.uniformMatrix4fv
        // TODO: uncomment
        gl.uniformMatrix4fv(R.progCopy.u_cameraMat, false, m);
		gl.uniformMatrix4fv(R.progCopy.u_viewMat, false, viewMat);

        // * Draw the scene
        // TODO: uncomment
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

    R.pass_debug.render = function(state)
	{
		gl.disable(gl.DEPTH_TEST);
        // * Unbind any framebuffer, so we can write to the screen
        // TODO: uncomment
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Bind/setup the debug "lighting" pass
        // * Tell shader which debug view to use
        // TODO: uncomment
        bindTexturesForLightPass(R.prog_Debug);
		gl.uniform3f(R.prog_Debug.u_viewportInfo, 2.0 * Math.tan(22.5 * Math.PI / 180.0), width, height);
        gl.uniform1i(R.prog_Debug.u_debug, cfg.debugView);

        // * Render a fullscreen quad to perform shading on
        // TODO: uncomment
        renderFullScreenQuad(R.prog_Debug);
		gl.enable(gl.DEPTH_TEST);
    };

	R.pass_sphereProxyDebug.render = function(state)
	{
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
		
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		
		readySphereProxy(R.progSphereRed, R.sphereModel);
		for (var i = 0; i < R.lights.length; ++i)
		{
			var light = R.lights[i];
			var lightPos = new THREE.Vector3(light.pos[0], light.pos[1], light.pos[2]);
			lightPos.applyMatrix4(state.viewMat);
			gl.uniform3fv(R.progSphereRed.u_lightPos, lightPos.toArray());
			gl.uniform1f(R.progSphereRed.u_lightRad, light.rad);
			gl.uniformMatrix4fv(R.progSphereRed.u_proj, false, state.projMat.elements);
			drawSphereProxy(R.sphereModel);
		}
		
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
	};
	
	R.pass_scissorTestDebug.render = function(state)
	{
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(R.progRed.prog);

        // * Clear depth to 1.0 and color to black
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
		
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.enable(gl.SCISSOR_TEST);
		
		for (var i = 0; i < R.lights.length; ++i)
		{
			var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
			if (sc != null)
			{
				gl.scissor(sc[0], sc[1], sc[2], sc[3]);
				renderFullScreenQuad(R.progRed);
			}
		}
		
		gl.disable(gl.SCISSOR_TEST);
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
	};
	
    /**
     * 'deferred' pass: Add lighting results for each individual light
     */
	var sphereProxyLighting = function(state)
	{
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_deferred.fbo);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.ONE,gl.ONE);

		// Ambient light
		gl.disable(gl.DEPTH_TEST);
		bindTexturesForLightPass(R.prog_Ambient);
		renderFullScreenQuad(R.prog_Ambient);
		gl.enable(gl.DEPTH_TEST);
		
		// Blinn-Phong point light
		bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);
		readySphereProxy(R.prog_BlinnPhong_PointLight, R.sphereModel);
		gl.uniform3f(R.prog_BlinnPhong_PointLight.u_viewportInfo, 2.0 * Math.tan(22.5 * Math.PI / 180.0), width, height);
		gl.uniformMatrix4fv(R.prog_BlinnPhong_PointLight.u_proj, false, state.projMat.elements);

		gl.depthFunc(gl.GREATER);
		gl.depthMask(false);
		gl.disable(gl.CULL_FACE);
		
		for (var i = 0; i < R.lights.length; ++i)
		{
			var light = R.lights[i];
			var lightPos = new THREE.Vector3(light.pos[0], light.pos[1], light.pos[2]);
			lightPos.applyMatrix4(state.viewMat);
			gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, lightPos.toArray());
			gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, light.col);
			gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, light.rad);
			drawSphereProxy(R.sphereModel);
		}
		
		gl.enable(gl.CULL_FACE);
		gl.depthMask(true);
		gl.depthFunc(gl.LEQUAL);
		
        gl.disable(gl.BLEND);
    };
	
	var scissorTestLighting = function(state) {
        // * Bind R.pass_deferred.fbo to write into for later postprocessing
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_deferred.fbo);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

        // * _ADD_ together the result of each lighting pass

        // Enable blending and use gl.blendFunc to blend with:
        //   color = 1 * src_color + 1 * dst_color
        // Here is a wonderful demo of showing how blend function works: 
        // http://mrdoob.github.io/webgl-blendfunctions/blendfunc.html
        // TODO: uncomment
		gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.ONE,gl.ONE);

		// * Bind/setup the ambient pass, and render using fullscreen quad
		bindTexturesForLightPass(R.prog_Ambient);
		renderFullScreenQuad(R.prog_Ambient);
		
		// * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
		bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

		// TODO: add a loop here, over the values in R.lights, which sets the
		//   uniforms R.prog_BlinnPhong_PointLight.u_lightPos/Col/Rad etc.,
		//   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).

		// TODO: In the lighting loop, use the scissor test optimization
		// Enable gl.SCISSOR_TEST, render all lights, then disable it.
		//
		// getScissorForLight returns null if the scissor is off the screen.
		// Otherwise, it returns an array [xmin, ymin, width, height].
		
		gl.enable(gl.SCISSOR_TEST);
		for (var i = 0; i < R.lights.length; ++i)
		{
			var light = R.lights[i];
			var sc = getScissorForLight(state.viewMat, state.projMat, light);
			
			if (sc != null)
			{
				gl.scissor(sc[0], sc[1], sc[2], sc[3]);
				var lightPos = new THREE.Vector3(light.pos[0], light.pos[1], light.pos[2]);
				lightPos.applyMatrix4(state.viewMat);
				gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, lightPos.toArray());
				gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, light.col);
				gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, light.rad);
				renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
			}
		}
		gl.disable(gl.SCISSOR_TEST);
		
		// Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
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
        gl.bindTexture(gl.TEXTURE_2D, R.pass_copyDepth.colorTex);
        gl.uniform1i(prog.u_depth, R.NUM_GBUFFERS);
    };

    /**
     * 'post1' pass: Generate brightness texture
     */
    R.pass_post1.render = function(state)
	{
		gl.disable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_post2.fbo0);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(R.progPost1.prog);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);

        gl.uniform1i(R.progPost1.u_color, 0);
		gl.uniform1f(R.progPost1.u_threshold, cfg.bloomThreshold);

        renderFullScreenQuad(R.progPost1);
		gl.enable(gl.DEPTH_TEST);
    };
	
	/**
	 * Two-pass Gaussian blur
	 */
	R.pass_post2.render = function(state)
	{
		gl.disable(gl.DEPTH_TEST);
		
		gl.useProgram(R.progPost2.prog);
		gl.activeTexture(gl.TEXTURE0);
		
		gl.uniform2f(R.progPost2.u_imgDim, width, height);
		gl.uniform1i(R.progPost2.u_color, 0);
		
		for (var i = 0; i < 5; ++i)
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_post2.fbo1);
			gl.bindTexture(gl.TEXTURE_2D, R.pass_post2.colorTex0);
			gl.uniform1i(R.progPost2.u_isHorizontal, true);
			renderFullScreenQuad(R.progPost2);
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_post2.fbo0);
			gl.bindTexture(gl.TEXTURE_2D, R.pass_post2.colorTex1);
			gl.uniform1i(R.progPost2.u_isHorizontal, false);
			renderFullScreenQuad(R.progPost2);
		}
		
		gl.enable(gl.DEPTH_TEST);
	}
	
	R.pass_output.render = function(state)
	{
		gl.disable(gl.DEPTH_TEST);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		gl.useProgram(R.progOutput.prog);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, R.pass_post2.colorTex0)

        gl.uniform1i(R.progOutput.u_color, 0);
		gl.uniform1i(R.progOutput.u_brightness, 1);
		gl.uniform1i(R.progOutput.u_bloomEnabled, cfg.enableBloom);

        renderFullScreenQuad(R.progOutput);
		
		gl.enable(gl.DEPTH_TEST);
	}

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
