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


void main() {
    // TODO: copy values into gl_FragData[0], [1], etc.
    // You can use the GLSL texture2D function to access the textures using
    // the UV in v_uv.

    // this gives you the idea
    // gl_FragData[0] = vec4( v_position, 1.0 );
    vec4 colormap = texture2D(u_colmap,v_uv);
    gl_FragData[0] = vec4(v_position,colormap);

    vec3 normap = texture2D(u_normap,v_uv).rgb;  // The raw normal map (normals relative to the surface they're on)
    vec3 nor = applyNormalMap (v_normal, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)

    gl_FragData[1] =  vec4(nor, 1); 
    gl_FragData[2] = colormap; 
    gl_FragData[3] =  vec4(normap, 1); 
}
