#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_colmap;
uniform sampler2D u_normap;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
    // TODO: copy values into gl_FragData[0], [1], etc.
    // You can use the GLSL texture2D function to access the textures using
    // the UV in v_uv.

    // this gives you the idea
    gl_FragData[0] = vec4(v_position, 1.0);
    gl_FragData[1] = vec4(v_normal, 0.0);
    gl_FragData[2] = texture2D(u_colmap, v_uv);
    gl_FragData[3] = texture2D(u_normap, v_uv);


}
