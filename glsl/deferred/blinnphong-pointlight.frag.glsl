#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_cameraPos;
uniform vec3 u_lightPos;
uniform vec3 u_lightCol;
uniform float u_lightRad;

uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

void main() {
    float depth = texture2D(u_depth, v_uv).x;   

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    vec4 gb3 = texture2D(u_gbufs[3], v_uv);
    
    vec3 objPos     = gb0.xyz;  // World-space position
    vec3 objClr     = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    vec3 objNormal  = gb1.xyz;     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)

    vec3 lightDir       = normalize(objPos - u_lightPos);
    vec3 viewDir        = normalize(objPos - u_cameraPos);
    vec3 lightReflDir   = normalize(reflect(lightDir, objNormal));

    // Calculate Diffuse Term:  
   float Idiff = max(-dot(objNormal,lightDir), 0.0);
   Idiff = clamp(Idiff, 0.0, 1.0);     
   
   // Calculate Specular Term:
   float Ispec = pow( max( dot(lightReflDir,-viewDir), 0.0), 15.0 );
   Ispec = clamp(Ispec, 0.0, 1.0); 

   float distLightToObj = distance(u_lightPos, objPos);
   float attenuation = 1.0 - clamp( pow( distLightToObj / u_lightRad, 2.0), 0.0, 1.0 ); 

   // write Total Color:  
   gl_FragColor = vec4( attenuation * u_lightCol * (objClr*Idiff+vec3(1,1,1)*Ispec), 1); 
}
