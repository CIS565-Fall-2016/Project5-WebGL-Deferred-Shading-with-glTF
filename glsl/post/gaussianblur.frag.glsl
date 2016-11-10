#version 100
precision highp float;
precision highp int;

uniform vec2 u_imgDim;
uniform sampler2D u_color; // brightness texture (may be blurred before)
uniform bool u_isHorizontal;

varying vec2 v_uv;

void main()
{	
	vec2 offset = 1.0 / u_imgDim * vec2(u_isHorizontal, !u_isHorizontal);
    vec3 result = texture2D(u_color, v_uv).rgb * 0.227027;
	
	result += texture2D(u_color, v_uv + offset).rgb * 0.1945946;
	result += texture2D(u_color, v_uv - offset).rgb * 0.1945946;
	result += texture2D(u_color, v_uv + 2.0 * offset).rgb * 0.1216216;
	result += texture2D(u_color, v_uv - 2.0 * offset).rgb * 0.1216216;
	result += texture2D(u_color, v_uv + 3.0 * offset).rgb * 0.054054;
	result += texture2D(u_color, v_uv - 3.0 * offset).rgb * 0.054054;
	result += texture2D(u_color, v_uv + 4.0 * offset).rgb * 0.016216;
	result += texture2D(u_color, v_uv - 4.0 * offset).rgb * 0.016216;
	
	gl_FragColor = vec4(result, 1.0);
}
