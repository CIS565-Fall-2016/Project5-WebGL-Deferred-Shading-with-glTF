function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

(function() {
    'use strict';

    window.R = {};
    R.pass_copy = {};
    R.pass_debug = {};
    R.pass_deferred = {};
    R.pass_tile_deferred = {};
    R.pass_bloom = {};
    R.pass_final = {};
    R.lights = [];

    R.NUM_GBUFFERS = 2;

    /**
     * Set up the deferred pipeline framebuffer objects and textures.
     */
    R.deferredSetup = function() {
        setupLights();
        loadAllShaderPrograms();
        R.pass_copy.setup();
        R.pass_deferred.setup();
        R.pass_tile_deferred.setup();
        R.pass_bloom.setup();
    };

    // TODO: Edit if you want to change the light initial positions
    R.light_min = [-14, 0, -6];
    R.light_max = [14, 18, 6];
    R.light_dt = -0.03;
    R.LIGHT_RADIUS = 4.0;
    R.NUM_LIGHTS = parseInt(getParameterByName("lights")) || 200;
    var setupLights = function() {
        Math.seedrandom(0);

        var posfn = function() {
            var r = [0, 0, 0];
            for (var i = 0; i < 3; i++) {
                var mn = R.light_min[i];
                var mx = R.light_max[i];
                r[i] = Math.random() * (mx - mn) + mn;
            }
            return r;
        };

        for (var i = 0; i < R.NUM_LIGHTS; i++) {
            R.lights.push({
                pos: posfn(),
                col: [
                    1 + Math.random(),
                    1 + Math.random(),
                    1 + Math.random()],
                rad: R.LIGHT_RADIUS
            });
        }
    };

    /**
     * Create/configure framebuffer between "copy" and "deferred" stages
     */
    R.pass_copy.setup = function() {
        // * Create the FBO
        R.pass_copy.fbo = gl.createFramebuffer();
        // * Create, bind, and store a depth target texture for the FBO
        R.pass_copy.depthTex = createAndBindDepthTargetTexture(R.pass_copy.fbo);

        // * Create, bind, and store "color" target textures for the FBO
        R.pass_copy.gbufs = [];
        var attachments = [];
        for (var i = 0; i < R.NUM_GBUFFERS; i++) {
            var attachment = gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL'];
            var tex = createAndBindColorTargetTexture(R.pass_copy.fbo, attachment);
            R.pass_copy.gbufs.push(tex);
            attachments.push(attachment);
        }

        // * Check for framebuffer errors
        abortIfFramebufferIncomplete(R.pass_copy.fbo);
        // * Tell the WEBGL_draw_buffers extension which FBO attachments are
        //   being used. (This extension allows for multiple render targets.)
        gl_draw_buffers.drawBuffersWEBGL(attachments);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    /**
     * Create/configure framebuffer between "deferred" and "post1" stages
     */
    R.pass_deferred.setup = function() {
        // * Create the FBO
        R.pass_deferred.fbo = gl.createFramebuffer();
        // * Create, bind, and store a single color target texture for the FBO
        R.pass_deferred.colorTex = createAndBindColorTargetTexture(
            R.pass_deferred.fbo, gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL);

        // * Check for framebuffer errors
        abortIfFramebufferIncomplete(R.pass_deferred.fbo);
        // * Tell the WEBGL_draw_buffers extension which FBO attachments are
        //   being used. (This extension allows for multiple render targets.)
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    R.pass_tile_deferred.setup = function() {
        var ext_tex_float = gl.getExtension("OES_texture_float");
        var ext_depth_tex = gl.getExtension("WEBGL_depth_texture");
        var ext_frag_depth = gl.getExtension("EXT_frag_depth");

        R.pass_tile_deferred.fbo = gl.createFramebuffer();

        R.pass_tile_deferred.colorTex = createAndBindColorTargetTexture(
            R.pass_tile_deferred.fbo, gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL);

        abortIfFramebufferIncomplete(R.pass_tile_deferred.fbo);

        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);


        // R.pass_tile_deferred.light_tex = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.light_tex);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // 7 components: x, y, z, r, g, b, radius
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, R.lights.length, 2, 0, gl.RGBA, gl.FLOAT, null);
        // R.pass_tile_deferred.light_buffer = new Float32Array(R.lights.length * 8);
        R.pass_tile_deferred.light_data = computeBuffer(R.lights.length, 7);

        R.pass_tile_deferred.tile_size = 32;
        R.pass_tile_deferred.nTiles = (
            Math.ceil(width / R.pass_tile_deferred.tile_size) * 
            Math.ceil(height / R.pass_tile_deferred.tile_size)
        );

        console.log(Math.ceil(width / R.pass_tile_deferred.tile_size))

        R.pass_tile_deferred.tile_data = computeBuffer(
            R.pass_tile_deferred.nTiles,
            R.lights.length
        )

        R.pass_tile_deferred.fbo = gl.createFramebuffer();
        
        R.pass_tile_deferred.fboOut = gl.createFramebuffer();
        R.pass_tile_deferred.colorTex = createAndBindColorTargetTexture(
            R.pass_tile_deferred.fboOut, gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL);
        
        // R.pass_tile_deferred.light_mask = gl.createFramebuffer();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, R.pass_tile_deferred.light_mask);

        // R.pass_tile_deferred.tile_tex = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, R.pass_tile_deferred.tile_tex);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // 2 components: offset, count
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 
        //          R.lights.length, 2, 0, gl.DEPTH_COMPONENT, 
        //          gl.UNSIGNED_INT, null);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, 
        //          nTILES, Math.ceil(R.lights.length / 24), 0, gl.DEPTH_STENCIL, 
        //          ext_depth_tex.UNSIGNED_INT_24_8_WEBGL, null);
        // gl.framebufferTexture2D(
        //     gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D,  R.pass_tile_deferred.tile_tex, 0);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, nTILES, R.lights.length / 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // gl.framebufferTexture2D(
        //     gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,  R.pass_tile_deferred.tile_tex, 0);

        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.bindTexture(gl.TEXTURE_2D, null);
        
    };

    R.pass_bloom.setup = function() {

        R.pass_bloom.fbos = [
            gl.createFramebuffer(),
            gl.createFramebuffer()
        ];

        // * Create, bind, and store "color" target textures for the FBO
        R.pass_bloom.bufs = [
            createAndBindColorTargetTexture(R.pass_bloom.fbos[0], gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL),
            createAndBindColorTargetTexture(R.pass_bloom.fbos[1], gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL)
        ];

        // * Check for framebuffer errors
        abortIfFramebufferIncomplete(R.pass_bloom.fbos[0]);
        abortIfFramebufferIncomplete(R.pass_bloom.fbos[1]);

        // * Tell the WEBGL_draw_buffers extension which FBO attachments are
        //   being used. (This extension allows for multiple render targets.)
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {
        loadShaderProgram(gl, 'glsl/copy.vert.glsl', 'glsl/copy.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_colmap    = gl.getUniformLocation(prog, 'u_colmap');
                p.u_normap    = gl.getUniformLocation(prog, 'u_normap');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');
                p.a_normal    = gl.getAttribLocation(prog, 'a_normal');
                p.a_uv        = gl.getAttribLocation(prog, 'a_uv');

                // Save the object into this variable for access later
                R.progCopy = p;
            });

        loadShaderProgram(gl, 'glsl/quad.vert.glsl', 'glsl/red.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                R.progRed = { prog: prog };
            });
        
        loadShaderProgram(gl, 'glsl/quad.vert.glsl', 'glsl/debug.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                R.progDebug = { 
                    prog: prog,
                    u_color: gl.getUniformLocation(prog, 'u_color')
                };
            });

        loadShaderProgram(gl, 'glsl/quad.vert.glsl', 'glsl/clear.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                R.progClear = { prog: prog };
            });

        loadDeferredProgram('ambient', function(p) {
            // Save the object into this variable for access later
            R.prog_Ambient = p;
        });

        loadDeferredProgram('blinnphong-pointlight', function(p) {
            // Save the object into this variable for access later
            p.u_cameraPos = gl.getUniformLocation(p.prog, 'u_cameraPos');
            p.u_lightPos = gl.getUniformLocation(p.prog, 'u_lightPos');
            p.u_lightCol = gl.getUniformLocation(p.prog, 'u_lightCol');
            p.u_lightRad = gl.getUniformLocation(p.prog, 'u_lightRad');
            R.prog_BlinnPhong_PointLight = p;
        });

        loadDeferredProgram('blinnphong-pointlight-tiled', function(p) {
            p.u_nlights = gl.getUniformLocation(p.prog, 'u_nlights')
            p.u_ntiles = gl.getUniformLocation(p.prog, 'u_ntiles')
            p.u_tilesize = gl.getUniformLocation(p.prog, 'u_tilesize')
            p.u_resolution = gl.getUniformLocation(p.prog, 'u_resolution')
            p.u_cameraPos = gl.getUniformLocation(p.prog, 'u_cameraPos');
            p.u_lightbuffer = gl.getUniformLocation(p.prog, 'u_lightbuffer');
            p.u_tilebuffer = gl.getUniformLocation(p.prog, 'u_tilebuffer');
            p.u_debug = gl.getUniformLocation(p.prog, 'u_debug');
            R.prog_BlinnPhong_PointLight_Tiled = p;
        });

        loadDeferredProgram('debug', function(p) {
            p.u_debug = gl.getUniformLocation(p.prog, 'u_debug');
            // Save the object into this variable for access later
            R.prog_Debug = p;
        });

        loadPostProgram('highlights', function(p) {
            p.u_color    = gl.getUniformLocation(p.prog, 'u_color');
            // Save the object into this variable for access later
            R.progHighlights = p;
        });

        loadPostProgram('blur', function(p) {
            p.u_color = gl.getUniformLocation(p.prog, 'u_color');
            p.u_resolution = gl.getUniformLocation(p.prog, 'u_resolution');
            p.u_amount = gl.getUniformLocation(p.prog, 'u_amount');
            p.u_dir = gl.getUniformLocation(p.prog, 'u_dir');

            R.progBlur = p;
        })

        loadPostProgram('final', function(p) {
            p.u_color = gl.getUniformLocation(p.prog, 'u_color');
            R.progFinal = p;
        })

        loadPostProgram('mapToTiles', function(p) {
            p.u_nlights = gl.getUniformLocation(p.prog, 'u_nlights')
            p.u_ntiles = gl.getUniformLocation(p.prog, 'u_ntiles')
            p.u_tilesize = gl.getUniformLocation(p.prog, 'u_tilesize')
            p.u_resolution = gl.getUniformLocation(p.prog, 'u_resolution')
            p.u_lightbuffer = gl.getUniformLocation(p.prog, 'u_lightbuffer')
            p.u_viewMat = gl.getUniformLocation(p.prog, 'u_viewMat')
            p.u_projMat = gl.getUniformLocation(p.prog, 'u_projMat')

            R.progMapToTiles = p;
        })

        // TODO: If you add more passes, load and set up their shader programs.
    };

    var loadDeferredProgram = function(name, callback) {
        loadShaderProgram(gl, 'glsl/quad.vert.glsl',
                          'glsl/deferred/' + name + '.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_gbufs = [];
                for (var i = 0; i < R.NUM_GBUFFERS; i++) {
                    p.u_gbufs[i] = gl.getUniformLocation(prog, 'u_gbufs[' + i + ']');
                }
                p.u_depth    = gl.getUniformLocation(prog, 'u_depth');
                p.a_position = gl.getAttribLocation(prog, 'a_position');

                callback(p);
            });
    };

    var loadPostProgram = function(name, callback) {
        loadShaderProgram(gl, 'glsl/quad.vert.glsl',
                          'glsl/post/' + name + '.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.a_position = gl.getAttribLocation(prog, 'a_position');

                callback(p);
            });
    };

    var createAndBindDepthTargetTexture = function(fbo) {
        var depthTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
            gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);

        return depthTex;
    };

    var createAndBindColorTargetTexture = function(fbo, attachment) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;
    };
})();
