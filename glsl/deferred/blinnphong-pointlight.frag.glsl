#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;

uniform sampler2D u_celRamp;
uniform int u_celShade;

varying vec2 v_uv;

void main() {
    vec4 gb0 = texture2D(u_gbufs[0], v_uv);
    vec4 gb1 = texture2D(u_gbufs[1], v_uv);
    vec4 gb2 = texture2D(u_gbufs[2], v_uv);
    float depth = texture2D(u_depth, v_uv).x;
    // TODO: Extract needed properties from the g-buffers into local variables

    // If nothing was rendered to this pixel, set alpha to 0 so that the
    // postprocessing step can render the sky color.
    if (depth == 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 pos = gb0.xyz;     // World-space position
    vec3 nor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping

    vec3 lDir = normalize(u_lightPos.xyz - pos);
    float nDot = dot(nor, lDir);
    vec3 lamb, spec;
    float att = max(0.0, u_lightRad - length(pos - u_lightPos.xyz));
    vec3 vDir = normalize(-pos);
    vec3 hDir = normalize(vDir + lDir);
    float hDot = max(dot(hDir, nor), 0.0);

    if (u_celShade == 0) {
      lamb = u_lightCol.rgb * gb2.rgb * clamp(nDot, 0.0, 1.0);
      spec = u_lightCol.rgb * gb2.rgb * pow(hDot, 16.0);
    }
    else {
      vec3 rampCol = u_lightCol.rgb * gb2.rgb;
      rampCol.r = texture2D(u_celRamp, vec2(rampCol.r, 0.5)).r;
      rampCol.g = texture2D(u_celRamp, vec2(rampCol.g, 0.5)).g;
      rampCol.b = texture2D(u_celRamp, vec2(rampCol.b, 0.5)).b;
      lamb = rampCol;
      spec = rampCol * pow(hDot, 16.0);
    }

    gl_FragColor = vec4(.5*spec + .5*lamb, 1.0) * att / u_lightRad;  // TODO: perform lighting calculations
}
