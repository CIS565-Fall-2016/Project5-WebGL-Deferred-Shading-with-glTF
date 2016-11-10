#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_old_color;
uniform vec2 u_screen_inv;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
	vec4 color = texture2D(u_color, v_uv);
	vec4 old_color = texture2D(u_old_color, v_uv);

	vec4 t1 = texture2D(u_color, vec2(v_uv.x, v_uv.y - u_screen_inv.y));
	vec4 t1l = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x, v_uv.y - u_screen_inv.y));
	vec4 t1r = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x, v_uv.y - u_screen_inv.y));

	vec4 b1 = texture2D(u_color, vec2(v_uv.x, v_uv.y + u_screen_inv.y));
	vec4 b1l = texture2D(u_color, vec2(v_uv.x - u_screen_inv.x, v_uv.y + u_screen_inv.y));
	vec4 b1r = texture2D(u_color, vec2(v_uv.x + u_screen_inv.x, v_uv.y + u_screen_inv.y));

	vec4 blend = -t1 - t1l - t1r + b1 + b1l + b1r;
	float edge = max(max(blend.x, blend.y), blend.z);

	if (edge <= 0.3)
	{
		blend = vec4(0.0, 0.0, 0.0, 1.0);
	}
	else
	{
		blend = vec4(1.0);
	}

	gl_FragColor = (1.0 - blend) * old_color;
}
