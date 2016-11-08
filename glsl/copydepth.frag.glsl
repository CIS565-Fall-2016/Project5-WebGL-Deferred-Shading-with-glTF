#version 100
precision highp float;
precision highp int;

uniform sampler2D u_depth;

varying vec2 v_uv;

void main()
{
    gl_FragColor = texture2D(u_depth, v_uv);
}
