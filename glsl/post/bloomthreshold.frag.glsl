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

    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    if (brightness < 1.0)
    	color = vec4(0.0, 0.0, 0.0, 1.0);
    gl_FragColor = color;
}
