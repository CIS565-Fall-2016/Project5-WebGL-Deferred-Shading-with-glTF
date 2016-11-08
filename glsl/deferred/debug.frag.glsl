#version 100
precision highp float;
precision highp int;

//#define NUM_GBUFFERS 4
#define NUM_GBUFFERS 3
uniform int u_debug;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform mat4 u_prevProj;
uniform vec3 u_camPos;

//http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html
//http://john-chapman-graphics.blogspot.com/2013/01/what-is-motion-blur-motion-pictures-are.html
//Help! Motion Blur.....
varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.66, 0.73, 1.0, 1.0);

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
  //  vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables
    // These definitions are suggested for starting out, but you will probably want to change them.
    vec3 pos = gb0.xyz;     // World-space position
  //  vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
//    vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    vec3 nor = normalize(gb1.xyz);//applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)

// H is the viewport position at this pixel in the range -1 to 1.
    vec4 cur_pos = vec4(v_uv.x * 2.0 - 1.0, (1.0 - v_uv.y) * 2.0 - 1.0, depth, 1.0);
    vec4 prev_pos =  u_prevProj * vec4(pos / gb0.w, 1.0);
    prev_pos /= prev_pos.w;
    vec2 velocity = (cur_pos.xy - prev_pos.xy) / 2.0;

    // TODO: uncomment
    if (u_debug == 0) {
        gl_FragColor = vec4(vec3(depth), 1.0);
    } else if (u_debug == 1) {
        gl_FragColor = vec4(abs(pos) * 0.1, 1.0);
    } else if (u_debug == 2) {
        gl_FragColor = vec4(abs(nor), 1.0);//vec4(abs(geomnor), 1.0);
    } else if (u_debug == 3) {
        gl_FragColor = vec4(colmap, 1.0);
    // } else if (u_debug == 4) {
    //     gl_FragColor = vec4(normap, 1.0);
    // } else if (u_debug == 5) {
    //    gl_FragColor = vec4(abs(nor), 1.0);
    // }
    } else {
        gl_FragColor = vec4(1, 0, 1, 1);
    }
}
