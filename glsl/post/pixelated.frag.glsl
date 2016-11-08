// Adapted from http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-14-render-to-texture/

#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform vec2 u_textureSize;
uniform float u_time;

void main() {

    vec2 texelSize = 5.0 * (vec2(1.0, 1.0) / u_textureSize);

    vec3 color = texture2D(u_color, v_uv + sin(u_time) * texelSize).rgb;
    color = texture2D(u_color, v_uv + 0.002*vec2( sin(u_time+1024.0*v_uv.x),cos(u_time+768.0*v_uv.y))).rgb;
    gl_FragColor = vec4(color, 1.0);
}

