#pragma once

#include "common.h"
#include <math.h>
#include <cuda.h>
#include <cuda_runtime.h>
#include <thrust/complex.h>

#define M_PI 3.14159265358979323846

void parallel_fft (int N, thrust::complex<double> * samples, thrust::complex<double> * transform);