(function() {
    'use strict';
    // deferredSetup.js must be loaded first

    R.deferredRender = function(state) {
        if (!aborted && (
            !R.progCopy ||
            !R.progRed ||
            !R.progClear ||
            !R.prog_Ambient ||
            !R.prog_Tiled_BlinnPhong_PointLight ||
            !R.prog_BlinnPhong_PointLight ||
            !R.prog_Debug ||
            !R.progPost1 ||
            !R.progGaussianBlur ||
            !R.progPostPixelated)) {
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

        if (cfg && cfg.debugView >= 0) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            R.pass_debug.render(state);
        } else {
            // * Deferred pass and postprocessing pass(es)
            // TODO: uncomment these
            if (cfg.tiledShading) {
                R.pass_tiled_deferred.render(state);
            } else {
                R.pass_deferred.render(state);
            }
            R.pass_post1.render(state);

            // OPTIONAL TODO: call more postprocessing passes, if any
            if (cfg.bloomEffect) {
                R.pass_gaussian_blur.render(state);
            }

            if (cfg.pixelateEffect) {
                R.pass_post_pixelated.render(state);
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

        // * _ADD_ together the result of each lighting pass

        // Enable blending and use gl.blendFunc to blend with:
        //   color = 1 * src_color + 1 * dst_color
        // Here is a wonderful demo of showing how blend function works:
        // http://mrdoob.github.io/webgl-blendfunctions/blendfunc.html
        // TODO: uncomment
        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // * Bind/setup the Blinn-Phong pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);

        if (cfg.scissorTest) {
            gl.enable(gl.SCISSOR_TEST);
        }

        gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_cameraPos, state.cameraPos.toArray());

        // TODO: add a loop here, over the values in R.lights, which sets the
        //   uniforms R.prog_BlinnPhong_PointLight.u_lightPos/Col/Rad etc.,
        //   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).
        for (var i = 0; i < R.lights.length; i++) {
            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightPos, R.lights[i].pos);
            gl.uniform3fv(R.prog_BlinnPhong_PointLight.u_lightCol, R.lights[i].col);
            gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, R.lights[i].rad);

            // TODO: In the lighting loop, use the scissor test optimization
            // Enable gl.SCISSOR_TEST, render all lights, then disable it.
            //
            // getScissorForLight returns null if the scissor is off the screen.
            // Otherwise, it returns an array [xmin, ymin, width, height].
            //
            if (cfg.scissorTest) {
                var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                if (sc !== undefined && sc !== null) {
                   gl.scissor(sc[0], sc[1], sc[2], sc[3]);
                }

                gl.uniform1i(R.prog_BlinnPhong_PointLight.u_debugScissor, cfg.debugScissor);
            }
            // * Render a fullscreen quad to perform shading on
            renderFullScreenQuad(R.prog_BlinnPhong_PointLight);

        }

        if (cfg.scissorTest) {
            gl.disable(gl.SCISSOR_TEST);
        }
        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
    };

    /**
     * 'deferred' pass: Add lighting results for each individual light
     */
    R.pass_tiled_deferred.render = function(state) {
        // * Bind R.pass_deferred.fbo to write into for later postprocessing
        gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_tiled_deferred.fbo);

        // * Clear depth to 1.0 and color to black
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // * _ADD_ together the result of each lighting pass

        // Enable blending and use gl.blendFunc to blend with:
        //   color = 1 * src_color + 1 * dst_color
        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind/setup the ambient pass, and render using fullscreen quad
        bindTexturesForLightPass(R.prog_Ambient);
        renderFullScreenQuad(R.prog_Ambient);

        // --- Construct tile grid by assigning lights into the corresponding slot
        clearGrid(R.tileLightIndices, R.TILE_DIM);

        for (var lightId = 0; lightId < R.lights.length; lightId++) {
            // Convert bounding box into screen space;
            var extent = getScissorForLight(state.viewMat, state.projMat, R.lights[lightId]);
            if (extent !== undefined && extent !== null) {
                insertLightExtentToGrid(R.tileLightIndices, extent, state.width, state.height, R.TILE_DIM, lightId);
            }
        }

        // Flatten the 2D array tileLightIndices into 1D to create out texture
        var tileLightIndices = [];
        for (var i = 0; i < R.tileLightIndices.length; ++i) {
            for (var j = 0; j < R.tileLightIndices[i].length; ++j) {
                tileLightIndices.push(R.tileLightIndices[i][j]);
            }
        }
        var texTileLightIndicesWidth = nearestPow2(Math.ceil(Math.sqrt(tileLightIndices.length)));
        var texTileLightIndicesArea = texTileLightIndicesWidth * texTileLightIndicesWidth
        var tileLightIndicesData = new Uint8Array(texTileLightIndicesArea);
        // Copy over the grid array
        for (var i = 0; i < tileLightIndices.length; ++i) {
            tileLightIndicesData[i] = tileLightIndices[i];
        }
        var tileLightIndicesTex = texture2DFromUint8(texTileLightIndicesWidth, tileLightIndicesData);

        // --- Compute light count and offsets for each light
        for (var i = 0; i < R.tileLightIndices.length; ++i) {
            R.tileLightCounts[i] = R.tileLightIndices[i].length;
            R.tileLightOffsets[i] = i == 0 ?
                0 :
                R.tileLightCounts[i - 1] + R.tileLightOffsets[i - 1];
        }

        var tileCount = R.TILE_DIM * R.TILE_DIM;
        var tileWidth = Math.floor(state.width / R.TILE_DIM);
        var tileHeight = Math.ceil(state.height / R.TILE_DIM);

        // -- Create textures for light info
        var lightTexWidth = Math.ceil(Math.sqrt(R.lights.length));
        var lightTexArea = lightTexWidth * lightTexWidth;
        var lightPositions = new Float32Array(lightTexArea  * 3); // vec3
        var lightColors = new Float32Array(lightTexArea * 3); // vec3
        var lightRads = new Float32Array(nearestPow2(lightTexArea)); // scalar
        for (var l = 0; l < R.lights.length; ++l) {
            var light = R.lights[l];
            for (var i = 0; i < 3; ++i) {
                lightPositions[l * 3 + i] = light.pos[i];
                lightColors[l * 3 + i] = light.col[i];
            }
            lightRads[l] = light.rad;
        }

        var lightPositionTex = texture2DFromVec3Floats(lightTexArea, lightPositions);
        var lightColorTex = texture2DFromVec3Floats(lightTexArea, lightColors);
        var lightRadTex = texture2DFromFloats(nearestPow2(lightTexArea), lightRads);


        // Bind textures
        bindTexturesForTiledLightPass(R.prog_Tiled_BlinnPhong_PointLight, lightPositionTex, lightColorTex, lightRadTex, tileLightIndicesTex);

        // -- Render for each tile!
        gl.enable(gl.SCISSOR_TEST);

        gl.uniform1i(R.prog_Tiled_BlinnPhong_PointLight.u_lightTexWidth, lightTexArea);
        gl.uniform1i(R.prog_Tiled_BlinnPhong_PointLight.u_tileLightIndicesTexWidth, texTileLightIndicesWidth);
        for (var t = 0; t < tileCount; ++t) {

            var lightCount = R.tileLightCounts[t];
            var lightOffset = R.tileLightOffsets[t];
            gl.uniform1i(R.prog_Tiled_BlinnPhong_PointLight.u_lightCount, lightCount);
            gl.uniform1i(R.prog_Tiled_BlinnPhong_PointLight.u_lightOffset, lightOffset);
            gl.uniform1i(R.prog_Tiled_BlinnPhong_PointLight.u_colorLightCountOnly, cfg.debugTiledShading);

            // Only render per tile
            var tileRow = Math.floor(t / R.TILE_DIM);
            var tileCol = Math.floor(t % R.TILE_DIM);

            // Scissor out the specific tile
            gl.scissor(tileCol * tileWidth, tileRow * tileHeight, tileWidth, tileHeight);
            renderFullScreenQuad(R.prog_Tiled_BlinnPhong_PointLight);
        }

        gl.disable(gl.SCISSOR_TEST);
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

    var bindTexturesForTiledLightPass = function(prog, lightPositionTex, lightColTex, lightRadTex, tileLightIndicesTex) {
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

        var texId = R.NUM_GBUFFERS + 1;
        gl.activeTexture(gl['TEXTURE' + texId]);
        gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
        gl.uniform1i(prog.u_lightPos, texId);

        texId++;
        gl.activeTexture(gl['TEXTURE' + texId]);
        gl.bindTexture(gl.TEXTURE_2D, lightColTex);
        gl.uniform1i(prog.u_lightCol, texId);

        texId++;
        gl.activeTexture(gl['TEXTURE' + texId]);
        gl.bindTexture(gl.TEXTURE_2D, lightRadTex);
        gl.uniform1i(prog.u_lightRad, texId);

        texId++;
        gl.activeTexture(gl['TEXTURE' + texId]);
        gl.bindTexture(gl.TEXTURE_2D, tileLightIndicesTex);
        gl.uniform1i(prog.u_tileLightIndices, texId);

    };

    var texture2DFromVec3Floats = function(width, floats) {
        var oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        gl.activeTexture(gl.TEXTURE15);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,  // target
            0,              // level
            gl.RGB,         // internalformat
            width,
            1,
            0,              // border
            gl.RGB,         // format
            gl.FLOAT,       // type
            floats
            );

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(oldActiveTexture);

        return texture;
    }

    var texture2DFromUint8 = function(width, ints) {
        var oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        gl.activeTexture(gl.TEXTURE15);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(
            gl.TEXTURE_2D,  // target
            0,              // level
            gl.ALPHA,        // internalformat
            width,
            width,
            0,              // border
            gl.ALPHA,         // format
            gl.UNSIGNED_BYTE,       // type
            ints
            );

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(oldActiveTexture);
        return texture;
    }

    var texture2DFromFloats = function(width, floats) {
        var oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        gl.activeTexture(gl.TEXTURE15);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(
            gl.TEXTURE_2D,  // target
            0,              // level
            gl.ALPHA,        // internalformat
            width,
            1,
            0,              // border
            gl.ALPHA,         // format
            gl.FLOAT,       // type
            floats
            );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(oldActiveTexture);
        return texture;
    }


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
        // TODO: uncomment
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        // TODO: uncomment
        if (cfg.tiledShading) {
            gl.bindTexture(gl.TEXTURE_2D, R.pass_tiled_deferred.colorTex);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);
        }

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progPost1.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progPost1);
    };

    R.pass_post_pixelated.render = function(state) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progPostPixelated.prog);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        // TODO: uncomment
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        // TODO: uncomment
        if (cfg.tiledShading) {
            gl.bindTexture(gl.TEXTURE_2D, R.pass_tiled_deferred.colorTex);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);
        }

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progPostPixelated.u_color, 0);

        var d = new Date();
        var t = d.getTime();
        gl.uniform1i(R.progPostPixelated.u_color, 0);
        gl.uniform1i(R.progPostPixelated.u_time, t);
        gl.uniform2f(R.progPostPixelated.u_textureSize, state.width, state.height);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progPostPixelated);
    };

    /**
     * 'pass_gaussian_blur' pass: Perform bloom pass of post-processing
     */
    R.pass_gaussian_blur.render = function(state) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE,gl.ONE);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progGaussianBlur.prog);

        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        // TODO: uncomment
        gl.activeTexture(gl.TEXTURE0);

        var horizontal = true;
        var first = true;
        var iterations = 5;
        for (var i = 0; i < iterations; i++) {
            // Pingpong buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_gaussian_blur.ping_pong_buffers[1 - i % 2]);

            if (i == iterations - 1) {
                // Last iteration, render to screen
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
            // TODO: uncomment
            gl.bindTexture(gl.TEXTURE_2D, first ? (cfg.tiledShading ? R.pass_tiled_deferred.hdrTex : R.pass_deferred.hdrTex) : R.pass_gaussian_blur.blurTex[i % 2]);

            // Configure the R.progPost1.u_color uniform to point at texture unit 0
            gl.uniform1i(R.progGaussianBlur.u_color, 0);
            gl.uniform1i(R.progGaussianBlur.u_horizontal, horizontal);
            gl.uniform1i(R.progGaussianBlur.u_texWidth, state.width);
            gl.uniform1i(R.progGaussianBlur.u_texHeight, state.height);

            // * Render a fullscreen quad to perform shading on
            renderFullScreenQuad(R.progGaussianBlur);

            horizontal = !horizontal;
            if (first) {
                first = false;
            }
        }

        // Clear buffers
        for (var i = 0; i < 2; ++i) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_gaussian_blur.ping_pong_buffers[i]);
            // * Clear depth to 1.0 and color to black
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        // Disable blending so that it doesn't affect other code
        gl.disable(gl.BLEND);
    }

    var renderTileQuad = (function() {

        var vbo = null;

        var init = function(row, col) {

            var tileSize = 2.0 / R.TILE_DIM;
            var xMin = col * tileSize - 1.0;
            var xMax = (col + 1) * tileSize - 1.0;
            var yMin = row * tileSize - 1.0;
            var yMax = (row + 1) * tileSize - 1.0;

            var positions = new Float32Array([
                xMin, yMin, 0.0,
                xMax, yMin, 0.0,
                xMin, yMax, 0.0,
                xMax, yMax, 0.0,
            ]);

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

        return function(prog, row, col) {
            if (!vbo) {
                // If the vbo hasn't been initialized, initialize it.
                init(row, col);
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
