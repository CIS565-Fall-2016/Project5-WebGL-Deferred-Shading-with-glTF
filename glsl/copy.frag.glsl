#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform bool u_packNormals;
uniform sampler2D u_colmap;
uniform sampler2D u_normap;
uniform float u_specmap;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
    // You can use the GLSL texture2D function to access the textures using
    // the UV in v_uv.

     gl_FragData[0] = vec4( v_position, u_specmap );
     gl_FragData[2] = texture2D(u_colmap, v_uv);
     if (u_packNormals) {
        gl_FragData[1] = vec4( v_normal.xy, texture2D(u_normap, v_uv).xy );
     }
     else {
        gl_FragData[1] = vec4( v_normal, 1.0 );
        gl_FragData[3] = texture2D(u_normap, v_uv);
     }
}
