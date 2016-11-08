#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_glow;

varying vec2 v_uv;

void main() {
  vec4 color = texture2D(u_color, v_uv);
  vec4 glow = texture2D(u_glow, v_uv);
  gl_FragColor = vec4((color + glow).rgb, 1.0);
}
