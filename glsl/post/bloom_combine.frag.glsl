#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;

// Extract bright colors for bloom
void main()
{
    vec4 color = texture2D(u_color, v_uv);
    // TODO
    gl_FragColor = color;
}
