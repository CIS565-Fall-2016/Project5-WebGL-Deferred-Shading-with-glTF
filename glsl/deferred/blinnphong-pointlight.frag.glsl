#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform int u_isToon;

varying vec2 v_uv;

uniform vec3 u_cameraPos;
uniform mat4 u_invCrtCameraMat;
//uniform sampler2D u_tex;

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main() {
    vec3 result = vec3(0, 0, 0);
    
    float zOverW = texture2D(u_depth, v_uv).x * 2.0 - 1.0;
    vec4 HH = vec4(v_uv.x * 2.0 - 1.0, v_uv.y * 2.0 - 1.0, zOverW, 1.0);
    vec4 DD = u_invCrtCameraMat * HH;
    vec4 worldPos = DD / DD.w;

    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    //vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    //vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    //vec3 pos = gb0.xyz;
    vec3 pos = worldPos.xyz;
    //vec3 pos = vec3(0, 0, 0);
    //vec3 geomnor = gb1.xyz;
    vec3 colmap = gb1.rgb;
    //vec3 normap = gb3.xyz;
    //vec3 nor = applyNormalMap(geomnor, normap);
    vec3 nor = gb0.xyz;
    

    vec3 L = normalize(u_lightPos - pos);
    vec3 V = normalize(u_cameraPos - pos);
    vec3 H = normalize(V + L);
    float distance = length(u_lightPos - pos);
    float attenuation = max(0.0, 1.0 - distance / u_lightRad);
    float intensity = dot(nor, L);
    vec3 diffuseColor;
    vec3 specularColor = u_lightCol * pow(max(0.0, dot(nor, H)), 200.0);
    if (u_isToon == 1)
    {
        int edgeDetection = dot(V, nor) > 0.1 ? 1 : 0;
        if (intensity > 0.9)
        {
            diffuseColor = colmap * 0.9 * u_lightCol * 0.9;
        }
        else if (intensity > 0.7)
            diffuseColor = colmap * 0.7 * u_lightCol * 0.7;
        else if (intensity > 0.4)
        {
            diffuseColor = colmap * 0.4 * u_lightCol * 0.4;
        }
        else
        {
            diffuseColor = colmap * 0.1 * u_lightCol * 0.1;
        }

        if (pow(max(0.0, dot(nor, H)), 200.0) < 0.4)
            specularColor = vec3(0, 0, 0);
        if (edgeDetection == 0)
        {
            diffuseColor = vec3(0, 0, 0);
            specularColor = vec3(0, 0, 0);
        }
    }
    else
    {
        diffuseColor = u_lightCol * clamp(intensity, 0.0, 1.0);
        //specularColor = u_lightCol * pow(max(0.0, dot(nor, H)), 200.0);
    }

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    result += (diffuseColor + specularColor) * attenuation;
    gl_FragColor = vec4(result, 1.0);
    //gl_FragColor = vec4(gb0.xyz, 1.0);
    //gl_FragColor = worldPos;
    //gl_FragColor = vec4(specularColor, 1.0);
    //gl_FragColor = vec4(u_cameraPos, 1.0);
    //gl_FragColor = vec4(attenuation, 0, 0, 1.0);
    //gl_FragColor = vec4(worldPos.y, 0, 0, 1.0);
}
