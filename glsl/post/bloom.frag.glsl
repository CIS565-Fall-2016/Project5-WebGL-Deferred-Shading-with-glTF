#version 100
precision highp float;
precision highp int;

varying vec2 v_uv;

uniform sampler2D u_color;
uniform bool u_horizontal;
uniform float u_scale;
// length of texel in uv coord
// hard to get texel size in glsl es 100
uniform vec2 u_tex_offset;

// using a gaussian model with a sigma of 0.84089642
//const float sigma = 0.84089642;
const float one_over_sigma_sqr = 1.414213;
const float cent_coeff = 0.22508352;

void main()
{
    // ref: http://learnopengl.com/#!Advanced-Lighting/Bloom
    //    & https://en.wikipedia.org/wiki/Gaussian_blur

    float dist_scale_sqr = 1.0 / (u_scale * u_scale);

    vec3 result = texture2D(u_color, v_uv).rgb * cent_coeff; // current fragment's contribution
    float offset;
    float weight;
    if(u_horizontal)
    {
        for(int i = 1; i < 100; ++i)
        {
            offset = u_tex_offset.x * float(i);
            weight = exp(-0.5 * offset * offset * dist_scale_sqr * one_over_sigma_sqr) * cent_coeff;
            if (weight < 0.01) break;
            result += texture2D(u_color, v_uv + vec2(offset, 0.0)).rgb * weight;
            result += texture2D(u_color, v_uv - vec2(offset, 0.0)).rgb * weight;
        }
    }
    else
    {
        for(int i = 1; i < 100; ++i)
        {
            offset = u_tex_offset.y * float(i);
            weight = exp(-0.5 * offset * offset * dist_scale_sqr * one_over_sigma_sqr ) * cent_coeff;
            if (weight < 0.01) break;
            result += texture2D(u_color, v_uv + vec2(0.0, offset)).rgb * weight;
            result += texture2D(u_color, v_uv - vec2(0.0, offset)).rgb * weight;
        }
    }
    gl_FragColor = vec4(result, texture2D(u_color, v_uv).a);
}
