#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform vec4 u_lightpos; 

attribute vec3 a_position;

varying vec2 v_uv;

void main() {

	 
	vec3 pos = u_lightpos.xyz;
    float rad = u_lightpos.w;
    vec4 realPos = u_cameraMat* vec4(rad*a_position+pos,1.0); //not sure, TODO double check

    gl_Position = realPos;
    v_uv = realPos.xy * 0.5 + 0.5;
}