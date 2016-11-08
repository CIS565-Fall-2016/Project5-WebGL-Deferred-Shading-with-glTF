#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_colmap;
uniform sampler2D u_normap;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

/*
vec3 pos = gb0.xyz;     // World-space position
vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
vec3 nor = applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
*/
//reduce a normal!
vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main() {
    // TODO: copy values into gl_FragData[0], [1], etc.
    // You can use the GLSL texture2D function to access the textures using
    // the UV in v_uv.

    // this gives you the idea
    gl_FragData[0] = vec4( v_position, 1.0 );
  //  gl_FragData[1] = vec4( v_normal, 1.0 );
    gl_FragData[1] = vec4(applyNormalMap(v_normal, texture2D(u_normap, v_uv).rgb), 1.0);  //conbine normal together
    gl_FragData[2] = texture2D(u_colmap, v_uv);
  //  gl_FragData[3] = texture2D(u_normap, v_uv);
}
