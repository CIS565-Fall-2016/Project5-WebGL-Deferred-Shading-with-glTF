#version 100

precision highp float;
precision highp int;

uniform sampler2D u_deferTex;
uniform sampler2D u_bloomTex;
uniform bool u_useBloom;

varying vec2 v_uv;

void main() {


    if(u_useBloom)
    {
        gl_FragColor = vec4(
            texture2D(u_deferTex, v_uv).rgb + texture2D(u_bloomTex, v_uv).rgb, 1.0);
    }
    else
    {
        gl_FragColor = vec4(texture2D(u_deferTex, v_uv).rgb, 1.0);
    }
        
}
