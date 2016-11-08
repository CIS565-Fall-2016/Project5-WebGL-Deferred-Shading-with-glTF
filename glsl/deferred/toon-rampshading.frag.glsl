#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform vec3 u_viewPos;

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

uniform float u_bands;

const float ambient = 0.1;

#define OPTIMIZATION 0

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

float band(float value) {
  return floor(value * u_bands) / u_bands;
}


void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    #if OPTIMIZATION == 0
    vec3 pos = gb0.xyz;
    vec3 colmap = gb2.rgb;
    vec3 nor = applyNormalMap(gb1.xyz, gb3.xyz);
    #elif OPTIMIZATION == 1
    vec3 pos = gb0.xyz;
    vec3 nor = gb1.xyz;
    vec3 colmap = gb2.rgb;
    #endif
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    vec3 dist = u_lightPos - pos;
    vec3 lightDir = normalize(dist);
    vec3 viewDir = normalize(u_viewPos - pos);

    float lambertian = max(dot(lightDir, nor), 0.0);

    float specular = 0.0;
    float attenuation = max(u_lightRad - length(dist), 0.0) / u_lightRad;
    if (lambertian > 0.0) {
      vec3 halfDir = normalize(lightDir + viewDir);
      float specAngle = max(dot(halfDir, nor), 0.0);
      specular = pow(specAngle, 3.0);
    }
    lambertian = band(lambertian);
    specular = band(specular);

    // vec3 color = (colmap * lambertian * u_lightCol + specular * u_lightCol) * attenuation + colmap * ambient;
    vec3 color = (colmap * lambertian * u_lightCol + specular * u_lightCol) * attenuation;
    gl_FragColor = vec4(color, 1);

}
