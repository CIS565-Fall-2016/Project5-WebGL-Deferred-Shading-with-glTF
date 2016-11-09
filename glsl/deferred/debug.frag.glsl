#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform int u_debug;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.66, 0.73, 1.0, 1.0);

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
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    float depth = texture2D(u_depth, v_uv).x;

    vec3 pos = gb0.xyz;     // World-space position
    vec3 colmap = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    vec3 nor = extractNormal (gb0.w, gb1.w, colmap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
    colmap = abs(colmap);

    // DONE: uncomment
    if (u_debug == 0) {
        gl_FragColor = vec4(vec3(depth), 1.0);
    } else if (u_debug == 1) {
        gl_FragColor = vec4(abs(pos) * 0.1, 1.0);
    } else if (u_debug == 2) {
        gl_FragColor = vec4(colmap, 1.0);
    } else if (u_debug == 3) {
        gl_FragColor = vec4(abs(nor), 1.0);
    } else {
        gl_FragColor = vec4(1, 0, 1, 1);
    }
}
