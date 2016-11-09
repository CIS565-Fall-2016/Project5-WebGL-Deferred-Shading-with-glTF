#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform vec3 u_cameraPos;

varying vec2 v_uv;



vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main() {
	vec2 uv = vec2(gl_FragCoord.x / 800.0, gl_FragCoord.y / 600.0);  //hard coded screen size
    vec4 gb0 = texture2D(u_gbufs[0], uv);
    vec4 gb1 = texture2D(u_gbufs[1], uv);
    vec4 gb2 = texture2D(u_gbufs[2], uv);
    vec4 gb3 = texture2D(u_gbufs[3], uv);
    float depth = texture2D(u_depth, uv).x;
    

    //vec3 pos = gb0.xyz;     // World-space position
    //vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    //vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    //vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    //vec3 nor = applyNormalMap (geomnor, normap);     // The true normals as we want to light them - with the normal map applied to the geometry normals (applyNormalMap above)
      
    
    // TODO: Extract needed properties from the g-buffers into local variables

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    //gl_FragColor = vec4(0, 0, 1, 1);  // TODO: perform lighting calculations

    vec3 N = applyNormalMap(gb1.xyz, gb3.xyz);
    //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    
    float shininess = 10.0;

    // assign variables
    vec3 vertPos = vec3(gb0);
    //vec3 ambientColor = vec3(0.1, 0.1, 0.1);
    vec3 diffuseColor = vec3(gb2);
    //vec3 diffuseColor = vec3(1.0, 1.0, 1.0);
    vec3 specColor = vec3(0.5, 0.5, 0.5);
  
	vec3 normal = normalize(N);
	vec3 lightDir = normalize(u_lightPos - vertPos);

    float attenuation = max(0.0, 1.0 - length(u_lightPos - vertPos) / u_lightRad);
	
	float lambertian = max(dot(lightDir,normal), 0.0);
	float specular = 0.1;

	if(lambertian > 0.0)
	{

		vec3 viewDir = -normalize(vertPos - u_cameraPos);

		// blinn phong
		vec3 halfDir = normalize(lightDir + viewDir);
		float specAngle = max(dot(halfDir, normal), 0.0);
		specular = min(pow(specAngle, shininess), 1.0);

		vec3 reflectDir = reflect(-lightDir, normal);
		specAngle = max(dot(reflectDir, viewDir), 0.0);
    
		specular = min(pow(specAngle, shininess/4.0), 1.0);
	}
	vec3 color = u_lightCol * (lambertian * diffuseColor +
							   specular * specColor);

	gl_FragColor = vec4(color, 1.0) * attenuation;
	//gl_FragColor = vec4(u_cameraPos, 1.0);


    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    
}
