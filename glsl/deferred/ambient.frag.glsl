
#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform sampler2D u_celRamp;
uniform bool u_celShade;

varying vec2 v_uv;

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0); // set alpha to 0
        return;
    }

    if (u_celShade) {
      vec3 rampCol;
      rampCol.r = texture2D(u_celRamp, vec2(gb2.r, 0.5)).r;
      rampCol.g = texture2D(u_celRamp, vec2(gb2.g, 0.5)).g;
      rampCol.b = texture2D(u_celRamp, vec2(gb2.b, 0.5)).b;
      gl_FragColor = vec4(rampCol, 1);
    }
    else {
      gl_FragColor = vec4(gb2.rgb, 1);  // TODO: replace this
    }
}
