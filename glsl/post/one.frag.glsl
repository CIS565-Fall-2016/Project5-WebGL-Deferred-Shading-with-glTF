#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform vec2 u_invScreenSize;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.15, 0.3, 0.82, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);
    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    vec4 bright_color = color * color.a;

    for (int i = -32; i < 33; i++) {
        float i_float = float(i);
        for (int j = -32; j < 33; j++) {
            float j_float = float(j);
            bright_color += texture2D(u_color, vec2(v_uv.x + u_invScreenSize.x * i_float, v_uv.y + u_invScreenSize.y * j_float));
        }
    }
    bright_color /= 4096.;
    gl_FragColor = .5 * bright_color + .5 * color;
}
