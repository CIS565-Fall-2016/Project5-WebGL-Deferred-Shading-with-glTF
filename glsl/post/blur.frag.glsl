#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform bool u_horizontal;
uniform vec2 u_tex_offset;

// float weight[5];

float weight[3];
float offset[3];

// uniform float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
//stupid shit, cant do array in version 100


void main()
{

    // weight[0] = 0.227027;
    // weight[1] = 0.1945946;
    // weight[2] = 0.1216216;
    // weight[3] = 0.054054;
    // weight[4] = 0.016216;

    offset[0] = 0.0;
    offset[1] = 1.3846153846;
    offset[2] = 3.2307692308;
    weight[0] = 0.2270270270;
    weight[1] = 0.3162162162;
    weight[2] = 0.0702702703;

    /* efficient gaussian blur: linear sampling;
    Reference: http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/ */

    // vec2 tex_offset = 1.0 / textureSize(image, 0); // gets size of single texel
    vec3 result = texture2D(u_color, v_uv).rgb * weight[0]; // current fragment's contribution
    if(u_horizontal)
    {
        for(int i = 1; i < 3; ++i)
        {
            // result += texture2D(u_color, v_uv + vec2(u_tex_offset.x * float(i), 0.0)).rgb * weight[i];
            // result += texture2D(u_color, v_uv - vec2(u_tex_offset.x * float(i), 0.0)).rgb * weight[i];
            result += texture2D(u_color, v_uv + vec2(u_tex_offset.x * offset[i], 0.0)).rgb * weight[i];
            result += texture2D(u_color, v_uv - vec2(u_tex_offset.x * offset[i], 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 3; ++i)
        {
            // result += texture2D(u_color, v_uv + vec2(u_tex_offset.y * float(i), 0.0)).rgb * weight[i];
            // result += texture2D(u_color, v_uv - vec2(u_tex_offset.y * float(i), 0.0)).rgb * weight[i];
            result += texture2D(u_color, v_uv + vec2(0.0, u_tex_offset.y * offset[i])).rgb * weight[i];
            result += texture2D(u_color, v_uv - vec2(0.0, u_tex_offset.y * offset[i])).rgb * weight[i];
        }
    }
    gl_FragColor = vec4(result, 1.0);
}
