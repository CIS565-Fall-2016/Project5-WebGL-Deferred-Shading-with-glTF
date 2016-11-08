#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_tex_offset;
varying vec2 v_uv;
mat3 G[2];


void main(void)
{
	G[0] = mat3( -1.0, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0 );
	G[1] = mat3( 1.0, 0.0, -1.0, 2.0, 0.0, -2.0, 1.0, 0.0, -1.0 );

	float u_kernel[9];

	u_kernel[0] = 0.0;
	u_kernel[1] = -2.0;
	u_kernel[2] = -2.0;
	u_kernel[3] = 2.0;
	u_kernel[4] = 0.0;
	u_kernel[5] = -2.0;
	u_kernel[6] = 2.0;
	u_kernel[7] = 2.0;
	u_kernel[8] = 0.0;

	mat3 I;
	float cnv[2];
	highp vec3 sample;

	/* fetch the 3x3 neighbourhood and use the RGB vector's length as intensity value */

	// I[0][0] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(-1, -1)).rgb);
	// I[0][1] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(0, -1)).rgb);
	// I[0][2] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(1, -1)).rgb);
	// I[1][0] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(-1, 0)).rgb);
	// I[1][1] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(0, 0)).rgb);
	// I[1][2] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(1, 0)).rgb);
	// I[2][0] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(-1, 1)).rgb);
	// I[2][1] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(0, 1)).rgb);
	// I[2][2] = length(texture2D(u_color, v_uv + u_tex_offset * vec2(1, 1)).rgb);

	vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(-1, -1)) * u_kernel[0];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(0, -1)) * u_kernel[1];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(1, -1)) * u_kernel[2];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(-1, 0)) * u_kernel[3];
  color += texture2D(u_color, v_uv) * u_kernel[4];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(1, 0)) * u_kernel[5];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(-1, 1)) * u_kernel[6];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(0, 1)) * u_kernel[7];
  color += texture2D(u_color, v_uv + u_tex_offset * vec2(1, 1)) * u_kernel[8];

	/* calculate the convolution values for all the masks */
	// for (int i=0; i<2; i++) {
	// 	float dp3 = dot(G[i][0], I[0]) + dot(G[i][1], I[1]) + dot(G[i][2], I[2]);
	// 	cnv[i] = dp3 * dp3;
	// }

	// gl_FragColor = vec4(0.5 * sqrt(cnv[0]*cnv[0]+cnv[1]*cnv[1]));
	gl_FragColor = color;

}
