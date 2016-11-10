#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform mat4 u_prev;
uniform sampler2D u_pos;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main()
{
	vec4 color = texture2D(u_color, v_uv);

	if (color.a == 0.0)
	{
		gl_FragColor = SKY_COLOR;
		return;
	}

	vec3 pos = texture2D(u_pos, v_uv).xyz;
	vec4 prev_pos = u_prev * vec4(pos, 1.0);
	prev_pos = prev_pos / prev_pos.w;

	prev_pos = prev_pos * 0.5 + 0.5;

	vec2 velocity = ((v_uv - prev_pos.xy) * 0.35);

	vec2 coord = v_uv + velocity;

	for (int i = 0; i < 10; ++i)
	{
		color += texture2D(u_color, coord);
		coord += velocity;
	}
	gl_FragColor = color * 0.1;
}