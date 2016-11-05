#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;

const float threshold = 1.0; // TODO: uniform

// Extract bright colors for bloom
void main()
{
    // ref: http://learnopengl.com/#!Advanced-Lighting/Bloom
    vec4 color = texture2D(u_color, v_uv);
    // TODO: maybe combining this into a gathering pass after defered shading
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
