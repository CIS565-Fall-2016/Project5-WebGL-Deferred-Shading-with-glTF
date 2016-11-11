#version 100
precision highp float;
precision highp int;

attribute vec3 a_position;
attribute vec2 a_uv_tileLightIndices;
attribute vec2 a_uv_lightData;

varying vec2 v_uv;
varying vec2 v_uv_tileLightIndices;
varying vec2 v_uv_lightData;

void main() {
    gl_Position = vec4(a_position, 1.0);
    v_uv = a_position.xy * 0.5 + 0.5;

    v_uv_tileLightIndices = a_uv_tileLightIndices;
	v_uv vec2 a_uv_lightData;

}
