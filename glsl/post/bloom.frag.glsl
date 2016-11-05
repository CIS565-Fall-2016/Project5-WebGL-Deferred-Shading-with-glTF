#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform bool u_horizontal;
uniform vec2 u_tex_offset;
// length of texel in uv coord
// hard to get texel size in glsl es 100

float weight[5];

void main()
{
    // since 100 does not support array constructor
    weight[0] = 0.227027;
    weight[1] = 0.1945946;
    weight[2] = 0.1216216;
    weight[3] = 0.054054;
    weight[4] = 0.016216;

    // ref: http://learnopengl.com/#!Advanced-Lighting/Bloom

    //vec2 tex_offset = 1.0 / texel_size; // gets size of single texel
    //vec3 result= vec3(1.0,1.0,1.0);
    //vec3 result= texture2D(u_color, v_uv).rgb;
    vec3 result = texture2D(u_color, v_uv).rgb * weight[0]; // current fragment's contribution
    if(u_horizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture2D(u_color, v_uv + vec2(u_tex_offset.x * float(i), 0.0)).rgb * weight[i];
            result += texture2D(u_color, v_uv - vec2(u_tex_offset.x * float(i), 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture2D(u_color, v_uv + vec2(0.0, u_tex_offset.y * float(i))).rgb * weight[i];
            result += texture2D(u_color, v_uv - vec2(0.0, u_tex_offset.y * float(i))).rgb * weight[i];
        }
    }
    gl_FragColor = vec4(result, texture2D(u_color, v_uv).a);
}
