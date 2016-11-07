(function() {
    'use strict';
    // deferredSetup.js must be loaded first
    R.lastShader = null;
    R.numShadersRemaining = 0;
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
              var mn = R.light_min[1];
              var mx = R.light_max[1];
              R.lights[i].pos[1] = (R.lights[i].pos[1] + R.light_dt - mn + mx) % mx + mn;
          }
        }
        R.lastShader = null;
        R.pass_copy.render(state);
        if (cfg && cfg.debugView >= 0 && cfg.debugView < 6) {
            R.pass_debug.render(state);
        } else if (cfg.debugView == 6) {
            R.pass_scissor.render(state);
        } else {
            R.pass_deferred.render(state);
            R.pass_post1.render(state);
            if (cfg.rampShading) {
              R.pass_toon.render(state);
            }
            if (cfg.edge > 0) {
              if (cfg.edge == 2) {

              }
              R.pass_edge.render(state);
            }
        }

    };

    /**
     * 'copy' pass: Render into g-buffers
     */
    R.pass_copy.render = function(state) {

        gl.bindFramebuffer(gl.FRAMEBUFFER,R.pass_copy.fbo);
        renderFullScreenQuad(R.progClear);
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.useProgram(R.progCopy.prog);

        var m = state.cameraMat.elements;

        gl.uniformMatrix4fv(R.progCopy.u_cameraMat, false, m);

        drawScene(state);
    };


    R.pass_debug.render = function(state) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        bindTexturesForLightPass(R.prog_Debug);
        gl.uniform1i(R.prog_Debug.u_debug, cfg.debugView);
        renderFullScreenQuad(R.prog_Debug);
    };

    /**
     * 'deferred' pass: Add lighting results for each individual light
     */
    R.pass_deferred.render = function(state) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_deferred.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);
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
        R.lastShader = R.pass_deferred;
    };
    /**
     * 'post1' pass: Perform (first) pass of post-processing
     */
    R.pass_post1.render = function(state) {
        if (cfg.edge > 0 || cfg.rampShading) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_post1.fbo);
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(R.progPost1.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, R.lastShader.colorTex);
        gl.uniform1i(R.progPost1.u_color, 0);
        renderFullScreenQuad(R.progPost1);
        R.lastShader = R.pass_post1;
    };

    R.pass_toon.render = function (state) {
      if (cfg.edge > 0) {
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
      if (cfg.edge == 2) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_edge.fbo);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.useProgram(R.prog_Edge.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, R.lastShader.colorTex);
      gl.uniform1i(R.prog_Edge.u_color, 0);
      gl.uniform2fv(R.prog_Edge.u_pixSize, [1.0 / width, 1.0 / height]);
      if (cfg.edge == 2) {
        gl.uniform1fv(R.prog_Edge.u_kernel, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
      } else {
        gl.uniform1fv(R.prog_Edge.u_kernel, [0, -2, -2, 2, 0, -2, 2, 2, 0]);
      }
      // gl.uniform1fv(R.prog_Edge.u_kernel, [-1, -1, -1, -1, 8, -1, -1, -1, -1]);
      renderFullScreenQuad(R.prog_Edge);
      R.lastShader = R.pass_edge;
      if (cfg.edge == 2) {
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

    var drawScene = function(state) {
        for (var i = 0; i < state.models.length; i++) {
            var m = state.models[i];
            readyModelForDraw(R.progCopy, m);

            drawReadyModel(m);
        }
    };

    var bindTexturesForLightPass = function(prog) {
        gl.useProgram(prog.prog);

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

        var positions = new Float32Array([
            -1.0, -1.0, 0.0,
             1.0, -1.0, 0.0,
            -1.0,  1.0, 0.0,
             1.0,  1.0, 0.0
        ]);

        var vbo = null;

        var init = function() {
            vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
            gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
        };

        return function(prog) {
            if (!vbo) {
                init();
            }
            gl.useProgram(prog.prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.enableVertexAttribArray(prog.a_position);
            gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        };
    })();
})();
