#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform vec3 u_viewportInfo; // (2_times_tan_halfFovy, width, height)
uniform vec3 u_lightCol;
uniform vec3 u_lightPos; // in eye space
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

// varying vec2 v_uv;

vec3 recoverEyePos(float depth)
{
	float oneOverHeight = 1.0 / u_viewportInfo.z;
	float aspect = u_viewportInfo.y * oneOverHeight;
	float ph = u_viewportInfo.x * oneOverHeight;
	float pw = ph * aspect;
	vec3 viewVec = vec3(vec2(pw, ph) * (gl_FragCoord.xy - u_viewportInfo.yz * 0.5), -1.0);
	depth = depth * 2.0 - 1.0;
	float eyeDepth = (depth - (101.0 / 99.0)) * (99.0 / 200.0);
	eyeDepth = -1.0 / eyeDepth;
	return viewVec * eyeDepth;
}

void main()
{
	vec2 v_uv = gl_FragCoord.xy / u_viewportInfo.yz;
    vec4 gb0 = texture2D(u_gbufs[0], v_uv); // (eye_normal_x, eye_normal_y, -eye_pos_z)
    vec4 gb1 = texture2D(u_gbufs[1], v_uv); // albedo
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0)
	{
        gl_FragData[0] = vec4(0, 0, 0, 0);
        return;
    }

    // TODO: perform lighting calculations
	vec3 pos = recoverEyePos(depth);
	vec3 nrm = vec3(gb0.xy, sqrt(1.0 - dot(gb0.xy, gb0.xy)));
	vec3 albedo = gb1.xyz;
	float dist2Light = distance(pos, u_lightPos);
	
	if (dist2Light < u_lightRad)
	{
		vec3 view = normalize(-pos);
		vec3 light = normalize(u_lightPos - pos);
		vec3 h = normalize(view + light);
		vec3 finalColor = 0.5 * albedo * max(0.0, dot(nrm, light)) +
			0.5 * u_lightCol * pow(max(0.0, dot(nrm, h)), 20.0);
		float attenuation = (u_lightRad - dist2Light) / u_lightRad;
		gl_FragData[0] = vec4(attenuation * finalColor, 1.0);
	}
	else
	{
		gl_FragData[0] = vec4(0.0);
	}
}
