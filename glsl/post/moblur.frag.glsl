#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform sampler2D u_color;

varying vec2 v_uv;
/*
const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    gl_FragColor = color;
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
*/


uniform sampler2D u_texture;
uniform float resolution;
uniform float radius;
uniform vec2 dir;
uniform int u_gauss;
uniform mat4 u_matdiff;
uniform mat4 u_cameraMat;


uniform int u_debug;
uniform sampler2D u_gbufs;
uniform sampler2D u_depth;

int i = 0;
int j = 0;
void main() {

	// matlab's 3x3 gaussian
	//mat3 G = mat3(0.0113, 0.0838, 0.0113,
    //			  0.0838, 0.6193, 0.0838,
	//			  0.0113, 0.0838, 0.0113);

	vec2 coord = v_uv;


    vec4 gb0 = texture2D(u_gbufs, coord);


	float size = 1.0;
	//vec4 gb0 = texture2D(u_gbufs, coord);
	vec4 vel = 10.0*((u_matdiff*gb0)-gb0); //vec4(0.0, 0.0, 0.0, 0.0);
	//vec4 vel = 10.0*u_matdiff*vec4(0.0, 0.0, 0.0, 1.0);


    vec4 accum = texture2D(u_texture, vec2(coord[0], coord[1]));



	float amp = 1.0;
	for (int i=-30; i<30; i++)
	{
		float delta = float(i);
		accum += texture2D(u_texture, vec2(coord[0] + delta*size*vel[0], coord[1] + delta*size*vel[1]))*amp;
	}

	vec4 color = accum/60.0;
	//float ampl = pow(length(accum.rgb), 2.0);
	gl_FragColor = vec4(color.rgb, 1.0);
	//gl_FragColor = gb0;

	//gl_FragColor = texture2D(u_texture, vec2(coord[0], coord[1]));;
	//gl_FragColor = texture2D(u_gbufs, coord);


    //else
    //{
    //	gl_FragColor = gl_FragColor * 1.0001;
    //}
}
