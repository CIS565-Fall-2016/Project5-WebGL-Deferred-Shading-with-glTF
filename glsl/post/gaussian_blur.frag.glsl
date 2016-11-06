// Adapted from http://learnopengl.com/#!Advanced-Lighting/Bloom

#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform bool u_horizontal;
float weight[5];

void main() {

	// = {0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216};
	weight[0] = 0.227027;
	weight[1] = 0.1945946;
	weight[2] = 0.1216216;
	weight[3] = 0.054054;
	weight[4] = 0.016216;

	vec2 texelSize = vec2(0.01,0.01); 
    vec3 color = texture2D(u_color, v_uv).rgb * weight[0]; // current frag contribution

    if (u_horizontal) {
    	for (int i = 0; i < 5; ++i) {
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
