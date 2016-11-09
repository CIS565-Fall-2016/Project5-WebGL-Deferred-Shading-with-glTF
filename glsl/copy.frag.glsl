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
    
    vec4 colmap = texture2D(u_colmap, v_uv);
    vec4 normap = texture2D(u_normap, v_uv);

    gl_FragData[0] = vec4( v_position, v_normal.x );
    gl_FragData[1] = vec4( v_normal.y, v_normal.z, colmap.x, colmap.y );
    gl_FragData[2] = vec4( colmap.z, normap.x, normap.y, normap.z);
}
