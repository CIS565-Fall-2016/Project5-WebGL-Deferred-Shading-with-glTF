#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_colmap;
uniform sampler2D u_normap;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

vec2 packVec(vec4 v) {
  v = floor(v * 255.0);
  return vec2( v.r * 256.0 + v.g, v.b * 256.0 + v.a );
}

void main() {
    gl_FragData[0] = vec4( v_position, 1.0 );
    vec3 geomnor = normalize(v_normal.xyz);
    vec3 normap = normalize(texture2D(u_normap, v_uv).xyz);
    vec3 nor = normalize(applyNormalMap(geomnor, normap));
    vec2 col = packVec(texture2D(u_colmap, v_uv));
    gl_FragData[1] = vec4( nor.x, nor.y, col.x, col.y );
}
