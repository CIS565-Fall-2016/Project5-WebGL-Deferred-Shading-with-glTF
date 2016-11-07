#version 100
precision highp float;
precision highp int;

#define KSIZE 5

uniform sampler2D u_color;
uniform vec2 u_texSize;
uniform float u_radius;
uniform float u_kernel[KSIZE];
uniform int u_pass;

varying vec2 v_uv;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec3 color = texture2D(u_color, v_uv).rgb;
    vec2 tOff = u_radius / u_texSize;

    if (u_pass == 0) {
      float bright = dot(color, vec3(0.2126, 0.7152, 0.0722));
      if (bright < 1.0)
        color = vec3(0,0,0);
    }
    else if (u_pass == 1) {
      color *= u_kernel[0];
      for (int i = 1; i < KSIZE; i++) {
        color += texture2D(u_color, v_uv + vec2(tOff.x*float(i), 0.0)).rgb * u_kernel[i];
        color += texture2D(u_color, v_uv - vec2(tOff.x*float(i), 0.0)).rgb * u_kernel[i];
      }
    }
    else if (u_pass == 2) {
      color *= u_kernel[0];
      for (int i = 1; i < KSIZE; i++) {
        color += texture2D(u_color, v_uv + vec2(0.0, tOff.y*float(i))).rgb * u_kernel[i];
        color += texture2D(u_color, v_uv - vec2(0.0, tOff.y*float(i))).rgb * u_kernel[i];
      }
    }

    /*
    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }
    */

    gl_FragColor = vec4(color, 1);
}
