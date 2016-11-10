
#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

const vec3 AMBIENT_COLOR = vec3(0.36, 0.36, 0.36);

void main() {
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    float depth = texture2D(u_depth, v_uv).x;

    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0); // set alpha to 0
        return;
    }

    vec3 mtrlClr = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    
    gl_FragColor = vec4(AMBIENT_COLOR * mtrlClr, 1.0);
}
