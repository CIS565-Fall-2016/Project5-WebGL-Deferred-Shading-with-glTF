#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_pixWidthHeight;

varying vec2 v_uv;

vec4 col(int x, int y, float f) {
  vec4 c = texture2D(u_color, v_uv + u_pixWidthHeight * vec2(x, y)) * f;
  return vec4(c.rgb, 0.0);
}

void main() {
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += col(-2, -2, 0.003765);
  color += col(-2, -1, 0.015019);
  color += col(-2, 0, 0.023792);
  color += col(-2, 1, 0.015019);
  color += col(-2, 2, 0.003765);

  color += col(-1, -2, 0.015019);
  color += col(-1, -1, 0.059912);
  color += col(-1, 0, 0.094907);
  color += col(-1, 1, 0.059912);
  color += col(-1, 2, 0.015019);

  color += col(0, -2, 0.023792);
  color += col(0, -1, 0.094907);
  color += col(0, 0, 0.150342);
  color += col(0, 1, 0.094907);
  color += col(0, 2, 0.023792);
  
  color += col(1, -2, 0.015019);
  color += col(1, -1, 0.059912);
  color += col(1, 0, 0.094907);
  color += col(1, 1, 0.059912);
  color += col(1, 2, 0.015019);

  color += col(2, -2, 0.003765);
  color += col(2, -1, 0.015019);
  color += col(2, 0, 0.023792);
  color += col(2, 1, 0.015019);
  color += col(2, 2, 0.003765);

  gl_FragColor = color;
}
