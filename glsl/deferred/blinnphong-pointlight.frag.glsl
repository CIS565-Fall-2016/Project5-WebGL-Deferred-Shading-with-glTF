#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform vec3 u_camPos;
uniform vec3 u_effects;
uniform float u_width;
uniform float u_height;

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
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    
    vec3 pos = gb0.xyz;     // World-space position
    vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    vec3 nor = applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)

    // TODO: Extract needed properties from the g-buffers into local variables

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    float enableToon = u_effects.r;
    if (enableToon == 1.0){
        vec2 dx = vec2(1.0 / u_width,0.0);
        vec2 dy = vec2(0.0, 1.0 / u_height);
        float diff = abs(texture2D(u_depth, v_uv + dx).r - depth)
                    +abs(texture2D(u_depth, v_uv + dy).r - depth)
                    +abs(texture2D(u_depth, v_uv - dx).r - depth)
                    +abs(texture2D(u_depth, v_uv - dy).r - depth);
        if (diff > 0.01){
            gl_FragColor = vec4(-1.0, -1.0, -1.0, 1.0);
            return;
        }
    }

    float dist_from_surface_to_light = length(u_lightPos-pos);
    float attenuation = max(0.0, u_lightRad - dist_from_surface_to_light);
    
    //diffuse section:
    vec3 thiscolor = colmap.rgb*u_lightCol;

    vec3 lightdir = normalize(u_lightPos-pos);
    float diffusefact=dot(nor,lightdir);

    
    
    if ( enableToon==1.0){
        float diffusefact2=   abs(diffusefact) ;
        if (diffusefact2>0.75){
            thiscolor *= 1.0;
        }
        else if (diffusefact2>0.5){
            thiscolor *= 0.5;
        }
        else if (diffusefact2>0.05){
            thiscolor *= 0.25;
        }
        else{
            thiscolor *= 0.1;
        }
        thiscolor *= sign(diffusefact)*attenuation*0.35;
    }
    else{
        thiscolor *= attenuation*diffusefact*0.35;
    }


    

    //fill here

    //specular
    vec3 camdir = normalize(u_camPos-pos);
    vec3 tmp = normalize(lightdir+camdir);
    float specularfact = dot(nor,tmp);
    thiscolor += colmap * specularfact * attenuation * 0.25;

    gl_FragColor = vec4(thiscolor,1);


}
