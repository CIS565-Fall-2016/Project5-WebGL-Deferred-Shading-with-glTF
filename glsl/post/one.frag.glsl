#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }
    
    // float count = 0.0;
    // vec3 cumul = vec3(0,0,0);
    // for (float x = -R; x < R; x += 0.001) {
    //     for (float y = -R; y < R; y += 0.001) {
    //         vec4 col = texture2D(u_color, v_uv + vec2(x, y));
    //         if (length(col.rgb) > 0.8) {
    //             cumul += col.rgb;
    //             count += 1.0;
    //         }
    //     }
    // }
    // if (count > 0.0) {
    //     color.rgb += cumul / count;
    // }

    if (length(color.rgb) > 0.7) {
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    // gl_FragColor = color;
}
