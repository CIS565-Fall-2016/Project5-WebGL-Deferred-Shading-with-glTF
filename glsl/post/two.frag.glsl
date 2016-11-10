#version 100
precision highp float;
precision highp int;

uniform mat4 u_previousViewProjectionMatrix;
uniform sampler2D u_color;
uniform sampler2D u_pos;

varying vec2 v_uv;

void main() {
    const int num_samples = 20;

    vec4 color = texture2D(u_color, v_uv);
    if (color.a == 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    vec4 curr_pos = vec4(v_uv, 0, 1);
    vec4 previous_pos = u_previousViewProjectionMatrix * vec4(texture2D(u_pos, v_uv).xyz, 1);
    previous_pos /= previous_pos.w;  
    previous_pos += vec4(1, 1, 0, 0);
    previous_pos *= vec4(.5, .5, 1, 1);
    vec2 velocity = (curr_pos - previous_pos).xy/8.;  
   
    vec2 texCoord = v_uv;
    for(int i = 1; i < num_samples; ++i)  
    {  
        texCoord += velocity;
        // Sample the color buffer along the velocity vector.  
        vec4 currentColor = texture2D(u_color, texCoord);  
        // Add the current color to our color sum.  
        color += currentColor;  
    }  
    // Average all of the samples to get the final blur color.  
    vec4 finalColor = color / float(num_samples);  

    gl_FragColor = finalColor;//vec4(previous_pos.r, previous_pos.g, 0, 1);//vec4(velocity, 0, 1);
}
