#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

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

// https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_shading_model
void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    vec3 pos = gb0.xyz;
    vec3 color = gb2.rgb;
    vec3 normal = applyNormalMap(gb1.xyz, gb3.xyz);

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 lightDir = normalize(u_lightPos - pos);

    float NDotL = dot(lightDir, normal);
    float specular = 0.0;
    float dist = distance(pos, u_lightPos);

    if(NDotL > 0.0 && dist < u_lightRad)
    {
        vec3 viewDir = normalize(u_cameraPos - pos);
        
        vec3 halfDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(halfDir, normal), 0.0);
        specular = pow(specAngle, 16.0);

        vec3 tmpColor = (0.5 * NDotL * color + 0.5 * specular) * u_lightCol;
        //float att = (u_lightRad - dist) / u_lightRad;
        float att = max(0.0, u_lightRad - dist);
        gl_FragColor = vec4(att * tmpColor, 1.0);
    }
    else
    {
        gl_FragColor = vec4(0, 0, 0, 0);
    }
}
