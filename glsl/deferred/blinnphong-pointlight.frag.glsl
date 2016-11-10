#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform int u_toon;

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
    // TODO: Extract needed properties from the g-buffers into local variables

	vec3 pos = gb0.xyz;
	vec3 geomNor = gb1.xyz;
	vec3 col = gb2.rgb;
	vec3 nor = gb3.xyz;
	vec3 nor_ = applyNormalMap(geomNor, nor);

	float dist = distance(pos, u_lightPos);

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    //gl_FragColor = vec4(1, 0, 0, 1);  // TODO: perform lighting calculations
	vec3 lightDir = normalize(u_lightPos - pos);
	vec3 viewDir = normalize(-pos);
	vec3 halfDir = normalize(lightDir + viewDir);

	float attenuation = max(0.0, u_lightRad - dist);
	float lambertian = max(dot(lightDir, nor), 0.0);
	float specAngle = max(dot(halfDir, nor), 0.0);
	vec3 colLinear = specAngle * u_lightCol + col * u_lightCol * lambertian;
	if (u_toon == 1)
	{
		float steps = 3.0;
		specAngle = ceil(specAngle * steps) / steps;
		lambertian = ceil(lambertian * steps) / steps;
		attenuation = ceil(attenuation * steps) / steps;

		colLinear = specAngle * u_lightCol + col * u_lightCol * lambertian;

		gl_FragColor = vec4(colLinear * attenuation, 1.0);
	}
	else
	{
		gl_FragColor = vec4(colLinear * attenuation, 1.0);
	}
}
