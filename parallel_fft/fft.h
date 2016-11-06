#pragma once

#include "common.h"
#include <math.h>
#include <cuda.h>
#include <cuda_runtime.h>
#include <thrust/complex.h>

#define M_PI 3.14159265358979323846

void parallel_fft (int N, thrust::complex<double> * samples, thrust::complex<double> * transform);

void checkpoint(const char * print_me, int N, thrust::complex * buf)
{
	printf(print_me);

	for(int i = 0; i < N; ++i)
		printf("%f + i %f\n", buf[i].real, buf[i].imag );

}