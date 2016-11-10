#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_old_color;
uniform vec2 u_screen_inv;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

const vec3 Gaussian = vec3(0.4, 0.25, 0.05);

void main()
{
	vec4 color = texture2D(u_color, v_uv);
	vec4 old_color = texture2D(u_old_color, v_uv);

	if (color.a == 0.0)
	{
		color = SKY_COLOR;
	}

	vec4 t2 = texture2D(u_color, vec2(v_uv.x, v_uv.y - u_screen_inv.y * 2.0));
	vec4 t1 = texture2D(u_color, vec2(v_uv.x, v_uv.y - u_screen_inv.y * 1.0));
	vec4 b2 = texture2D(u_color, vec2(v_uv.x, v_uv.y + u_screen_inv.y * 2.0));
	vec4 b1 = texture2D(u_color, vec2(v_uv.x, v_uv.y + u_screen_inv.y * 1.0));

	vec4 blend = old_color + color * Gaussian.x +
		t1 * Gaussian.y + t2 * Gaussian.z +
		b1 * Gaussian.y + b2 * Gaussian.z;

	gl_FragColor = 0.7 * blend;
}