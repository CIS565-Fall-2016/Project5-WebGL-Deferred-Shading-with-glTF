#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_oldpos;

uniform mat4 u_projMat;

varying vec2 v_uv;

const float INV_SAMPLES = 0.2;

void main() {
  vec4 oldScreenSpacePos = u_projMat * texture2D(u_oldpos, v_uv);
  vec2 oldPos_uv = 0.5 * (1.0 + (oldScreenSpacePos.xy / oldScreenSpacePos.w));
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  vec2 diff = oldPos_uv - v_uv;
  for (float i = 0.0; i < 1.0; i += INV_SAMPLES) {
    color += texture2D(u_color, v_uv + i * diff);
  }
  gl_FragColor = color * INV_SAMPLES;
}
