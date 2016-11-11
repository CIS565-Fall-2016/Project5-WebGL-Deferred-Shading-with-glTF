#version 100
precision highp float;
precision highp int;

uniform sampler2D u_bufferTex;
uniform bool u_horizontal;
uniform vec2 u_texSize;

varying vec2 v_uv;

//http://learnopengl.com/#!Advanced-Lighting/Bloom

void main() {

    vec2 direction = vec2(u_horizontal, !u_horizontal);
    vec2 pixelOffset = 1.0 / u_texSize * direction;

    vec3 blurredColor = texture2D(u_bufferTex, v_uv).rgb * 0.227027;
    blurredColor += texture2D(u_bufferTex, v_uv - 1.0 * pixelOffset).rgb * 0.1945946;
    blurredColor += texture2D(u_bufferTex, v_uv + 1.0 * pixelOffset).rgb * 0.1945946;
    blurredColor += texture2D(u_bufferTex, v_uv - 2.0 * pixelOffset).rgb * 0.1216216;
    blurredColor += texture2D(u_bufferTex, v_uv + 3.0 * pixelOffset).rgb * 0.1216216;
    blurredColor += texture2D(u_bufferTex, v_uv - 3.0 * pixelOffset).rgb * 0.054054;
    blurredColor += texture2D(u_bufferTex, v_uv + 3.0 * pixelOffset).rgb * 0.054054;
    blurredColor += texture2D(u_bufferTex, v_uv - 4.0 * pixelOffset).rgb * 0.016216;
    blurredColor += texture2D(u_bufferTex, v_uv + 4.0 * pixelOffset).rgb * 0.016216;

    gl_FragColor = vec4(blurredColor, 1.0);
}
