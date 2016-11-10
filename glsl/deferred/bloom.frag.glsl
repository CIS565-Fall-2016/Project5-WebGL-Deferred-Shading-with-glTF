#version 100
precision highp float;
precision highp int;

#define sigma  15
#define alpha  0.15
#define cutoff 0.5

uniform float u_width;
uniform float u_height;

uniform sampler2D u_color;

uniform int u_whichway;


varying vec2 v_uv;


 
 
void main(){
    vec4 thiscolor = texture2D(u_color, v_uv).rgba;
    
    if (thiscolor.x == 0.0){
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    float dx = 1.0/ u_width;
    float dy = 1.0 / u_height;

    vec2 dd = vec2(0.0, 0.0);
    if (u_whichway==1){ // define dy as 1
        dd = vec2(0.0, dy);
    }
    else if (u_whichway ==0){
        dd = vec2(dx, 0.0);
    }

    vec3 result = vec3(0.0, 0.0, 0.0);
    vec3 thres3 = vec3(cutoff);
    for (int i= -sigma; i<=sigma; i++){
        vec3 tempcol= texture2D(u_color, v_uv + dd).rgb;
        result += max(tempcol-thres3, 0.0) *alpha;
    }

    gl_FragColor = vec4(result,1.0);
}

 
