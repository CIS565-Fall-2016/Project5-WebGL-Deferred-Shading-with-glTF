#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform vec3 u_viewPos;
uniform vec3 u_viewDir;

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
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables
    vec3 pos = gb0.xyz;
    vec3 colmap = gb2.rgb;
    vec3 nor = applyNormalMap(gb1.xyz, gb3.xyz);

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    vec3 D = u_lightPos - pos;
    vec3 lightDir = normalize(D);
    float lambertian = max(dot(lightDir, nor), 0.0);

    float specular = 0.0;
    float attenuation = max(u_lightRad - length(D), 0.0) / u_lightRad;
    if (lambertian > 0.0) {
      vec3 viewDir = normalize(u_viewPos-pos);
      vec3 halfDir = normalize(lightDir + viewDir);
      float specAngle = max(dot(halfDir, nor), 0.0);
      specular = pow(specAngle, u_lightRad);
    }

    vec3 color = (colmap * lambertian * u_lightCol + specular * u_lightCol) * attenuation;
    gl_FragColor = vec4(color, 1);
}
