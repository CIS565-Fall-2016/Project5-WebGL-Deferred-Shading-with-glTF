#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform mat4 u_cameraMat; // proj * view
uniform mat4 u_viewMat;

attribute vec3 a_position; // in world space
attribute vec3 a_normal; // in world space
attribute vec2 a_uv;

// varying vec3 v_position; // in eye space
varying vec3 v_normal; // in eye space
varying vec2 v_uv;

void main() {
    gl_Position = u_cameraMat * vec4(a_position, 1.0);
    // v_position = vec3(u_viewMat * vec4(a_position, 1.0));
    v_normal = vec3(u_viewMat * vec4(a_normal, 0.0));
    v_uv = a_uv;
}
