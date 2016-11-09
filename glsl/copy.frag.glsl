#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_colmap;
uniform sampler2D u_normap;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

vec3 applyNormalMap(vec3 geomnor, vec3 normap)
{
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main()
{
    vec3 geomnor = v_normal;
    vec3 normap = texture2D(u_normap, v_uv).xyz;
    vec3 normal = applyNormalMap(geomnor, normap);
    vec2 two_comp_normal;

    vec3 colmap = texture2D(u_colmap, v_uv).xyz;

    // BLACK MAGIC: use color map signs to represent which axis is seen as 1 in normal map
    if (abs(normal.z) > 0.33)
    {
        two_comp_normal = normal.xy/normal.z;
        colmap.z *= -1.0;
        colmap.x *= sign(normal.z); // and use x to store if normal is inverted
    }
    else if (abs(normal.y) > 0.33)
    {
        two_comp_normal = normal.xz/normal.y;
        colmap.y *= -1.0;
        colmap.x *= sign(normal.y);
    }
    else
    {
        two_comp_normal = normal.yz/normal.x;
        colmap.x *= sign(normal.x); 
    }

    gl_FragData[0] = vec4(v_position,  two_comp_normal.x); // world-space position
    gl_FragData[1] = vec4(colmap, two_comp_normal.y);  // Normals of the geometry as defined, without normal mapping
}
