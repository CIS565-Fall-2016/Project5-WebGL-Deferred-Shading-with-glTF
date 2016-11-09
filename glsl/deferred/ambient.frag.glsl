#version 100
#extension GL_EXT_frag_depth : enable
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;
const vec3 ambient_color = vec3(0.15,0.15,0.15);

const vec4 SKY_COLOR = vec4(0.98, 0.98, 0.98, 1.0);
//const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    gl_FragDepthEXT = depth; // for use in light proxy

    if (depth == 1.0) {
        //gl_FragColor = vec4(0, 0, 0, 0); // set alpha to 0
        gl_FragColor = SKY_COLOR;
        return;
    }

    vec3 colmap = gb2.rgb;
    //gl_FragColor = vec4(vec3(depth),1.0);
    gl_FragColor = vec4(colmap * ambient_color, 1);  // DONE: replace this
}
