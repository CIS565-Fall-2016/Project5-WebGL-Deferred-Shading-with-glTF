#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform mat4 u_worldMat;

attribute vec3 a_position;

//varying vec2 v_uv;

void main()
{
    vec4 vpos = u_cameraMat * u_worldMat * vec4(a_position, 1.0);
    gl_Position = vpos;
    //v_uv = vec2(vpos * 0.5)/vpos.w + vec2(0.5); //using gl_FragCoord directly
}
