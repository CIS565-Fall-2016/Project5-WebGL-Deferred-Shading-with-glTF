#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 org_color = texture2D(u_color, v_uv);
	  vec4 color = clamp(org_color,0.0,1.0);
   	float colorSize = color.r * color.r + color.g * color.g + color.b * color.b;
   	colorSize *= color.a * color.a; //RGBA
  	if (colorSize > 2.5) { //adjust it later
       gl_FragColor = org_color;
    } else {
       gl_FragColor = vec4(0.0,0.0,0.0,0.0);
    }
}
