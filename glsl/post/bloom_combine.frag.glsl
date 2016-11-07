#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;


// Extract bright colors for bloom
void main()
{
    const float exposure = 0.8;
    const float gamma = 1.1;
    // ref: http://learnopengl.com/#!Advanced-Lighting/Bloom
    vec3 color = texture2D(u_scene, v_uv).rgb;
    color += texture2D(u_bloom, v_uv).rgb;
    color = vec3(1.0) - exp(-color * exposure);
    color = pow(color, vec3(1.0/gamma));
    // TODO
    gl_FragColor = vec4(color, 0.5);
}
