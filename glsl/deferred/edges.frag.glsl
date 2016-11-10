#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3
#define NUM_CEL_CUTS 7

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

void main() {
    int width = 800;
    int height = 600;

    mat3 kernel = mat3(
          1,   1,   1,
          1,  -8,   1,
          1,   1,   1
    );

    float conv = 0.0;
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(i, j) / vec2(width, height);
            vec4 depth_at_offset = texture2D(u_depth, v_uv + offset);
            vec4 product_at_offset = depth_at_offset * float(kernel[i + 1][j + 1]);
            float reduce_sum = dot(vec4(1), product_at_offset);
            conv += reduce_sum;
        }
    }

    float depth = texture2D(u_depth, v_uv).x;
    if (abs(conv) > 1.0 && depth < 1.0) {
       gl_FragColor = vec4(1) * .065;
       gl_FragColor.w = 1.0;
    }
}
