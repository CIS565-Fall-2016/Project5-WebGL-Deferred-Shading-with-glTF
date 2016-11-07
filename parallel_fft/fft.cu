#include "fft.h"

#define blockSize 128
#define CHECKPOINT 1
thrust::complex<double> * dev_isamples;
thrust::complex<double> * dev_osamples;

#if CHECKPOINT
void checkpoint(const char * print_me, int N, thrust::complex<double> * buf)
{
	printf(print_me);

	for (int i = 0; i < N; ++i)
		printf("%f\n", thrust::abs(buf[i]));

}
#endif

__host__ __device__ int ilog2_2(int x) {
	int lg = 0;
	while (x >>= 1) {
		++lg;
	}
	return lg;
}

__host__ __device__ int ilog2ceil_2(int x) {
	return ilog2_2(x - 1) + 1;
}

void fft_init(int N)
{
	cudaMalloc((void **)&dev_isamples, N * sizeof(thrust::complex<double>));
	checkCUDAError("cudaMalloc dev_isamples failed!");
	cudaMalloc((void **)&dev_osamples, N * sizeof(thrust::complex<double>));
	checkCUDAError("cudaMalloc dev_osamples failed!");
}

void fft_free()
{
	cudaFree(dev_isamples);
	cudaFree(dev_osamples);
}

void ping_pong(thrust::complex<double> ** a, thrust::complex<double> ** b)
{
	thrust::complex<double> * temp = *a;
	*a = *b;
	*b = temp;
}




__device__ unsigned int twiddle(unsigned int x)
{
	//strictly reverses bits. must shift shift in calling context
	x = (((x & 0xaaaaaaaa) >> 1) | ((x & 0x55555555) << 1));
	x = (((x & 0xcccccccc) >> 2) | ((x & 0x33333333) << 2));
	x = (((x & 0xf0f0f0f0) >> 4) | ((x & 0x0f0f0f0f) << 4));
	x = (((x & 0xff00ff00) >> 8) | ((x & 0x00ff00ff) << 8));
	return ((x >> 16) | (x << 16));
}




__global__ void inputScramble(int N, thrust::complex<double> * idata, thrust::complex<double> * odata)
{
	
	int index = (blockIdx.x * blockDim.x) + threadIdx.x;
	
	if (index >= N)
		return;

	//do global memory access
	thrust::complex<double> myVal = idata[index];

	//hide latency with computation
	int out_index = twiddle(index) >> (32 - ilog2ceil_2(N));
#if CHECKPOINT
	printf("iindex is %d oindex is %d\n", index, out_index, thrust::abs(myVal));
#endif
	odata[out_index] = myVal;
}




__global__ void doButterfly(int N, int stage, int numPoints,
	thrust::complex<double> * idata, thrust::complex<double> * odata)
{
	int index = (blockIdx.x * blockDim.x) + threadIdx.x;

	if (index >= N)
		return;

	thrust::complex<double> point = idata[index];

	// N/2
	int half_points = numPoints / 2; //also shift?

	// Relative index in this fourier transform
	int relativeIndex = index % numPoints;

	thrust::complex<double> point2;

	if (relativeIndex < half_points)
	{
		// add point + N/2 to self
		point2 = idata[index + half_points];
	}
	else
	{
		// subtract self from - N/2
		point2 = idata[index - half_points];
		point *= -1.0;
		//thrust::complex<double> exponent = (relativeIndex % half_points) * (ilog2ceil_2(N) - stage);
		//point = point2 - thrust::pow(W, exponent) * point;
	}

	point = point + point2;

#if CHECKPOINT
	printf("i am %d, combining with %d\n", index, relativeIndex < half_points ? index + half_points : index - half_points);
	printf("half_points is %d, relativeIndex is %d\n", half_points, relativeIndex);
#endif

	odata[index] = point;
}






// in place multiplication of twiddle factors
__global__ void doMultiply(int N, int numPoints, thrust::complex<double> W, thrust::complex<double> * idata)
{
	
	int index = (blockIdx.x * blockDim.x) + threadIdx.x;
	
	if (index >= N)
		return;

	//do global memory access
	thrust::complex<double> myVal = idata[index];

	int relativeIndex = index % numPoints;

	if (relativeIndex < numPoints / 2)
		return;

#if CHECKPOINT
	printf("my index is %d, myVal is %f + i%f, my exponent is %d\n", index, myVal.real(), myVal.imag() ,relativeIndex - numPoints / 2);
#endif

	thrust::complex<double> exponent = (relativeIndex - numPoints / 2, 0);
	myVal *= thrust::pow(W, exponent);

#if CHECKPOINT
	printf("my index is %d, newVal is %f + i%f\n", index, myVal.real(), myVal.imag());
#endif

	idata[index] = myVal;
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

#if CHECKPOINT
	checkpoint("initial samples\n", N, samples);
#endif

	//allocate buffers
	fft_init(N);

#if CHECKPOINT
	thrust::complex<double> * checkpoint_buf = (thrust::complex<double> *) calloc(N,sizeof(thrust::complex<double>));
#endif

	//compute numBlocks
	dim3 numBlocks = (N + blockSize - 1) / blockSize;

	cudaMemcpy(dev_isamples, samples, sizeof(thrust::complex<double>) * N, cudaMemcpyHostToDevice);
	checkCUDAError("cudaMemcpy sample data to device failed!");

#if CHECKPOINT
	cudaMemcpy(checkpoint_buf, dev_isamples, N*sizeof(thrust::complex<double>), cudaMemcpyDeviceToHost);
	checkpoint("initial samples on device\n", N, checkpoint_buf);
#endif


	//scrable inputs to reverse-binary order
	inputScramble << <numBlocks, blockSize>> >(N, dev_isamples, dev_osamples); 
	checkCUDAError("kernel inputScramble failed!");

#if CHECKPOINT
	cudaMemcpy(checkpoint_buf, dev_osamples, N*sizeof(thrust::complex<double>), cudaMemcpyDeviceToHost);
	checkpoint("after scramble\n", N, checkpoint_buf);
#endif

	//ping pong buffers
	ping_pong(&dev_isamples, &dev_osamples);

	//Butterfly
	for (int i = 0; i < ilog2ceil(N); ++i)
	{
		int numPoints = pow(2, i+1);
		// create the W vector for this N
		thrust::complex<double> W (cos((2.0 * M_PI) / numPoints),  -1.0 * sin((2.0 * M_PI) / numPoints));
		
		//pre-multiply pionts by necessary twiddle factors
		doMultiply << <numBlocks, blockSize>> >(N, numPoints, W, dev_isamples);
		checkCUDAError("doMultiply failed!");

		doButterfly << <numBlocks, blockSize>> >(N, i, numPoints, dev_isamples, dev_osamples);
		checkCUDAError("doButterfly sample data to device failed!");
		
#if CHECKPOINT
		cudaMemcpy(checkpoint_buf, dev_osamples, N*sizeof(thrust::complex<double>), cudaMemcpyDeviceToHost);
		checkpoint("after butterfly\n", N, checkpoint_buf);
#endif

		ping_pong(&dev_isamples, &dev_osamples);
	}

	//copy result to output
	cudaMemcpy(transform, dev_isamples, N * sizeof(thrust::complex<double>), cudaMemcpyDeviceToHost);

	//free buffers 
	fft_free();

#if CHECKPOINT
	free(checkpoint_buf);
#endif
}
