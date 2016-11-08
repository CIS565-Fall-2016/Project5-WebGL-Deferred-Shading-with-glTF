(function() {
    'use strict';
    // deferredSetup.js must be loaded first

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
            !R.progRed ||
            !R.progClear ||
            !R.progClone ||
            !R.prog_Ambient ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug ||
            !R.progMotionBlur ||
            !R.progBloom ||
            !R.progBrightness ||
            !R.progBlur2d ||
            !R.progBlur1dconv ||
            !R.progPost1)) {
            console.log('waiting for programs to load...');
            return;
        }

        // Move the R.lights
        for (var i = 0; i < R.lights.length; i++) {
            var mn = R.light_min[1];
            var mx = R.light_max[1];
            var dt = (cfg) ? -cfg.light_dt : -0.03;
            R.lights[i].pos[1] = (R.lights[i].pos[1] + dt - mn + mx) % mx + mn;
        }

        // Execute deferred shading pipeline

        // CHECKITOUT: START HERE! You can even uncomment this:
        // debugger;

        R.pass_copy.render(state);
        var doPostPasses = function(passes) {
            for (var i = 0; i < passes.length; i++) {
              var tex = (i == 0) ? R.pass_deferred.colorTex : R.tex[1 - R.curFbo];
              var fbo = (i == passes.length - 1) ? null : R.fbo[R.curFbo];
              passes[i].render(state, fbo, tex);
              R.curFbo = 1 - R.curFbo;
            }
          };
        if (cfg && cfg.debugView >= 0) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            if (cfg.debugView == 6) {
              doPostPasses([R.pass_post1, R.pass_motionBlur]);
            } else if (cfg.debugView == 7 || cfg.debugView == 8) {
              doPostPasses([R.pass_post1, R.pass_bloom]);
            } else {
              R.pass_debug.render(state);
            }
        } else {
            // * Deferred pass and postprocessing pass(es)
            R.pass_deferred.render(state);
            
            var passes = [R.pass_post1];
            if (cfg.enableMotionBlur) {
              passes.push(R.pass_motionBlur);
            }
            if (cfg.bloom > 0) {
              passes.push(R.pass_bloom);
            }
            doPostPasses(passes);
        }
    }

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

        // Clone position into curPosIdx
        gl.useProgram(R.progClone.prog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.fbo[2]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, 
                                gl.TEXTURE_2D, R.prevPos[R.curPosIdx], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.gbufs[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.depthTex);
        gl.uniform1i(R.progClone.u_in, 0);
        gl.uniform1i(R.progClone.u_depth, 1);

        renderFullScreenQuad(R.progClone);
        R.curPosIdx = 1 - R.curPosIdx;
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
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        // Process color for each light
        if (cfg && cfg.enableScissor > 0) {
          gl.enable(gl.SCISSOR_TEST);
        }
        for (var i = 0; i < R.lights.length; i++) {
          var light = R.lights[i];
          if (cfg && cfg.enableScissor > 0) {
            var sc = getScissorForLight(state.viewMat, state.projMat, light, cfg.boundingBoxScale);
            if (sc == null) {
              continue;
            }
            gl.scissor(sc[0], sc[1], sc[2], sc[3]);
          }
          gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, light.pos);
          gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, light.col);
          gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, light.rad);
          renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
        }
        gl.disable(gl.SCISSOR_TEST);

        if (cfg && cfg.enableScissor == 2) {
          gl.enable(gl.SCISSOR_TEST);
          gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
          for (var i = 0; i < R.lights.length; i++) {
            var light = R.lights[i];
            var sc = getScissorForLight(state.viewMat, state.projMat, light, cfg.boundingBoxScale);
            if (sc == null) {
              continue;
            }
            gl.scissor(sc[0], sc[1], sc[2], sc[3]);
            renderFullScreenQuad(R.progRed);
          }
          gl.disable(gl.SCISSOR_TEST);
        }

        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
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
     * 'post1' pass: Perform (first) pass of post-processing
     */
    R.pass_post1.render = function(state, fbo, tex) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progPost1.prog);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progPost1.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progPost1);
    };

    /**
     * 'motionBlur' pass: Perform motion blur pass of post-processing
     */
    R.pass_motionBlur.render = function(state, fbo, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(R.progMotionBlur.prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, R.prevPos[R.curPosIdx]);

      gl.uniform1i(R.progMotionBlur.u_color, 0);
      gl.uniform1i(R.progMotionBlur.u_oldpos, 1);
      if (cfg.debugView == 6) {
        gl.uniform1i(R.progMotionBlur.u_debug, 1);
      } else {
        gl.uniform1i(R.progMotionBlur.u_debug, 0);
      }
      gl.uniformMatrix4fv(R.progMotionBlur.u_projMat, false, state.cameraMat.elements);
      renderFullScreenQuad(R.progMotionBlur);
    };

    R.pass_bloom.render = function(state, fbo, tex) {
      if (cfg.debugView == 7) {
        R.pass_brightness.render(state, null, tex);
        return;
      }
      R.pass_brightness.render(state, R.pass_brightness.fbo, tex);
      if (cfg.debugView == 8) {
        R.pass_postBlur2d.render(state, null, R.pass_brightness.colorTex);
        return;
      }
      if (cfg.bloom == 1) {
        R.pass_postBlur2d.render(state, R.pass_bloom.fbo, R.pass_brightness.colorTex);
      } else {
        R.pass_postBlur1d.render(state, R.pass_bloom.fbo, R.pass_brightness.colorTex);
      }
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(R.progBloom.prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, R.pass_bloom.colorTex);

      gl.uniform1i(R.progBloom.u_color, 0);
      gl.uniform1i(R.progBloom.u_glow, 1);

      renderFullScreenQuad(R.progBloom);
    }

    R.pass_brightness.render = function(state, fbo, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(R.progBrightness.prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.uniform1i(R.progBrightness.u_color, 0);

      renderFullScreenQuad(R.progBrightness);
    }

    R.pass_postBlur2d.render = function(state, fbo, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(R.progBlur2d.prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.uniform1i(R.progBlur2d.u_color, 0);
      gl.uniform2fv(R.progBlur2d.u_pixWidthHeight, [1.0 / width, 1.0 / height]);

      renderFullScreenQuad(R.progBlur2d);
    }

    R.pass_postBlur1d.render = function(state, fbo, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_postBlur1d.fbo);
      gl.useProgram(R.progBlur1dconv.prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.uniform1i(R.progBlur1dconv.u_color, 0);
      gl.uniform2fv(R.progBlur1dconv.u_pixWidthHeight, [1.0 / width, 1.0 / height]);
      gl.uniform2fv(R.progBlur1dconv.u_direction, [1.0, 0.0]);

      renderFullScreenQuad(R.progBlur1dconv);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, R.pass_postBlur1d.colorTex);

      gl.uniform2fv(R.progBlur1dconv.u_direction, [0.0, 1.0]);

      renderFullScreenQuad(R.progBlur1dconv);
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
