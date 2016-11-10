#version 100

precision highp float;
precision highp int;

uniform sampler2D u_deferTex;

// bloom related parameters
uniform bool u_useBloom;
uniform sampler2D u_bloomTex;


// toon shading parameters
uniform bool u_useToon;
uniform int u_rampLevel;
uniform sampler2D u_edgeTex; // edge detection result from edge extraction pass

// varying vu coordinate
varying vec2 v_uv;

// main function
void main() {

    gl_FragColor = vec4(texture2D(u_deferTex, v_uv).rgb, 1.0);

    // bloom output gather
    if(u_useBloom) {
        gl_FragColor = vec4( gl_FragColor.rgb + texture2D(u_bloomTex, v_uv).rgb, 1.0);
    }
        
    // toon output gather
    if(u_useToon) {

        // ramp color
        float deltaStep = 1.0 / float(u_rampLevel);

        float intensity = dot(vec3(0.2126, 0.7152, 0.0722), gl_FragColor.rgb);
        intensity = floor(intensity / deltaStep) * deltaStep;
        gl_FragColor = vec4(intensity * gl_FragColor.rgb, 1.0);

        // depth - edge detection result
        gl_FragColor = vec4(texture2D(u_edgeTex, v_uv).rgb * gl_FragColor.rgb, 1.0);
    }

}
