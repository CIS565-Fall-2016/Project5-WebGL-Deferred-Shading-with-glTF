#version 100

precision highp float;
precision highp int;

uniform sampler2D u_depthTex;

uniform vec2 u_texSize;

uniform float u_edgeThreshold;

varying vec2 v_uv;

void main() {

    vec2 pixelOffset = 1.0 / u_texSize;

    // get depth values around given pixel v_uv
    vec4 depth1 = vec4(
        texture2D(u_depthTex, v_uv + vec2(-1,-1) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(0,-1) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(1,-1) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(-1,0) * pixelOffset).x
    );
    vec4 depth2 = vec4(
        texture2D(u_depthTex, v_uv + vec2(0,0) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(1,0) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(-1,1) * pixelOffset).x,
        texture2D(u_depthTex, v_uv + vec2(0,1) * pixelOffset).x
    );
    float depth3 = texture2D(u_depthTex, v_uv + vec2(1,1) * pixelOffset).x;

    // filter weights
    // x - direction
    vec4 weightX1 = vec4(
        1,2,1,0   
    );
    vec4 weightX2 = vec4(
        0,0,-1,-2    
    );
    float weightX3 = -1.0;

    // y - direction
    vec4 weightY1 = vec4(
        1,0,-1,2   
    );
    vec4 weightY2 = vec4(
        0,-2,1,0    
    );
    float weightY3 = -1.0;

    float edgeX = dot(depth1, weightX1) + dot(depth2, weightX2) + depth3 * weightX3;
    float edgeY = dot(depth1, weightY1) + dot(depth2, weightY2) + depth3 * weightY3;
    float edgeRes = edgeX * edgeX + edgeY * edgeY ;

    if(edgeRes * 1000.0 > u_edgeThreshold) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    else {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

}