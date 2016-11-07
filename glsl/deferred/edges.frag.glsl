#version 100
precision highp float;
precision highp int;

#define NUM_GBUFFERS 3
#define NUM_CEL_CUTS 7
#define gb(i) (texture2D(u_gbufs[i], v_uv).xyz)
#define round(n) (floor((n) + 0.5))

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform vec3 u_camPos;
uniform float u_lightRad;
uniform sampler2D u_gbufs[NUM_GBUFFERS];
uniform sampler2D u_depth;
uniform int u_toon;

varying vec2 v_uv;

void main() {

}
