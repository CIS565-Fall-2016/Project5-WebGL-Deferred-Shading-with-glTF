#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;

const float threshold = 0.95;

// Extract bright colors for bloom
void main()
{
    // Reference: http://learnopengl.com/#!Advanced-Lighting/Bloom
    vec4 color = texture2D(u_color, v_uv);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    if (brightness > threshold)
    {
        gl_FragColor = color;
    }
    else
    {
        gl_FragColor = vec4(0.0);
    }
}
