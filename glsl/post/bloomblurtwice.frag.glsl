#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_originalcolor;
varying vec2 v_uv;

uniform vec2 u_texture;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

//http://prideout.net/archive/bloom/
void main() {
  vec2 per_pix = vec2(1.0,1.0) / u_texture;
	vec4 gauss = vec4(10.0,8.0,5.0,2.0);
  gauss *= (1.0 / 25.0);
  vec4 color = vec4 (0.0,0.0,0.0,0.0);
  color += texture2D(u_color, v_uv + per_pix * vec2(0, 0)) * gauss[0];
  for(int i = 1; i <= 3; i++) {
     color += texture2D(u_color, v_uv + per_pix * vec2(0, -1 * i)) * gauss[i];    //extract the position's color
     color += texture2D(u_color, v_uv + per_pix * vec2(0, i)) * gauss[i];
  }
  gl_FragColor = color;

  vec4 originalcolor = texture2D(u_originalcolor, v_uv);
// refer to one.frag.glsl
  // if (color.a == 0.0) {
  //     gl_FragColor = SKY_COLOR;
  //     return;
  // }

  if (originalcolor.a == 0.0) {
      originalcolor = SKY_COLOR;
  }
  gl_FragColor = color + originalcolor;
}
