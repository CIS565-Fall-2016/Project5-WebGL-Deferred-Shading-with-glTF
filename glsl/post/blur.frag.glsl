#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_bright;
uniform bool u_horizontal;
uniform vec4 u_weight;
uniform vec2 u_screenSize;

varying vec2 v_uv;

void main() {
    vec4 brightColor = texture2D(u_bright, v_uv);
	vec2 offset = 1. / u_screenSize;
	vec3 result = texture2D(u_bright, v_uv).rgb * 0.227027;

	if (u_horizontal) {
		float os = 0.;
		for (int i = 1; i < 5; ++i) {
			os += offset.x;
			result += texture2D(u_bright, v_uv + vec2(os, 0.)).rgb * u_weight[i - 1];
			result += texture2D(u_bright, v_uv - vec2(os, 0.)).rgb * u_weight[i - 1];
		}
	} else {
		float os = 0.;
		for (int i = 1; i < 5; ++i) {
			os += offset.y;
			result += texture2D(u_bright, v_uv + vec2(0., os)).rgb * u_weight[i - 1];
			result += texture2D(u_bright, v_uv - vec2(0., os)).rgb * u_weight[i - 1];
		}
	}

	gl_FragColor = vec4(result, 0.);
}
