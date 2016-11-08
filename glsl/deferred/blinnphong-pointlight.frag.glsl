#version 100
precision highp float;
precision highp int;

//#define NUM_GBUFFERS 4
#define NUM_GBUFFERS 3
uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform vec3 u_camPos; // add camera position
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform float u_toon;
varying vec2 v_uv;

vec3 applyNormalMap(vec3 geomnor, vec3 normap) { //normal map -> geometry normal, each geometry get its normal through this way
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
//    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables
    // local? extract, alright

     vec3 pos = gb0.xyz;
  //   vec3 geomnor = gb1.xyz;
     vec3 color = gb2.rgb;
//     vec3 normap = gb3.xyz;
     vec3 nor = normalize(gb1.xyz);

     vec3 lightDir = normalize(u_lightPos - pos);
     float distToLight = distance(u_lightPos, pos);
     vec3 reflDir = reflect(-lightDir, nor);
     vec3 viewDir = normalize(u_camPos - pos);
     vec3 halfDir = normalize(lightDir + viewDir);

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    float attenuation = max(0.0, u_lightRad - length(pos - u_lightPos));
//    float attenuation = 1.0 / (1.0 + u_lightRad * distToLight * distToLight);
    float lambert = max(dot(lightDir, nor),0.0);
  	float specular = 0.0;
  	if(lambert > 0.0)	{
  		float ndotH = max(dot(halfDir,nor),0.0);
  		specular = pow(ndotH, 12.0);
  	}
    vec3 finalcolor = (lambert * color + specular) * u_lightCol * attenuation;
    float ndotH = max(dot(halfDir,nor),0.0);

    if (u_toon > 0.6) { //let's make a threshold
       if (lambert < 0.6) {
          lambert = 0.2;
       } else {
          lambert = 1.0;
       }
       if (ndotH > 0.75) {
          specular = 1.0; //pow(ndotH, 12.0);
       } else {
          specular = 0.0;
       }
    finalcolor = (lambert * color + specular) * u_lightCol * attenuation;
    }

    gl_FragColor = vec4(finalcolor, 1.0);
//    gl_FragColor = vec4(0, 0, 1, 1);  // TODO: perform lighting calculations
}
