#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform vec3 u_cameraPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

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
    float depth = texture2D(u_depth, v_uv).x;
    vec3 pos = gb0.xyz;     // World-space position
    vec3 nor = vec3(gb1.x, gb1.y, sqrt(1.0 - gb1.x * gb1.x - gb1.y * gb1.y)); // Normal map already applied
    ivec2 packedCol = ivec2(int(gb1.z), int(gb1.w));
    vec3 colmap = vec3(packedCol.x / 256, packedCol.x - (packedCol.x / 256) * 256, packedCol.y / 256) / 255.0;

    float dist = distance(pos, u_lightPos);

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0 || u_lightRad < dist) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 L = normalize(u_lightPos - pos);
    vec3 V = normalize(- pos);
    vec3 H = normalize(L + V);
    float attenuation = max(0.0, u_lightRad - dist);
    float lambert = max(0.0, dot(L, nor));
    float specular = max(0.0, dot(H, nor));
    vec3 col = colmap * u_lightCol * lambert + specular * u_lightCol;
    gl_FragColor = vec4(col * attenuation, 1.0);
}
