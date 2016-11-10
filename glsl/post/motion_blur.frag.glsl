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

const int numMotionBlurSamples = 9;

// varying vu coordinate
varying vec2 v_uv;

// main function
void main() {

    // motion blur gather
    if(u_enableMotionBlur){

        float zOverW = texture2D(u_depth, v_uv).x;
        vec4 currentPos = vec4(v_uv.x * 2.0 - 1.0, (1.0 - v_uv.y) * 2.0 - 1.0, zOverW, 1.0);
        vec4 worldPos = u_inverseCameraMat * currentPos;
        worldPos /= worldPos.w;

        vec4 previousPos = u_previousCameraMat * worldPos;
        previousPos = previousPos / previousPos.w;

        vec2 velocity = (currentPos.xy - previousPos.xy) * (u_motionBlurScale) / float(numMotionBlurSamples);

        vec4 color = texture2D(u_colorTex, v_uv);
        vec2 texCoord = v_uv + velocity;

        for(int i = 1; i < numMotionBlurSamples; i++){
            color += texture2D(u_colorTex, texCoord);
            texCoord += velocity;
        }
        color = color / float(numMotionBlurSamples);

        gl_FragColor = color;
    }
    else {
        gl_FragColor = texture2D(u_colorTex, v_uv);
    }
}
