#version 100
precision highp float;
precision highp int;

//http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html
//http://john-chapman-graphics.blogspot.com/2013/01/what-is-motion-blur-motion-pictures-are.html
//Help! Motion Blur.....

uniform sampler2D u_color;

varying vec2 v_uv;

#define NUM_GBUFFERS 4
uniform mat4 u_prevProj;
uniform mat4 u_invMat;
uniform sampler2D u_depth;
uniform sampler2D u_worldPos;
uniform vec3 u_camPos;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
	vec4 color = texture2D(u_color, v_uv);//extract color at (u,v)
	if (color.a == 0.0) {
			gl_FragColor = SKY_COLOR;
			return;
	}
	vec2 texCoords = v_uv;
	float depth = texture2D(u_depth, v_uv).x;
	if(depth == 1.0) {
			gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
			return;
	}
	vec4 gb0 = texture2D(u_worldPos, v_uv);
	vec3 pos = gb0.xyz;
	//HLSL vs GLSL
	vec4 cur_pos = vec4(v_uv.x * 2.0 - 1.0,  v_uv.y * 2.0 - 1.0, depth, 1.0);
	vec4 prev_pos =  u_prevProj * vec4(pos, 1.0);
	prev_pos /= prev_pos.w;
	//blur vector got! then we could calculate velocity
	vec2 velocity = (cur_pos.xy - prev_pos.xy) / 2.0;
	texCoords += velocity;

//numofsamples = 8 here ?
	for (int i = 0; i < 8; i++) {
		vec4 temp_col = texture2D(u_color, texCoords);
		color += temp_col;
		texCoords += velocity;
	}
	gl_FragColor = color / 8.0;
	
}
