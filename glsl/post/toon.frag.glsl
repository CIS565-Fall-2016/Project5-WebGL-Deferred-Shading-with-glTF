#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixSize;
uniform float u_kernel[9];
uniform float u_bands;

varying vec2 v_uv;

float intensity(vec4 color) {
  return (color.x + color.y + color.z) / 3.0;
}

float band(float value) {
  return floor(value * u_bands) / u_bands;
}

void main() {
  vec4 color = texture2D(u_color, v_uv);
  gl_FragColor = vec4(band(color.x), band(color.y), band(color.z), 1.0);
}
