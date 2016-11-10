#version 100
precision highp float;
precision highp int;

uniform vec3 u_lightPos; // in eye space
uniform float u_lightRad;
uniform mat4 u_proj;

attribute vec3 a_position;


void main()
{
	vec3 pos = a_position * 1.1 * u_lightRad + u_lightPos;
    gl_Position = u_proj * vec4(pos, 1.0);
	// gl_Position = vec4(a_position, 1.0);
}
