#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixWidthHeight;
uniform vec2 u_direction;

varying vec2 v_uv;

void main() {
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += texture2D(u_color, v_uv + u_pixWidthHeight * -u_direction) * 0.27901;
  color += texture2D(u_color, v_uv) * 0.44198;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * u_direction) * 0.27901;
  gl_FragColor = color;
}
