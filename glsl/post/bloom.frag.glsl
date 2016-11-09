#version 100
precision highp float;
precision highp int;

uniform sampler2D u_color;

varying vec2 v_uv;
/*
const vec4 SKY_COLOR = vec4(0.01, 0.14, 0.42, 1.0);

void main() {
    vec4 color = texture2D(u_color, v_uv);

    if (color.a == 0.0) {
        gl_FragColor = SKY_COLOR;
        return;
    }

    gl_FragColor = color;
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
*/


uniform sampler2D u_texture;
uniform float resolution;
uniform float radius;
uniform vec2 dir;
uniform int u_gauss;

int i = 0;
int j = 0;
void main() {

	// matlab's 3x3 gaussian
	//mat3 G = mat3(0.0113, 0.0838, 0.0113,
    //			  0.0838, 0.6193, 0.0838,
	//			  0.0113, 0.0838, 0.0113);

	vec2 coord = v_uv;
	float pixelwidth = 1.0/800.0;
	float size = 5.0*pixelwidth;


    vec4 accum = texture2D(u_texture, vec2(coord[0], coord[1]));

    // gaussian blur
    if(u_gauss == 1)
    {
    	float sigma_x = 1.0;
    	float sigma_y = 1.0;

    	for (int i=-15; i<15; i++)
    	{
    		for (int j=-15; j<15; j++)
    		{
    			float X = float(i)/15.0;//*size;
    			float Y = float(j)/15.0;//*size;

    	        float theta = atan(X / Y);
    	        float a = pow(cos(theta),2.0)/(2.0) + pow(sin(theta),2.0)/(2.0);
    	        float b = -sin(2.0*theta)/(4.0) + sin(2.0*theta)/(4.0);
    	        float c = pow(sin(theta),2.0)/(2.0) + pow(cos(theta),2.0)/(2.0);

    	        // compute gaussian height
    	        float amp = 1.0*exp( -(a*pow((X), 2.0) - 2.0*b*(X)*(Y) + c*pow((Y), 2.0))) ;

    	        accum += texture2D(u_texture,
    	        		           vec2(coord[0] + float(i)*size,
    	        		                coord[1] + float(j)*size)
								   )*amp;
    		}
    	}

    	vec4 color = min(accum/900.0, 1.0);
    	float ampl = pow(length(accum.rgb), 2.0);
    	gl_FragColor = vec4(color.rgb, 1.0);
    }

    // ENABLE STANDARD BLUR AND DISABLE GAUSSIAN
    else
    {
    	accum = vec4(0.0, 0.0, 0.0, 1.0);
    	{
    		for (int i=-15; i< 15; i++)
    		{
    			for (int j=-15; j<15; j++)
    			{
    				accum += texture2D(u_texture, vec2(coord[0] + float(i)*size, coord[1] + float(j)*size));
    			}
    		}
    	}
    	accum /= 900.0;
    	vec4 color = min(accum, 1.0);
    	//float ampl = pow(length(accum.rgb), 2.0)*0.1;


    	gl_FragColor = vec4(color.rgb, 1.0);
    }


    //else
    //{
    //	gl_FragColor = vec4(1.0, 0.0, 0.0, 0.0);
    //}
}
