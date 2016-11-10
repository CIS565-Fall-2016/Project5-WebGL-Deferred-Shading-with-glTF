#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_screen_inv;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

const vec3 Gaussian = vec3(0.4, 0.25, 0.05);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
		color = SKY_COLOR;
    } 

	vec4 l2 = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x * 2.0, v_uv.y));
	vec4 l1 = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x * 1.0, v_uv.y));
	vec4 r2 = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x * 2.0, v_uv.y));
	vec4 r1 = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x * 1.0, v_uv.y));

	gl_FragColor = color * Gaussian.x; +
		l2 * Gaussian.z + l1 * Gaussian.y +
		r2 * Gaussian.z + r1 * Gaussian.y;
}
