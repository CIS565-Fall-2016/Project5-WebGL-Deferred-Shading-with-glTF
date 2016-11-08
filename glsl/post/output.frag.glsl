#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;

uniform bool u_bloomEnabled;
uniform sampler2D u_brightness;

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

	if (u_bloomEnabled)
	{
		vec3 brightness = texture2D(u_brightness, v_uv).rgb;
		gl_FragColor = vec4(color.rgb + brightness, 1.0);
	}
	else
	{
		gl_FragColor = color;
	}
}
