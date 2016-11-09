#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_light;
uniform float u_height;
uniform float u_width;

varying vec2 v_uv;

const vec4 weight = vec4(0.1945946, 0.1216216, 0.054054, 0.016216);
const float weight0 = 0.227027;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);
    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    vec4 light = texture2D(u_light, v_uv);
    vec2 tex_offset = 1.0 / vec2(u_width, u_height); // gets size of texel

    // Add Gaussian blur
    vec3 result = light.rgb * weight0;
    for(int i = 0; i < 4; ++i)
    {
    	for(int j = 0; j < 4; ++j)
   		{
   			float xOffset = tex_offset.x * float(i);
   			float yOffset = tex_offset.y * float(j);
        	result += texture2D(u_light, v_uv + vec2(xOffset, yOffset)).rgb * weight[i];
        	result += texture2D(u_light, v_uv - vec2(xOffset, yOffset)).rgb * weight[i];
   		}
    }

    // Do blending
    result += color.rgb;
    gl_FragColor = vec4(result, 1.0);
}