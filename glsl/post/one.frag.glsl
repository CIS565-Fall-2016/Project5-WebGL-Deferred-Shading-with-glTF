#version 100
#extension GL_EXT_draw_buffers: enable
precision highp float;
precision highp int;

uniform sampler2D u_color;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
        gl_FragData[0] = SKY_COLOR;
    } else {
		gl_FragData[0] = color;
	}

	// output bright color
	float brightness = dot(gl_FragData[0].rgb, vec3(.2126, .7152, .0722));

    if (brightness > 1.) {
        gl_FragData[1] = gl_FragData[0];
	} else {
		gl_FragData[1] = vec4(0.);
	}
}
