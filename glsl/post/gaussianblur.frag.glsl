#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color; // brightness texture (may be blurred before)
uniform bool isHorizontal;
uniform float weights[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

varying vec2 v_uv;

void main()
{
	vec2 pixelSize = 1.0 / textureSize(u_color, 0);
    vec3 result = texture2D(u_color, v_uv).rgb * weights[0];
}
