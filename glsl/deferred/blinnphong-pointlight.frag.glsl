#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4
#define gb(i) (texture2D(u_gbufs[i], v_uv).xyz)

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform vec3 u_camPos;
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
    float depth = texture2D(u_depth, v_uv).x;

    // TODO: Extract needed properties from the g-buffers into local variables
    // These definitions are suggested for starting out, but you will probably want to change them.
    vec3 viewPos = gb(0);     // World-space position
    // HELP: how do I get view pos?
    vec3 nor = gb(1);  // Normals of the geometry as defined, without normal mapping
    vec3 colmap = gb(2);  // The color map - unlit "albedo" (surface color)
    vec3 normap = gb(3);  // The raw normal map (normals relative to the surface they're on)


    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(1, 0, 1, 0);
        return;
    }

    vec3 posRelLight = u_lightPos - viewPos;
    vec3 V = normalize(viewPos);
    vec3 L = normalize(posRelLight);
    vec3 H = normalize(L + V); // mid angle beteen light and viewer
    float intensity = dot(nor, H);
    float attenuation = max(0.0, 1.0 - (length(posRelLight) / u_lightRad));

    gl_FragColor = attenuation * intensity * vec4(colmap * u_lightCol, 1.0);
    // HELP: not doing anything
}
