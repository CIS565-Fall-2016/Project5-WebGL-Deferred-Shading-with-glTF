#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform vec2 u_texSize;

varying vec2 v_uv;

void main() {
    vec3 pos = texture2D(u_gbufs[0], v_uv).xyz;
    vec2 tOff = 1.0 / u_texSize;
    float d1 = texture2D(u_depth, v_uv).x;
    float n = 0.0;
    for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      float d = texture2D(u_depth, v_uv + vec2(float(i)*tOff.x, float(j)*tOff.y)).x;
      n = max(n, abs(d-d1));
    }}
    n = 100.0*clamp(5.0*n - 1.0, 0.0, 1.0);

    gl_FragColor = vec4(vec3(n), 0);
}
