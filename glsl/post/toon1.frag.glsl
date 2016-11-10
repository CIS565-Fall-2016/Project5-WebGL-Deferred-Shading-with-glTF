#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_screen_inv;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
	vec4 color = texture2D(u_color, v_uv);

	vec4 l1 = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x, v_uv.y));
	vec4 l1t = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x, v_uv.y - u_screen_inv.y));
	vec4 l1b = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x, v_uv.y + u_screen_inv.y));

	vec4 r1 = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x * 1.0, v_uv.y));
	vec4 r1t = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x, v_uv.y - u_screen_inv.y));
	vec4 r1b = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x, v_uv.y + u_screen_inv.y));

	gl_FragColor = -l1 - l1t - l1b + r1 + r1t + r1b;
}
