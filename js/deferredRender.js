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
            !R.prog_Toon ||
            !R.prog_Debug ||
            !R.progPost1 ||
            !R.progMoblur ||
            !R.progBloom)) {
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

        { // TODO: this block should be removed after testing renderFullScreenQuad
            //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // TODO: Implement/test renderFullScreenQuad first
            //renderFullScreenQuad(R.progRed);
            //renderFullScreenQuad(R.progCopy);
            //return;
        }

        R.pass_copy.render(state);

        if (cfg && cfg.debugView >= 0) {
            // Do a debug render instead of a regular render
            // Don't do any post-processing in debug mode
            R.pass_debug.render(state);
        } else {
            // * Deferred pass and postprocessing pass(es)
            // TODO: uncomment these
            R.pass_deferred.render(state);           
            R.pass_post1.render(state);

            // OPTIONAL TODO: call more postprocessing passes, if any            
            if(cfg.bloom)
            {
            	
            	//gl.enable(gl.BLEND);
                //gl.blendEquation( gl.FUNC_ADD );
                //gl.blendFunc(gl.ONE,gl.ONE);
                            	
            	            	
                gl.enable(gl.BLEND);
                gl.blendEquation( gl.FUNC_ADD );
                gl.blendFunc(gl.ONE,gl.ONE);
                //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            	
                var gauss = 0;
                if (cfg.gaussian)
                	gauss = 1;
                
                
                R.pass_bloom.render(state, gauss);
                
                //console.log('in bloom section');
                
                gl.disable(gl.BLEND);
            }
            
            //R.pass_deferred.render(state);
            var matdiff1 = R.lastCamPos;
            //console.log(matdiff);
            var matdiff2 = new THREE.Matrix4().getInverse( matdiff1 );

            //console.log(matdiff);
            var matdiff = new THREE.Matrix4().multiplyMatrices(matdiff2, state.cameraMat);
            //console.log(matdiff);
            //console.log(matdiff1);

            //R.pass_moblur.render(state, matdiff);

            // OPTIONAL TODO: call more postprocessing passes, if any            
            if(cfg.motionblur)
            {
            	
            	//gl.enable(gl.BLEND);
                //gl.blendEquation( gl.FUNC_ADD );
                //gl.blendFunc(gl.ONE,gl.ONE);
                            	
                
                //gl.enable(gl.BLEND);
                //gl.blendEquation( gl.FUNC_ADD );
                //gl.blendFunc(gl.ONE,gl.ONE);
                //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            	
                                
                R.pass_moblur.render(state, matdiff, state.cameraMat);
                
                gl.disable(gl.BLEND);
            }
            R.lastCamPos = state.cameraMat;          
        }
        //R.lastCamPos = state.cameraMat;  
    };
    //R.lastCamPos = state.cameraMat;  
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
            
            //console.log(m);
            drawReadyModel(m);
            
            
            //console.log(m);
            //console.log(R.sphereModel);
            //m = R.sphereModel;
            //readyModelForDraw(R.progCopy, m);
            //readySphereForDraw(R.progCopy, m);
            //drawReadyModel(m);
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

        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if(cfg.toon)
        	bindTexturesForLightPass(R.prog_Toon);
        else
        	bindTexturesForLightPass(R.prog_BlinnPhong_PointLight);
        
        
        //console.log(R.sphereModel);
        
        // TODO: add a loop here, over the values in R.lights, which sets the
        //   uniforms R.prog_BlinnPhong_PointLight.u_lightPos/Col/Rad etc.,
        //   then does renderFullScreenQuad(R.prog_BlinnPhong_PointLight).
        
        
        for (var i = 0; i < R.lights.length; i++)
        //for (var i = 0; i < 1; i++)
        {
            //console.log(R.lights[i]);
            
        	
            if (cfg.debugScissor)
            {
            	if (cfg.sphericalscissor)
            	{
	            	readyModelForDraw(R.progSphere, R.sphereModel);
	                //gl.enable(gl.SCISSOR_TEST);
	            
	                var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
	            
	                if (sc)
	                {//if(sc[0] > 0 && sc[1] > 0 && sc[0] + sc[2] < 800 && sc[1] + sc[3] < 800)
	                		gl.scissor(sc[0], sc[1], sc[2], sc[3]);
	                }
	                gl.enable( gl.BLEND );
	                gl.blendEquation( gl.FUNC_ADD );
	                gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	                
	                //renderFullScreenQuad(R.progRed);
	                //renderFullScreenSphere(R.progSphere);
	                //debugger;
	                gl.uniformMatrix4fv(R.progSphere.u_cameraMat, false, state.cameraMat.elements);
	                //gl.uniformMatrix4fv(R.progSphere.u_modelMat, false, state.projMat.elements);
	                gl.uniform3fv(R.progSphere.u_offsetpos, R.lights[i].pos);
	                gl.uniform1f(R.progSphere.u_rad, R.lights[i].rad);
	                
	                drawReadyModel(R.sphereModel);
	                
	                //console.log(R.sphereModel);
	                
	                gl.disable(gl.BLEND);
	                //gl.disable(gl.SCISSOR_TEST);
            	}
            	else
            	{
            		gl.enable(gl.SCISSOR_TEST);
                    
                    var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                
                    if (sc)
                    	if(sc[0] > 0 && sc[1] > 0 && sc[0] + sc[2] < 800 && sc[1] + sc[3] < 800)
                    		gl.scissor(sc[0], sc[1], sc[2], sc[3]);
                
                    gl.enable( gl.BLEND );
                    gl.blendEquation( gl.FUNC_ADD );
                    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
                    renderFullScreenQuad(R.progRed);
                    gl.disable(gl.BLEND);
                    gl.disable(gl.SCISSOR_TEST);
            	}
            	
            }
            else if(cfg.toon)
            {
            	gl.uniform3f(R.prog_Toon.u_lightPos, 
                        R.lights[i].pos[0],
                        R.lights[i].pos[1],
                        R.lights[i].pos[2]);

            	gl.uniform3f(R.prog_Toon.u_lightCol, 
                        R.lights[i].col[0],
                        R.lights[i].col[1],
                        R.lights[i].col[2]);
       

            	gl.uniform3f(R.prog_Toon.u_cameraPos, state.cameraPos.x,
					       							  state.cameraPos.y,
					       							  state.cameraPos.z);
                
            	
            	gl.uniform1f(R.prog_Toon.u_lightRad, R.lights[i].rad);

            	if (cfg.enablescissor)
                {
                	gl.enable(gl.SCISSOR_TEST);
                	var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                	if (sc)
                		gl.scissor(sc[0], sc[1], sc[2], sc[3]);
                	
                	renderFullScreenQuad(R.prog_Toon);
                    
                    gl.disable(gl.SCISSOR_TEST);
                }
                else
                	renderFullScreenQuad(R.prog_Toon);
            }
            else
            {
            	//debugger;
                gl.uniform3f(R.prog_BlinnPhong_PointLight.u_lightPos, 
                             R.lights[i].pos[0],
                             R.lights[i].pos[1],
                             R.lights[i].pos[2]);
                //debugger;
                gl.uniform3f(R.prog_BlinnPhong_PointLight.u_lightCol, 
                             R.lights[i].col[0],
                             R.lights[i].col[1],
                             R.lights[i].col[2]);
            

                
                gl.uniform3f(R.prog_BlinnPhong_PointLight.u_cameraPos,
                			state.cameraPos.x,
                		    state.cameraPos.y,
                		    state.cameraPos.z);
                
                //console.log([state.cameraPos.x, state.cameraPos.y, state.cameraPos.z]);

                
                gl.uniform1f(R.prog_BlinnPhong_PointLight.u_lightRad, R.lights[i].rad);


            // TODO: In the lighting loop, use the scissor test optimization
            // Enable gl.SCISSOR_TEST, render all lights, then disable it.
            // getScissorForLight returns null if the scissor is off the screen.
            // Otherwise, it returns an array [xmin, ymin, width, height].
            //
            

                if (cfg.enablescissor)
                {
                	gl.enable(gl.SCISSOR_TEST);
                	var sc = getScissorForLight(state.viewMat, state.projMat, R.lights[i]);
                	if (sc)
                		gl.scissor(sc[0], sc[1], sc[2], sc[3]);
                	
                	renderFullScreenQuad(R.prog_BlinnPhong_PointLight);
                    
                    gl.disable(gl.SCISSOR_TEST);
                }
                else
                	renderFullScreenQuad(R.prog_BlinnPhong_PointLight);

            }
            //console.log(state.viewMat);
            //console.log(R.lastCamPos);



            // Disable blending so that it doesn't affect other code
        }
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
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);

        // Configure the R.progPost1.u_color uniform to point at texture unit 0
        gl.uniform1i(R.progPost1.u_color, 0);

        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progPost1);
    };
    
    R.pass_bloom.render = function(state, gauss) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progBloom.prog);


        
        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        // TODO: uncomment
        gl.activeTexture(gl.TEXTURE1);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        // TODO: uncomment
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);

        // Configure the R.progBloom.u_color uniform to point at texture unit 1
        //gl.uniform1i(R.progBloom.u_color, 1);
        gl.uniform1i(R.progBloom.u_gauss, gauss);


        //console.log(gauss);
        //gl.uniform1i(R.progBloom.u_gauss, gauss);
        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progBloom);
    };
    
    R.pass_moblur.render = function(state, matdiff, cameraMat) {
        // * Unbind any existing framebuffer (if there are no more passes)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // * Clear the framebuffer depth to 1.0
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // * Bind the postprocessing shader program
        gl.useProgram(R.progMoblur.prog);


        // * Bind the deferred pass's color output as a texture input
        // Set gl.TEXTURE0 as the gl.activeTexture unit
        // TODO: uncomment
        
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);
        // TEST PASSES FOR POSITION STORING
        //bindTexturesForLightPass(R.progMoblur);
        //gl.bindTexture(gl.TEXTURE_2D, R.pass_moblur.gbufs);
        //gl.uniform1i(R.progMoblur.u_gbufs, 0);
        
        gl.bindTexture(gl.TEXTURE_2D, R.pass_copy.gbufs[0]);
        //gl.uniform1i(R.progMoblur.u_texture, R.progBloom.u_texture);
        gl.uniform1i(R.progMoblur.u_gbufs, R.pass_copy.gbufs[0]);
        gl.uniformMatrix4fv(R.progMoblur.u_cameraMat, false, cameraMat.elements);
        
        gl.activeTexture(gl.TEXTURE0);

        // Bind the TEXTURE_2D, R.pass_deferred.colorTex to the active texture unit
        // TODO: uncomment
        gl.bindTexture(gl.TEXTURE_2D, R.pass_deferred.colorTex);

        // Configure the R.progBloom.u_color uniform to point at texture unit 2
        gl.uniform1i(R.progMoblur.u_color, 2);
        
        
        //console.log(matdiff);
        
        gl.uniformMatrix4fv(R.progMoblur.u_matdiff, false, matdiff.elements);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //console.log(gauss);
        //gl.uniform1i(R.progBloom.u_gauss, gauss);
        // * Render a fullscreen quad to perform shading on
        renderFullScreenQuad(R.progMoblur);
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
    /*
    var renderFullScreenSphere = (function() {
        // The variables in this function are private to the implementation of
        // renderFullScreenQuad. They work like static local variables in C++.

        // Create an array of floats, where each set of 3 is a vertex position.
        // You can render in normalized device coordinates (NDC) so that the
        // vertex shader doesn't have to do any transformation; draw two
        // triangles which cover the screen over x = -1..1 and y = -1..1.
        // This array is set up to use gl.drawArrays with gl.TRIANGLE_STRIP.
        
    	
		
    	var positions = R.sphereModel.position;
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
    */
})();
