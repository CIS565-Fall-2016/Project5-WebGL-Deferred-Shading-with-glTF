#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform vec3 u_cameraPos;

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
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

float diffuseLighting(vec3 normal, vec3 lightDir){
    return clamp(dot(normal, lightDir), 0.001, 1.0);
}

float specularLighting(vec3 normal, vec3 lightDir, vec3 viewDir) {
    vec3 H = normalize(lightDir + viewDir);
    float specAngle = clamp(dot(normal, H), 0.0, 1.0);
    return pow(specAngle, 0.01) * 0.01;
}

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);

#if NUM_GBUFFERS >= 3
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
#endif

#if NUM_GBUFFERS == 4
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
#endif

    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    vec3 pos = gb0.xyz;     // World-space position
#if NUM_GBUFFERS == 2
    vec3 colmap = gb1.rgb;  // The color map - unlit "albedo" (surface color)
#else
    vec3 colmap = gb2.rgb;
#endif

#if NUM_GBUFFERS == 4
    vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    vec3 nor = applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
#elif NUM_GBUFFERS == 3 
    vec3 nor = gb1.xyz;
#elif NUM_GBUFFERS == 2
    float z = 1.0 - (gb0[3]*gb0[3]) - (gb1[3]*gb1[3]);
    vec3 nor = vec3(gb0[3], gb1[3], z);
#endif

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 lightDir = u_lightPos - pos;
    float distance = length(lightDir);
    lightDir = lightDir / distance;

    vec3 viewDir = normalize(u_cameraPos - pos);

    
    float attenuation = max(0.0, u_lightRad - distance);

    float diffuse = diffuseLighting(nor, lightDir);
    float specular = specularLighting(nor, lightDir, viewDir);
    vec3 color = colmap * u_lightCol * (diffuse + specular) * attenuation;

    gl_FragColor = vec4(color, 1);  // TODO: perform lighting calculations
}
