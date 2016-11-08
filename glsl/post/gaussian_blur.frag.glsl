// Adapted from http://learnopengl.com/#!Advanced-Lighting/Bloom

#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform bool u_horizontal;
uniform int u_texWidth;
uniform int u_texHeight;
float weight[5];

void main() {

	// Gaussian lookup: http://www.sjsu.edu/faculty/gerstman/EpiInfo/z-table.htm
	weight[0] = 0.227027;
	weight[1] = 0.1945946;
	weight[2] = 0.1216216;
	weight[3] = 0.054054;
	weight[4] = 0.016216;

	vec2 texelSize = vec2(1.0 / float(u_texWidth), 1.0 / float(u_texHeight));
    vec3 color = texture2D(u_color, v_uv).rgb * weight[0]; // current frag contribution

    if (u_horizontal) {
    	for (int i = 1; i < 5; ++i) {
    		color +=  texture2D(u_color, v_uv + vec2(texelSize.x * float(i), 0.0)).rgb * weight[i];
    		color +=  texture2D(u_color, v_uv - vec2(texelSize.x * float(i), 0.0)).rgb * weight[i];
    	}
    } else {
    	for (int i = 0; i < 5; ++i) {
    		color +=  texture2D(u_color, v_uv + vec2(0.0, texelSize.y * float(i))).rgb * weight[i];
    		color +=  texture2D(u_color, v_uv - vec2(0.0, texelSize.y * float(i))).rgb * weight[i];
    	}
    }
    gl_FragColor = vec4(color, 1.0);
}
