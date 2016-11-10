#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform float u_bloomThreshold;

varying vec2 v_uv;

void main() {
    vec4 color = texture2D(u_color, v_uv);

    float brightness = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);

    if(brightness > u_bloomThreshold){
        gl_FragColor = color;
    }
    else{
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
