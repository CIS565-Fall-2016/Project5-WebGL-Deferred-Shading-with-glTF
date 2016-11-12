#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;
uniform sampler2D u_depth;

varying vec2 v_uv;

uniform mat4 u_crtCameraMat;
uniform mat4 u_invCrtCameraMat;
uniform mat4 u_preCameraMat;

const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    float zOverW = texture2D(u_depth, v_uv).x * 2.0 - 1.0;
	vec4 HH = vec4(v_uv.x * 2.0 - 1.0, v_uv.y * 2.0 - 1.0, zOverW, 1.0);
	vec4 DD = u_invCrtCameraMat * HH;
	vec4 worldPos = DD / DD.w;
	vec4 prePos = u_preCameraMat * worldPos;
	prePos /= prePos.w;
	vec2 velocity = ((HH - prePos) * 0.1).xy;

    vec4 color = texture2D(u_color, v_uv);
    vec4 tempResult = color;
    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    vec2 texCoord = v_uv + velocity;
    //int g_numSamples = 4;

    for (int i = 1; i < 16; i++)
    {
    	vec4 currentColor = texture2D(u_color, texCoord);
    	color += currentColor;
    	texCoord += velocity;
    }

    //gl_FragColor = vec4(velocity.x, 0.0, 0.0, 1.0);
    gl_FragColor = color / 16.0;
    //gl_FragColor = tempResult;
    //gl_FragColor = texture2D(u_color, v_uv);
    //gl_FragColor = vec4(worldPos.y, 0.0, 0.0, 1.0);
}
