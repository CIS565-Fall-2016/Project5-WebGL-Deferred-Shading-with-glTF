#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_resolution;
uniform float u_amount;
uniform vec2 u_dir;

varying vec2 v_uv;

void main() {
    // http://dev.theomader.com/gaussian-kernel-calculator/
    vec4 color = vec4(0.0);

    // grab nine texels in the direction of blur
    color += texture2D(u_color, v_uv - 4.0*u_amount*u_dir/u_resolution) * 0.000229;
    color += texture2D(u_color, v_uv - 3.0*u_amount*u_dir/u_resolution) * 0.005977;
    color += texture2D(u_color, v_uv - 2.0*u_amount*u_dir/u_resolution) * 0.060598;
    color += texture2D(u_color, v_uv - 1.0*u_amount*u_dir/u_resolution) * 0.241732;

    color += texture2D(u_color, v_uv) * 0.382928;

    color += texture2D(u_color, v_uv + 1.0*u_amount*u_dir/u_resolution) * 0.241732;
    color += texture2D(u_color, v_uv + 2.0*u_amount*u_dir/u_resolution) * 0.060598;
    color += texture2D(u_color, v_uv + 3.0*u_amount*u_dir/u_resolution) * 0.005977;
    color += texture2D(u_color, v_uv + 4.0*u_amount*u_dir/u_resolution) * 0.000229;

    gl_FragColor = color;
}
