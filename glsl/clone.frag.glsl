#version 100
precision highp float;
precision highp int;

uniform sampler2D u_in;

varying vec2 v_uv;

void main() {
  gl_FragColor = texture2D(u_in, v_uv);
}
