#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_scene;
uniform sampler2D u_bloomBlur;


// Extract bright colors for bloom
void main()
{
    // Reference: http://learnopengl.com/#!Advanced-Lighting/Bloom
    const float exposure = 0.8;
    const float gamma = 1.1;
    vec3 hdrColor = texture2D(u_scene, v_uv).rgb;
    hdrColor += texture2D(u_bloomBlur, v_uv).rgb;
    hdrColor = vec3(1.0) - exp(-hdrColor * exposure);
    hdrColor = pow(hdrColor, vec3(1.0/gamma));

    gl_FragColor = vec4(hdrColor, 0.5);
}
