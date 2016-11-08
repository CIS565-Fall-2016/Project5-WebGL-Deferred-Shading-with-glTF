#version 100
precision highp float;
precision highp int;

uniform sampler2D u_in;
uniform sampler2D u_depth;

varying vec2 v_uv;

void main() {
  float depth = texture2D(u_depth, v_uv).x;
  if (depth >= 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    gl_FragColor = texture2D(u_in, v_uv);
  }
}
