#version 100
precision highp float;
precision highp int;

#define NUM_SAMPLES 9

uniform float u_scale;
uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform mat4 u_preViewProj;
uniform mat4 u_viewProjInverse;

varying vec2 v_uv;


void main()
{
	vec2 texCoord = v_uv;
	float zOverW = texture2D(u_depth, texCoord).x * 2.0 - 1.0;
	vec4 ndcCoord = vec4(texCoord * 2.0 - 1.0, zOverW, 1.0);
	vec4 worldPos = u_viewProjInverse * ndcCoord;
	worldPos /= worldPos.w;
	vec4 preNdcPos = u_preViewProj * worldPos;
	preNdcPos /= preNdcPos.w;
	
	vec2 vel = (ndcCoord.xy - preNdcPos.xy) * (u_scale / float(NUM_SAMPLES - 1));

    vec4 color = texture2D(u_color, texCoord);
	
	for (int i = 1; i < NUM_SAMPLES; ++i)
	{
		texCoord += vel;
		color += texture2D(u_color, texCoord);
	}
	
	gl_FragColor = color / float(NUM_SAMPLES);
}
