#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform vec3 u_camPos;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

//varying vec2 v_uv;

vec3 extractNormal(float nor_x, float nor_y, vec3 colmap)
{
    // Black magic: I colmap sign to prevent normal losing too much precision on a particular axis
    if (colmap.z < 0.0)
    {
        return normalize(vec3(nor_x, nor_y, 1.0)) * sign(colmap.x);
    }
    else if(colmap.y < 0.0)
    {
        return normalize(vec3(nor_x, 1.0, nor_y)) * sign(colmap.x);
    }
    else
    {
        return normalize(vec3(1.0, nor_x, nor_y)) * sign(colmap.x);
    }
}

void main() {

    vec2 uv = vec2(gl_FragCoord.x / 800.0 , gl_FragCoord.y / 600.0);

    vec4 gb0 = texture2D(u_gbufs[0], uv);
    vec4 gb1 = texture2D(u_gbufs[1], uv);
    float depth = texture2D(u_depth, uv).x;
    // DONE: Extract needed properties from the g-buffers into local variables
    vec3 pos = gb0.xyz;     // World-space position
    vec3 colmap = gb1.rgb;  // The color map - unlit "albedo" (surface color)
    vec3 nor = extractNormal (gb0.w, gb1.w, colmap);   // gb1: geometry normal; gb3: raw normal map
    colmap = abs(colmap);

    // // If nothing was rendered to this pixel, set alpha to 0 so that the
    // // postprocessing step can render the sky color.
    // if (depth == 1.0) {
    //     gl_FragColor = vec4(0, 0, 0, 0);
    //     return;
    // }

    vec3 lightDir = normalize(u_lightPos - pos);
    float lambertian = max(dot(lightDir, nor), 0.0);
    float specular = 0.0;
    if(lambertian > 0.0)
    {
        vec3 viewDir = normalize(u_camPos - pos);
        vec3 halfDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(halfDir, nor), 0.0);
        specular = pow(specAngle, 32.0); // TODO?: spec color & power in g-buffer?
    }

    // square falloff
    float light_distance = distance(u_lightPos, pos);
    float att = clamp(1.0 - light_distance * light_distance / (u_lightRad * u_lightRad), 0.0, 1.0);

    vec3 color = (lambertian * colmap + specular) * u_lightCol * att;
    gl_FragColor = vec4(color, 1.0);  // DONE: perform lighting calculations
    //gl_FragColor = vec4(v_uv, 0.0, 1.0);
}
