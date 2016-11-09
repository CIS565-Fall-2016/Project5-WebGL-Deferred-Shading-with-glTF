#version 100
precision highp float;
precision highp int;

uniform float u_nlights;
uniform float u_ntiles;
uniform vec2 u_tilesize;
uniform vec2 u_resolution;
uniform mat4 u_viewMat;
uniform mat4 u_projMat;
uniform sampler2D u_lightbuffer;
varying vec2 v_uv;

bool intersect(vec2 min, vec2 max, vec2 corner1, vec2 corner2) {
  // overlap in x && overlap in y
  // return (
  //   corner1.x < max.x && corner2.x >= min.x &&
  //   corner1.y < max.y && corner2.y >= min.y
  // );

  if (corner2.x < min.x) return false;
  if (corner1.x > max.x) return false;
  if (corner2.y < min.y) return false;
  if (corner1.y > max.y) return false;
  return true;

}

void main() {
  float t_idx = v_uv.x * u_ntiles;
  // lights are packed in 4's
  float pack_width = ceil(u_nlights / 4.0);
  float l4_idx = 4.0 * ceil(v_uv.y * pack_width);

  if (t_idx >= u_ntiles) return;

  float tilesX = ceil(u_resolution.x / u_tilesize.x);

  vec2 t_xy = vec2(
    floor(t_idx - tilesX * floor(t_idx / tilesX)),
    floor(t_idx / tilesX)
  );

  vec2 min = t_xy * u_tilesize;
  vec2 max = min + u_tilesize;

  vec4 outputVec = vec4(0.0);
  for (int i = 0; i < 4; ++i) {
    float l_idx = l4_idx + float(i);
    if (l_idx >= u_nlights) continue;

    float uv = l_idx / u_nlights + 0.1 / u_nlights;
    vec4 v1 = texture2D(u_lightbuffer, vec2(uv, 0.0));
    // vec4 v2 = texture2D(u_lightbuffer, vec2(uv, 0.5));
    // vec3 col = v2.rgb;
    float rad = v1[3] + 0.5; // increase this so floating point doesn't bite us
    vec4 pos = u_viewMat * vec4(v1.xyz, 1);

    if (pos.z > -0.01) pos.z = -0.01;

    vec4 p1 = u_projMat * pos;
    vec4 p2 = u_projMat * pos;

    p1 /= p1.w;
    p2 /= p2.w;

    vec4 offsets[8];
    offsets[0] = vec4(-1, -1, -1, 0);
    offsets[1] = vec4(1, -1, -1, 0);
    offsets[2] = vec4(-1, 1, -1, 0);
    offsets[3] = vec4(1, 1, -1, 0);
    offsets[4] = vec4(-1, -1, 1, 0);
    offsets[5] = vec4(1, -1, 1, 0);
    offsets[6] = vec4(-1, 1, 1, 0);
    offsets[7] = vec4(1, 1, 1, 0);

    for (int i = 0; i < 8; ++i) {
      vec4 p = pos + offsets[i] * rad;
      if (p.z > -0.01) p.z = -0.01;
      p = u_projMat * p;
      p /= p.w;
      if (p.x < p1.x) p1.x = p.x;
      if (p.y < p1.y) p1.y = p.y;
      if (p.x > p2.x) p2.x = p.x;
      if (p.y > p2.y) p2.y = p.y;
    }

    vec2 corner1 = p1.xy; 
    vec2 corner2 = p2.xy; 

    corner1 = clamp(corner1, vec2(-1.0, -1.0), vec2(1.0, 1.0));
    corner2 = clamp(corner2, vec2(-1.0, -1.0), vec2(1.0, 1.0));

    if (
      any(lessThan(corner2, vec2(-1, -1))) ||
      any(greaterThan(corner1, vec2(1, 1)))
    ) {
      gl_FragColor = vec4(0,0,0,0);
      return;
    }

    corner1 = (corner1 + vec2(1.0, 1.0)) * 0.5 * u_resolution;
    corner2 = (corner2 + vec2(1.0, 1.0)) * 0.5 * u_resolution;

    if (intersect(min, max, corner1, corner2)) {
      outputVec[i] = 1.0;
    } else {
      outputVec[i] = 0.0;
    }
  }
  gl_FragColor = outputVec;

}