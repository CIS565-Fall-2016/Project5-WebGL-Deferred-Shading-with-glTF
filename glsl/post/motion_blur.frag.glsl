#version 100

precision highp float;
precision highp int;

uniform sampler2D u_colorTex;

// motion blur
uniform bool u_enableMotionBlur;
uniform mat4 u_previousCameraMat;
uniform mat4 u_inverseCameraMat;
uniform sampler2D u_depth;
uniform float u_motionBlurScale;

const int numMotionBlurSamples = 5;

// varying vu coordinate
varying vec2 v_uv;

// main function
void main() {

    // motion blur gather
    if(u_enableMotionBlur){

        float zOverW = texture2D(u_depth, v_uv).x;
        vec4 currentPos = vec4(v_uv * 2.0 - 1.0, zOverW, 1.0);
        vec4 worldPos = u_inverseCameraMat * currentPos;
        worldPos /= worldPos.w;

        vec4 previousPos = u_previousCameraMat * worldPos;
        previousPos = previousPos / previousPos.w;
        previousPos.xy = previousPos.xy * 0.5 + 0.5;

        vec2 velocity = u_motionBlurScale * (previousPos.xy - v_uv.xy);

        vec4 color = texture2D(u_colorTex, v_uv);
        
        for(int i = 1; i < numMotionBlurSamples; i++){
            vec2 offset = velocity * (float(i) / float(numMotionBlurSamples) - 0.5);
            color += texture2D(u_colorTex, v_uv + offset);
        }
        color = color / float(numMotionBlurSamples);

        gl_FragColor = vec4(color.rgb, 1.0);
    }
    else {
        gl_FragColor = texture2D(u_colorTex, v_uv);
    }
}
