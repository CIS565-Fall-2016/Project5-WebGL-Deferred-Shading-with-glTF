#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixWidthHeight;

varying vec2 v_uv;

void main() {
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(-1, -1)) * 0.077847;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(0, -1)) * 0.123317;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(1, -1)) * 0.077847;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(-1, 0)) * 0.123317;
  color += texture2D(u_color, v_uv) * 0.195346;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(1, 0)) * 0.123317;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(-1, 1)) * 0.077847;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(0, 1)) * 0.123317;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * vec2(1, 1)) * 0.077847;
  gl_FragColor = color;
}
