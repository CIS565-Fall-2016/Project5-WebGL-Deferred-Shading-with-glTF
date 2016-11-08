#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform float u_nlights;
uniform float u_ntiles;
uniform vec2 u_tilesize;
uniform vec2 u_resolution;
uniform vec3 u_cameraPos;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform sampler2D u_lightbuffer;
uniform sampler2D u_tilebuffer;
uniform int u_debug;

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
    // vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    // vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    // Extract needed properties from the g-buffers into local variables
    // These definitions are suggested for starting out, but you will probably want to change them.
    // vec3 pos = gb0.xyz;     // World-space position
    // vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    // vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    // vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    // vec3 nor = applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
    // vec3 nor = gb1.xyz;

    vec3 pos = gb0.xyz;
    vec3 colmap = gb1.rgb;
    vec3 nor = vec3(gb0[3], gb1[3], 0.0);
    nor.z = (1.0 - nor.x*nor.x - nor.y*nor.y);
    nor.z *= sign(dot(nor, u_cameraPos - pos));
    nor = normalize(nor);

    vec2 tileDim = ceil(u_resolution / u_tilesize);
    vec2 t_xy = floor(v_uv * u_resolution / u_tilesize);
    float t_uv = (t_xy.y * tileDim.x + t_xy.x) / u_ntiles + 0.1 / u_ntiles;

    vec3 cumul = vec3(0.0);
    float count = 0.0;
    for (int i = 0; i < 200; i += 4) {
        if (i >= int(u_nlights)) break;
        float l_uv = float(i) / u_nlights;
        vec4 mask = texture2D(u_tilebuffer, vec2(t_uv, l_uv));
        
        for (int j = 0; j < 4; ++j) {
            l_uv = float(i + j) / u_nlights + 0.1 / u_nlights; // slight offset
            if (mask[j] > 0.0) {
                count += mask[j];

                vec4 v1 = texture2D(u_lightbuffer, vec2(l_uv, 0.0));
                vec4 v2 = texture2D(u_lightbuffer, vec2(l_uv, 0.5));
                vec3 l_col = v2.rgb;
                float l_rad = v1[3];
                vec3 l_pos = v1.xyz;

                float dist = distance(l_pos, pos);
                if (dist > l_rad) {
                    continue;
                }

                vec3 L = normalize(l_pos - pos);
                float lambert = max(dot(L, nor), 0.0);
                vec3 V = normalize(u_cameraPos - pos);
                vec3 H = normalize(L + V);
                float specular = float(lambert > 0.0) * pow(max(dot(H, nor), 0.0), 10.0);
                cumul += l_col * pow(1.0 - dist / l_rad, 2.0) *
                (
                    colmap * lambert + 
                    vec3(1,1,1) * specular
                );
            }
        }
    }
    if (u_debug > 0) cumul = vec3(count / u_nlights);
    

    gl_FragColor = vec4(cumul, 1.0);
}
