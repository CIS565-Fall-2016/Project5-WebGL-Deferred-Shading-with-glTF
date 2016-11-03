#include "common.h"
#include "fft.h"



void fft_init(int N)
{


}

void fft_free()
{


}

/*
parallel FFT implementation

inputs:
int N              - number of samples
float * samples    - pointer to array of sammples (of size N)
float * transform  - pointer to array where transform should be stored. 
                     It is safe for this to be the same as samples (i.e. in place)

output:
pointer to output array. 
*/

void parallel_fft (int N, Complex<float> * samples, Complex<float> * transform)
{
	//allocate buffers


	//compute blocksize


	//scrable inputs to reverse-binary order

	//Butterfly
	for (int i = 0; i < ilog2ceil(N) + 1; ++i)
	{


	}

	//copy result to output


	//free buffers 

}