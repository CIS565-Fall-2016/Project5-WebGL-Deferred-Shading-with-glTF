
#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    ivec2 packedCol = ivec2(int(gb1.z), int(gb1.w));
    vec3 colmap = vec3(packedCol.x / 256, packedCol.x - (packedCol.x / 256) * 256, packedCol.y / 256) / 255.0;


    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0); // set alpha to 0
        return;
    }

    gl_FragColor = vec4(0.1 * colmap, 1.0);
}
