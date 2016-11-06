#pragma once

#include "common.h"
#include <cuda.h>
#include <cuda_runtime.h>
#include <thrust/complex.h>

void parallel_fft (int N, thrust::complex<double> * samples, thrust::complex<double> * transform);