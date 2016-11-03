#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_resolution;
uniform float u_amount;
uniform vec2 u_dir;

varying vec2 v_uv;

void main() {
    // https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5
    vec4 color = vec4(0.0);

    // grab nine texels in the direction of blur
    color += texture2D(u_color, v_uv - 4.0*u_amount*u_dir/u_resolution) * 0.0162162162;
    color += texture2D(u_color, v_uv - 3.0*u_amount*u_dir/u_resolution) * 0.0540540541;
    color += texture2D(u_color, v_uv - 2.0*u_amount*u_dir/u_resolution) * 0.1216216216;
    color += texture2D(u_color, v_uv - 1.0*u_amount*u_dir/u_resolution) * 0.1945945946;

    color += texture2D(u_color, v_uv) * 0.2270270270;

    color += texture2D(u_color, v_uv + 1.0*u_amount*u_dir/u_resolution) * 0.1945945946;
    color += texture2D(u_color, v_uv + 2.0*u_amount*u_dir/u_resolution) * 0.1216216216;
    color += texture2D(u_color, v_uv + 3.0*u_amount*u_dir/u_resolution) * 0.0540540541;
    color += texture2D(u_color, v_uv + 4.0*u_amount*u_dir/u_resolution) * 0.0162162162;

    gl_FragColor = color;
}
