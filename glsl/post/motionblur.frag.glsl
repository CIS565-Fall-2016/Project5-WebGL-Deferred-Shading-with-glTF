#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_oldpos;
uniform int u_debug;
uniform mat4 u_projMat;

varying vec2 v_uv;

const float INV_SAMPLES = 0.2;

void main() {
  vec4 oldPos = texture2D(u_oldpos, v_uv);
  if (abs(oldPos.w) < 1e-9) {
    if (u_debug == 0) {
      gl_FragColor = texture2D(u_color, v_uv);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    return;
  }
  vec4 oldScreenSpacePos = u_projMat * oldPos;
  vec2 oldPos_uv = 0.5 * (1.0 + (oldScreenSpacePos.xy / oldScreenSpacePos.w));
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  vec2 diff = oldPos_uv - v_uv;
  for (float i = 0.0; i < 1.0; i += INV_SAMPLES) {
    color += texture2D(u_color, v_uv + i * diff);
  }
  if (u_debug == 0) {
    gl_FragColor = color * INV_SAMPLES;
  } else if (u_debug == 1) {
    gl_FragColor = vec4(0.5 + diff, 0.0, 1.0);
  }
}
