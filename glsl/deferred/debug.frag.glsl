#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 2

uniform vec3 u_viewportInfo; // (2_times_tan_halfFovy, width, height)
uniform int u_debug;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.66, 0.73, 1.0, 1.0);

vec3 applyNormalMap(vec3 geomnor, vec3 normap)
{
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

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
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    
	// TODO: Extract needed properties from the g-buffers into local variables
    // These definitions are suggested for starting out, but you will probably want to change them.
    vec3 pos = recoverEyePos(depth);     // World-space position
    vec3 nrm = vec3(gb0.xy, sqrt(1.0 - dot(gb0.xy, gb0.xy)));  // Normals of the geometry as defined, without normal mapping
	vec3 colmap = gb1.rgb;  // The color map - unlit "albedo" (surface color)
	
    // TODO: uncomment
    if (u_debug == 0)
	{
        gl_FragColor = vec4(vec3(depth), 1.0);
    }
	else if (u_debug == 1)
	{
        gl_FragColor = vec4(abs(pos) * 0.1, 1.0);
    }
	else if (u_debug == 2)
	{
        gl_FragColor = vec4(abs(nrm), 1.0);
    }
	else if (u_debug == 3)
	{
        gl_FragColor = vec4(colmap, 1.0);
    }
	else
	{
        gl_FragColor = vec4(1, 0, 1, 1);
    }
}
