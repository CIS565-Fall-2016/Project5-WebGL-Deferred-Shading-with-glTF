#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;
uniform sampler2D u_depth;

uniform mat4 screenToWorld;
uniform mat4 proj;


void main() {
// TODO: how to calculate w?
    float depth = texture2D(u_depth, v_uv).x;
    vec4 H = vec4(v_uv, depth, w) / w; // TODO: is v_uv the right thing??
    gl_Position = vec4(a_position, 1.0);
    v_uv = a_position.xy * 0.5 + 0.5;
}
