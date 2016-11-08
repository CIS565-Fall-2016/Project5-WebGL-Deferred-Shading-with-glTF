#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_bright;

varying vec2 v_uv;

void main() {
    vec4 color = texture2D(u_color, v_uv);
	vec4 bright = texture2D(u_bright, v_uv);

    gl_FragColor = color + bright;
}
