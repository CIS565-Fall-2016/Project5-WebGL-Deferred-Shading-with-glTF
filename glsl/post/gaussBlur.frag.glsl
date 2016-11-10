#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform bool u_horizontal;
uniform vec2 u_texelSize;
uniform float u_kernelWeights[5];

varying vec2 v_uv;

void main()
{
    vec2 tex_offset = 1.0 / u_texelSize; // gets size of single texel
    vec3 result = texture2D(u_color, v_uv).rgb; // current fragment's contribution
    if(u_horizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            float fI = float(i);
            
            result += texture2D(u_color, v_uv + vec2(tex_offset.x * fI, 0.0)).rgb * u_kernelWeights[i];
            result += texture2D(u_color, v_uv - vec2(tex_offset.x * fI, 0.0)).rgb * u_kernelWeights[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            float fI = float(i);

            result += texture2D(u_color, v_uv + vec2(0.0, tex_offset.y * fI)).rgb * u_kernelWeights[i];
            result += texture2D(u_color, v_uv - vec2(0.0, tex_offset.y * fI)).rgb * u_kernelWeights[i];
        }
    }
    gl_FragColor = vec4(result, 1.0);
}
