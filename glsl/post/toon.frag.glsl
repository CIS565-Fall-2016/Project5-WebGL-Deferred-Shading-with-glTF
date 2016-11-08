#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_depth;
varying vec2 v_uv;
uniform vec2 u_size;

//extract contour
const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
	vec4 color = texture2D(u_color, v_uv);
  if (color.a == 0.0) {
      gl_FragColor = SKY_COLOR;
      return;
	}

  float depth = texture2D(u_depth, v_uv).x;
	if(depth == 1.0) {
		  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
			return;
	}
	vec2 x_delta = vec2(1.0 / u_size.x, 0.0);
  vec2 y_delta = vec2(0.0, 1.0 / u_size.y);
//https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Toon_Shading
//edge detection algorithm!!!
	float contour = abs(4.0 * depth - texture2D(u_depth, v_uv + x_delta).x // right
                      - texture2D(u_depth, v_uv - x_delta).x //left
                      - texture2D(u_depth, v_uv + y_delta).x //down
                      - texture2D(u_depth, v_uv - y_delta).x); //up
  if(contour > 0.002) {
      gl_FragColor = vec4(0, 0, 0, 1);
      return;
	}
  gl_FragColor = color;
	//gl_FragColor =  color;
}
