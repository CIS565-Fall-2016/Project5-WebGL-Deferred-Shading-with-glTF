#version 100
precision highp float;
precision highp int;

uniform bool u_motion;
uniform sampler2D u_color;
uniform mat4 u_prevCameraMat;
uniform sampler2D u_gbuf0;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    if (u_motion) {
        vec3 worldPos = texture2D(u_gbuf0, v_uv).xyz;
        vec4 prevPos = u_prevCameraMat * vec4(worldPos, 1.0);
        prevPos /= prevPos.w;
        vec2 prev_uv = prevPos.xy * 0.5 + 0.5;
        vec2 velocity = (v_uv - prev_uv) / 2.0;

        float numSamples = 6.0;
        vec2 uv = v_uv + velocity;
        for (int i = 1; i < 6; ++i) {
            color += texture2D(u_color, uv);
            uv += velocity;
        }

        gl_FragColor = color / numSamples;
    }
    else {
        gl_FragColor = color;
    }

}
