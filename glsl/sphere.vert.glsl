#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform vec3 u_offsetpos;
uniform float u_rad;

void main() {
	vec3 position = a_position*u_rad + u_offsetpos;
	gl_Position = u_cameraMat * vec4(position, 1.0);
	//gl_Position = vec4(position, 1.0);

}
