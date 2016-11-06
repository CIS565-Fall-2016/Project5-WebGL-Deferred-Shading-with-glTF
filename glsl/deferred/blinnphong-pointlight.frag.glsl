#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 4

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

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
    vec3 geomnor = gb1.xyz;
    vec3 colmap = gb2.rgb;
    vec3 normap = gb3.xyz;
    vec3 N = applyNormalMap(geomnor, normap);
	vec3 E = vec3(0, 0, 1);
	vec3 L = normalize(u_lightPos - pos);
	vec3 H = normalize(E + L);
	vec3 diffuse;
	vec3 specular;
	float dist = distance(pos, u_lightPos);
	float attenuation = u_lightRad - dist;

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

	// light too far away
	if (dist >= u_lightRad) {
		return;
	}

	diffuse = u_lightCol * colmap * max(0., dot(N, L)) * attenuation;
	specular = u_lightCol * pow(max(0., dot(N, H)), 1000.) * attenuation;

    gl_FragColor = vec4(diffuse + specular, 1.);
}
