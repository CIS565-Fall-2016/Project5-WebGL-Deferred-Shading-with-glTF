(function() {
    'use strict';
    // deferredSetup.js must be loaded first
    R.lastShader = null;

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
            !R.progRed ||
            !R.progClear ||
            !R.prog_Ambient ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug ||
            !R.progPost1 ||
            !R.prog_Edge ||
            !R.prog_Toon)) {
            console.log('waiting for programs to load...');
            return;
        }

        // Move the R.lights
        if (cfg.movingLights) {
          for (var i = 0; i < R.lights.length; i++) {
              // OPTIONAL TODO: Edit if you want to change how lights move
              var mn = R.light_min[1];
              var mx = R.light_max[1];
              R.lights[i].pos[1] = (R.lights[i].pos[1] + R.light_dt - mn + mx) % mx + mn;
          }
        }

        R.pass_copy.render(state);
        if (cfg && cfg.debugView >= 0) {
            R.pass_debug.render(state);
        } else {
            // * Deferred pass and postprocessing pass(es)
            // TODO: uncomment these
            R.pass_deferred.render(state);
            R.pass_post1.render(state);
            if (cfg.rampShading) {
              R.pass_toon.render(state);
            }
            if (cfg.edge) {
              R.pass_edge.render(state);
            }
        }

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
        // * Upload the camera matrix m to the uniform R.progCopy.u_cameraMat
        //   using gl.uniformMatrix4fv
        // TODO: uncomment
        gl.uniformMatrix4fv(R.progCopy.u_cameraMat, false, m);

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

    R.pass_debug.render = function(state) {
        // * Unbind any framebuffer, so we can write to the screen
        // TODO: uncomment
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Bind/setup the debug "lighting" pass
        // * Tell shader which debug view to use
        // TODO: uncomment
        bindTexturesForLightPass(R.prog_Debug);
        gl.uniform1i(R.prog_Debug.u_debug, cfg.debugView);

        // * Render a fullscreen quad to perform shading on
        // TODO: uncomment
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

        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);


        var shadingProg;
        if (cfg.debugShaders == 1) {
          shadingProg = R.prog_BlinnPhong_PointLight;
        } else if (cfg.debugShaders == 2) {
          shadingProg = R.prog_RampShading;
        } else {
          shadingProg = R.prog_Default;
        }

        bindTexturesForLightPass(shadingProg);

        if (cfg.debugScissor) {
          gl.enable(gl.SCISSOR_TEST);
        }
        for (var i = 0; i < R.lights.length; i++) {
          var light = R.lights[i];
          if (cfg.debugScissor) {
            var sc = getScissorForLight(state.viewMat, state.projMat, light);
            if (!sc) {
              continue;
            }
            gl.scissor(sc[0], sc[1], sc[2], sc[3]);
          }
          gl.uniform3fv(shadingProg.u_lightPos, light.pos);
          gl.uniform3fv(shadingProg.u_lightCol, light.col);
          gl.uniform1f(shadingProg.u_lightRad, light.rad);
          renderFullScreenQuad(shadingProg);
        }
        gl.uniform3fv(shadingProg.u_viewPos, [state.cameraPos.x,state.cameraPos.y,state.cameraPos.z]);
        gl.uniform1f(shadingProg.u_bands, cfg.bands);

        gl.disable(gl.SCISSOR_TEST);
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
    R.pass_post1.render = function(state) {
        // * Unbind any existing framebuffer (if there are no more passes)
        if (cfg.edge || cfg.rampShading) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_post1.fbo);
          R.lastShader = R.pass_post1;
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.useProgram(R.progPost1.prog);

        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);
        gl.uniform1i(R.progPost1.u_color, 0);
        renderFullScreenQuad(R.progPost1);
        R.lastShader = R.pass_post1;
    };

    R.pass_toon.render = function (state) {
      if (cfg.edge) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_toon.fbo);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.useProgram(R.prog_Toon.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, R.lastShader.colorTex);
      gl.uniform1i(R.prog_Toon.u_color, 0);
      gl.uniform2fv(R.prog_Toon.u_pixSize, [1.0 / width, 1.0 / height]);
      gl.uniform1f(R.prog_Toon.u_bands, cfg.bands);
      renderFullScreenQuad(R.prog_Toon);
      R.lastShader = R.pass_toon;
    }

    R.pass_edge.render = function (state) {
      if (cfg.edgeTwoPass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_edge.fbo);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.useProgram(R.prog_Edge.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, R.lastShader.colorTex);
      gl.uniform1i(R.prog_Edge.u_color, 0);
      gl.uniform2fv(R.prog_Edge.u_pixSize, [1.0 / width, 1.0 / height]);
      if (cfg.edgeTwoPass) {
        gl.uniform1fv(R.prog_Edge.u_kernel, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
      } else {
        gl.uniform1fv(R.prog_Edge.u_kernel, [0, -2, -2, 2, 0, -2, 2, 2, 0]);
      }
      // gl.uniform1fv(R.prog_Edge.u_kernel, [-1, -1, -1, -1, 8, -1, -1, -1, -1]);
      // gl.uniform1fv(R.prog_Edge.u_kernel, [0, 0, 0, 0, 1, 0, 0, 0, 0]);
      R.lastShader = R.pass_edge;
      renderFullScreenQuad(R.prog_Edge);
      if (cfg.edgeTwoPass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.lastShader.colorTex);
        gl.uniform1i(R.prog_Edge.u_color, 0);
        gl.uniform2fv(R.prog_Edge.u_pixSize, [1.0 / width, 1.0 / height]);
        gl.uniform1fv(R.prog_Edge.u_kernel, [1, 0, -1, 2, 0, -2, 1, 0, -1]);
        renderFullScreenQuad(R.prog_Edge);
      }
      R.lastShader = R.pass_edge;
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
