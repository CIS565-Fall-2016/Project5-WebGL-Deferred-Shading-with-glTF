#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixSize;
uniform float u_kernel[9];

varying vec2 v_uv;

float intensity(vec4 color) {
  return (color.x + color.y + color.z) / 3.0;
}

void main() {
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, -1)) * u_kernel[0];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(0, -1)) * u_kernel[1];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(1, -1)) * u_kernel[2];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, 0)) * u_kernel[3];
  color += texture2D(u_color, v_uv) * u_kernel[4];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(1, 0)) * u_kernel[5];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, 1)) * u_kernel[6];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(0, 1)) * u_kernel[7];
  color += texture2D(u_color, v_uv + u_pixSize * vec2(1, 1)) * u_kernel[8];
  if (intensity(color) > 0.8) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  gl_FragColor = texture2D(u_color, v_uv);
  // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
