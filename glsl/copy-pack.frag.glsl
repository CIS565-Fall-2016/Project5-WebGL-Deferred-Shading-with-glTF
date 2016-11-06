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
    gl_FragData[0] = vec4( v_position, 1.0 );
    vec4 normap = texture2D(u_normap, v_uv);
    gl_FragData[1] = vec4( v_normal.x, v_normal.y, normap.x, normap.y );
    gl_FragData[2] = texture2D(u_colmap, v_uv);
}
