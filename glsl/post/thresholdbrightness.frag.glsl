#version 100
precision highp float;
precision highp int;

uniform float u_threshold;
uniform sampler2D u_color;

varying vec2 v_uv;


void main()
{
    vec4 color = texture2D(u_color, v_uv);
	float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
	
	if (brightness > u_threshold)
	{
		gl_FragColor = color;
	}
}
