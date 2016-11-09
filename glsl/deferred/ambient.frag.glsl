
#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 1

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

vec4 unpackRGBA(float packedColor)
{
	float tmp1 = packedColor;
	float tmp2 = floor(tmp1 * 0.00390625);
	float a = tmp1 - tmp2 * 256.0;
	tmp1 = floor(tmp2 * 0.00390625);
	float b = tmp2 - tmp1 * 256.0;
	tmp2 = floor(tmp1 * 0.00390625);
	float g = tmp1 - tmp2 * 256.0;
	tmp1 = floor(tmp2 * 0.00390625);
	float r = tmp2 - tmp1 * 256.0;
	
	return vec4(r, g, b, a) * 0.0039215686274509803921568627451;
}

void main()
{
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0); // set alpha to 0
        return;
    }

    gl_FragColor = vec4(0.1 * unpackRGBA(gb0.z).rgb, 1);  // TODO: replace this
}
