#version 100
precision highp float;
precision highp int;

uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
}
