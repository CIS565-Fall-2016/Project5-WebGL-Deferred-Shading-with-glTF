#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMtx;
uniform mat4 u_worldMtx;

attribute vec3 a_position;
varying vec2 v_uv;

void main() {
    gl_Position = u_cameraMtx * u_worldMtx * vec4(a_position, 1.0);
}
