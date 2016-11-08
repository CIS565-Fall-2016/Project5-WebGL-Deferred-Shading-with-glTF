#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform vec2 u_pixSize;
uniform float u_kernel[9];
uniform float u_focus;

varying vec2 v_uv;
#define PI 3.1415926535897932384626433
#define E 2.7182818284590452353602874
#define INV2PI 0.159154943
#define SIZE 10

float intensity(vec4 color) {
  return (color.x + color.y + color.z) / 3.0;
}

float gaussian(float x, float y, float std) {
  float invStdSqr = 1.0 / pow(std, 2.0);
  float exponent = -(pow(x, 2.0) + pow(y, 2.0)) * invStdSqr / 2.0;
  return INV2PI * invStdSqr * exp(exponent);
}

void main() {
  float depth = texture2D(u_depth, v_uv).x;
  float blur = abs(depth - u_focus);
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  float kernel[SIZE * SIZE];
  float total = 0.0;
  float g = 0.0;
  for (int i = -SIZE / 2; i <= SIZE / 2; i++) {
    for (int j = -SIZE / 2; j <= SIZE / 2; j++) {
      g = gaussian(float(i), float(j), pow(blur, 2.0) * 100.0);
      kernel[(i + SIZE / 2) * SIZE + j] = g;
      total += g;
    }
  }
  for (int i = 0; i < SIZE * SIZE; i++) {
    kernel[i] /= total;
  }
  for (int i = -SIZE / 2; i <= SIZE / 2; i++) {
    for (int j = -SIZE / 2; j <= SIZE / 2; j++) {
      color += texture2D(u_color, v_uv + u_pixSize * vec2(i, j)) * kernel[(i + SIZE / 2) * SIZE + j];
    }
  }

  gl_FragColor = color;
}
// color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, -1)) * u_kernel[0];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(0, -1)) * u_kernel[1];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(1, -1)) * u_kernel[2];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, 0)) * u_kernel[3];
// color += texture2D(u_color, v_uv) * u_kernel[4];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(1, 0)) * u_kernel[5];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(-1, 1)) * u_kernel[6];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(0, 1)) * u_kernel[7];
// color += texture2D(u_color, v_uv + u_pixSize * vec2(1, 1)) * u_kernel[8];
