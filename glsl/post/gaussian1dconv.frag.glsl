#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixWidthHeight;
uniform vec2 u_direction;

varying vec2 v_uv;

void main() {
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += texture2D(u_color, v_uv + u_pixWidthHeight * 2.0 * -u_direction) * 0.06136;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * -u_direction) * 0.24477;
  color += texture2D(u_color, v_uv) * 0.38774;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * u_direction) * 0.224477;
  color += texture2D(u_color, v_uv + u_pixWidthHeight * 2.0 * u_direction) * 0.06136;
  gl_FragColor = color;
}
