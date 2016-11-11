
#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    //vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[2], v_uv);
    vec3 colmap = vec3(gb0.w,gb1.w,gb3.w);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 1); // set alpha to 0
        return;
    }

    gl_FragColor = vec4(colmap.rgb/5.0, 1);  // TODO: replace this
}
