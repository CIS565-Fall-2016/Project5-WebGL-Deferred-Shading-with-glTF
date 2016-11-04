#include "fft.h"

thrust::complex<double> * dev_isamples;
thrust::complex<double> * dev_osamples;

void fft_init(int N)
{
	cudaMalloc((void **)&dev_isamples, N * sizeof(int));
	checkCUDAError("cudaMalloc dev_isamples failed!");
	cudaMalloc((void **)&dev_osamples, N * sizeof(int));
	checkCUDAError("cudaMalloc dev_osamples failed!");
}

void fft_free()
{
	cudaFree(dev_isamples);
	cudaFree(dev_osamples);
}

void ping_pong(thrust::complex ** a, thrust::complex ** b )
{
	thrust::complex * temp = * a;
	*a = *b;
	*b = temp;
}

/*
returns the reverse-bit value, normalized for original bit count
based on http://aggregate.org/MAGIC/#Bit%20Reversal
Assumes 32 bit int system
*/
__device__ int twiddle (unsigned int x)
{
    x = (((x & 0xaaaaaaaa) >> 1) | ((x & 0x55555555) << 1));
    x = (((x & 0xcccccccc) >> 2) | ((x & 0x33333333) << 2));
    x = (((x & 0xf0f0f0f0) >> 4) | ((x & 0x0f0f0f0f) << 4));
    x = (((x & 0xff00ff00) >> 8) | ((x & 0x00ff00ff) << 8));
    return ((x >> 16) | (x << 16)) >> (32 - ilog2ceil(x));
}

__global__ void inputScramble (int N, thrust::complex<double> * idata, thrust::complex<double> * odata)
{
	int index = (blockIdx.x * blockDim.x) + threadIdx.x;

	if (index > N)
		return;

	//do global memory access
	thrust::complex<double> myVal = idata[index];

	//hide latency with computation
	int out_index = twiddle(index);

	odata[out_index] = myVal;
}

__global__ void doButterfly (int N, int stage, thrust::complex W, 
							thrust::complex * idata, thrust::complex * odata)
{
	int index = (blockIdx.x * blockDim.x) + threadIdx.x;

	if (index > N)
		return;

	thrust::complex point = idata[index];

	// # points in this DFT computation
	float dft_points = powf(2, stage + 1); //logical shift instead?

	// N/2
	int half_points = (int) dft_points / 2; //also shift?

	// Relative index in this fourier transform
	int relativeIndex = index % dft_points;

	//GABE: What about multiiplicative factors??
	if (relativeIndex < half_points)
	{
		//subtract index
		thrust::complex point2 = idata[index+half_points];
		point = point + point2;
	}
	else
	{
		//subtract W^exp * index
		thrust::complex point2 = idata[index-half_points];
		float exponent = (relativeIndex % half_points) * (ilog2ceil(N) - stage);
		point = point2 - pow(W,exponent) * point;
	}

	odata[index] = point;
}

/*
parallel FFT implementation

inputs:
int N              - number of samples
float * samples    - pointer to array of sammples (of size N)
float * transform  - pointer to array where transform should be stored. 
                     It is safe for this to be the same as samples (i.e. in place)

*/

void parallel_fft (int N, 
	thrust::complex<double> * samples, 
	thrust::complex<double> * transform)
{
	//allocate buffers
	fft_init();

	//compute numBlocks
	dim3 numBlocks = (N + blockSize - 1) / blockSize;

	cudaMemcpy(dev_isamples, samples, sizeof(thrust::complex<double>) * N, cudaMemcpyHostToDevice);
	checkCUDAError("cudaMemcpy sample data to device failed!");

	//scrable inputs to reverse-binary order
	inputScramble << <numBlocks, blockSize>> >(N, dev_isamples, dev_osamples); 
	checkCUDAError("kernel inputScramble failed!");

	//ping pong buffers
	ping_pong(&dev_isamples, &dev_osamples);

	thrust::complex<double> W (thrust::cos(TWOPI / N), thrust::sin(TWOPI / N));

	//Butterfly
	for (int i = 0; i < ilog2ceil(N); ++i)
	{
		doButterfly(N, i, W, dev_isamples, dev_osamples);
		ping_pong(&dev_isamples, &dev_osamples);
	}

	//copy result to output
	cudaMemcpy(transform, dev_isamples, N * sizeof(thrust::complex), cudaMemcpyDeviceToHost);

	//free buffers 
	fft_free();

}