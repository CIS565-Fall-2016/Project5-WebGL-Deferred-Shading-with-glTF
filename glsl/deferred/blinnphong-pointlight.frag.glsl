#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform bool u_toon;
uniform bool u_packNormals;
uniform vec3 u_eyePos;
uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

vec3 reconstructNormal(vec2 xy) {
    return vec3(xy, sqrt(1.0 - dot(xy, xy)));
}

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

const float levels = 4.0;
const float invLevels = 1.0 / levels;
float applyToonFilter(float value) {
    return floor(value * levels) * invLevels;
}

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;

    vec3 pos = gb0.xyz;     // World-space position
    float specExp = gb0.w;
    vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    vec3 geomnor, normap;
    if (u_packNormals) {
        geomnor = reconstructNormal(gb1.xy);  // Normals of the geometry as defined, without normal mapping
        normap = reconstructNormal(gb1.zw);  // The raw normal map (normals relative to the surface they're on)
    }
    else {
        geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
        normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    }
    vec3 nor = normalize(applyNormalMap (geomnor, normap));     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 posToLight = u_lightPos - pos;
    vec3 L = normalize(posToLight);
    vec3 R = normalize(-reflect(L, nor));
    vec3 E = normalize(u_eyePos - pos);

    float diffuse = clamp(max(dot(nor, L), 0.0), 0.0, 1.0);
    float specular = clamp(pow(max(dot(R, E), 0.0), specExp), 0.0, 1.0);

    if (u_toon) {
        diffuse = applyToonFilter(diffuse);
        specular = applyToonFilter(specular);
    }

    vec3 diffuseCol = u_lightCol * colmap * diffuse;
    vec3 specularCol = u_lightCol * vec3(1.0) * specular;

    float attenuation = pow(max(0.0, u_lightRad - length(posToLight)) / u_lightRad, 0.5);
    gl_FragColor = vec4(attenuation * (0.3 * diffuseCol + 0.7 * specularCol), 1.0);
}
