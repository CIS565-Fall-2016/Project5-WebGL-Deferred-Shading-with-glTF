#version 100
//#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_color;

varying vec2 v_uv;

uniform int u_horizontal;
uniform vec2 u_textureSize;
const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

// uniform float weight[5] = float[] (0.227027, 0.1945946, 0.1216216,
// 	0.054054, 0.016216);

void main() {
	vec2 tex_offset = 1.0 / u_textureSize;
    vec4 color = texture2D(u_color, v_uv);
    vec3 result = color.rgb * w0;

    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }
	if (u_horizontal == 1)
	{
		result += texture2D(u_color, v_uv + vec2(tex_offset.x * 1.0, 0.0)).rgb * w1;
		result += texture2D(u_color, v_uv - vec2(tex_offset.x * 1.0, 0.0)).rgb * w1;
		result += texture2D(u_color, v_uv + vec2(tex_offset.x * 2.0, 0.0)).rgb * w2;
		result += texture2D(u_color, v_uv - vec2(tex_offset.x * 2.0, 0.0)).rgb * w2;
		result += texture2D(u_color, v_uv + vec2(tex_offset.x * 3.0, 0.0)).rgb * w3;
		result += texture2D(u_color, v_uv - vec2(tex_offset.x * 3.0, 0.0)).rgb * w3;
		result += texture2D(u_color, v_uv + vec2(tex_offset.x * 4.0, 0.0)).rgb * w4;
		result += texture2D(u_color, v_uv - vec2(tex_offset.x * 4.0, 0.0)).rgb * w4;
	}
	else
	{
		result += texture2D(u_color, v_uv + vec2(0.0, tex_offset.y * 1.0)).rgb * w1;
		result += texture2D(u_color, v_uv - vec2(0.0, tex_offset.y * 1.0)).rgb * w1;
		result += texture2D(u_color, v_uv + vec2(0.0, tex_offset.y * 2.0)).rgb * w2;
		result += texture2D(u_color, v_uv - vec2(0.0, tex_offset.y * 2.0)).rgb * w2;
		result += texture2D(u_color, v_uv + vec2(0.0, tex_offset.y * 3.0)).rgb * w3;
		result += texture2D(u_color, v_uv - vec2(0.0, tex_offset.y * 3.0)).rgb * w3;
		result += texture2D(u_color, v_uv + vec2(0.0, tex_offset.y * 4.0)).rgb * w4;
		result += texture2D(u_color, v_uv - vec2(0.0, tex_offset.y * 4.0)).rgb * w4;	
	}

    //gl_FragColor = vec4(result, 1.0);
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
