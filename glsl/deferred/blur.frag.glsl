#version 100

precision highp float;
precision highp int;

#define NUM_GBUFFERS 3
#define NUM_SAMPLES 3

varying vec2 v_uv;

uniform mat4 prevTransform;
uniform mat4 newTransform;

uniform sampler2D u_depth;
uniform sampler2D u_color;


vec4 getViewPos(vec4 H, mat4 transform) {

    // Transform by the view-projection inverse.
    vec4 D = H * transform;

    // Divide by w to get the view position.
    return D / D.w;
}

void main() {

    // Get the depth buffer value at this pixel.
    float zOverW = texture2D(u_depth, v_uv).x; // why .x ?

    // H is the viewport position at this pixel in the range -1 to 1.
    vec2 rescaled_uv = vec2(v_uv * 2.0 - 1.0);

    // Screen pos
    vec4 H = vec4(rescaled_uv, zOverW, 1);

    vec4 prevPos = getViewPos(H, prevTransform);
    vec4 newPos = getViewPos(H, newTransform);

    // Use this frame's position and last frame's to compute the pixel velocity.
    vec2 velocity = (newPos - prevPos).xy; // TODO: shouldn't this be projected back into screen space?

    // Get the initial color at this pixel.
    vec4 color = texture2D(u_color, v_uv); // TODO: not the color, but the output of blinnphong

    vec2 v_uv_shifted = v_uv;
    for(int i = 1; i < NUM_SAMPLES; ++i) {
        v_uv_shifted += velocity;

        // Sample the color buffer along the velocity vector.
        vec4 currentColor = texture2D(u_color, v_uv_shifted); // TODO: sample from somewhere else.

        // Add the current color to our color sum.
        color += currentColor;
    }
    // Average all of the samples to get the final blur color.
    gl_FragColor = color / float(NUM_SAMPLES);
}
