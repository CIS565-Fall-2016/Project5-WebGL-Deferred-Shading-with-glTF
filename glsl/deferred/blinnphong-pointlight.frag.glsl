#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3
#define NUM_CEL_CUTS 7
#define GB(i) (texture2D(u_gbufs[i], v_uv).xyz)
#define ROUND(n) (floor((n) + 0.5))

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform vec3 u_camPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform int u_toon;

varying vec2 v_uv;

void main() {
    float depth = texture2D(u_depth, v_uv).x;

    // TODO: Extract needed properties from the g-buffers into local variables
    // These definitions are suggested for starting out, but you will probably want to change them.
    vec3 viewPos = GB(0);     // World-space position
    vec3 nor = GB(1);  // Normals of the geometry as defined, without normal mapping
    vec3 colmap = GB(2);  // The color map - unlit "albedo" (surface color)

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(1, 1, 1, 0);
        return;
    }

    vec3 posRelLight = u_lightPos - viewPos;
    vec3 V = normalize(viewPos);
    vec3 L = normalize(posRelLight);
    vec3 H = normalize(L + V); // mid angle beteen light and viewer
    float intensity = dot(nor, H);
    float attenuation = max(0.0, 1.0 - (length(posRelLight) / u_lightRad));
    float shading = attenuation * intensity;

    if (u_toon == 1) {
        float cuts = float(NUM_CEL_CUTS);
        shading = ROUND(shading * cuts) / cuts;
    }



    gl_FragColor = shading * vec4(colmap * u_lightCol, 1.0);
    // HELP: not doing anything
}
