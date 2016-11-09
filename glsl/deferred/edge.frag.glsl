#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform vec2 u_pixSize;
uniform float u_kernel[9];



varying vec2 v_uv;

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    vec3 pos = gb0.xyz;
    vec3 colmap = gb2.rgb;

    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(-1, -1)) * u_kernel[0];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(0, -1)) * u_kernel[1];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, -1)) * u_kernel[2];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(-1, 0)) * u_kernel[3];
    // color += texture2D(u_gbufs[2], v_uv) * u_kernel[4];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 0)) * u_kernel[5];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(-1, 1)) * u_kernel[6];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(0, 1)) * u_kernel[7];
    // color += texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 1)) * u_kernel[8];
    // color = texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(-1, -1)) - texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 1))
    //       + texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(0, -1)) - texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 1))
    //       + texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, -1)) - texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 1))
    //       + texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(-1, -1)) - texture2D(u_gbufs[2], v_uv + u_pixSize * vec2(1, 1));
    // gl_FragColor = color;
}
