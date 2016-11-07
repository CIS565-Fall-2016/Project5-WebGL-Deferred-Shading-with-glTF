#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
varying vec2 v_uv;

uniform vec2 u_texture;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
  vec2 per_pix = vec2(1.0,1.0) / u_texture;
	vec4 gauss = vec4(10.0,8.0,5.0,2.0);
  gauss *= (1.0 / 25.0);
  vec4 color = vec4 (0.0,0.0,0.0,0.0);
  color += texture2D(u_color, v_uv ) * gauss[0];
  for(int i = 1; i <= 3; i++) {
     color += texture2D(u_color, v_uv + per_pix * vec2(-1.0 * float(i), 0.0)) * gauss[i];    //extract the position's color
     color += texture2D(u_color, v_uv + per_pix * vec2(float(i), 0.0)) * gauss[i];
  }
  // for(int i = 1; i <= 3; i++) {
  //    color += texture2D(u_color, v_uv + 0.01 * vec2(float(i), 0.0)) * gauss[i];
  // }
//  color = vec4(per_pix,0.0, 1.0);
  gl_FragColor = color;
}
