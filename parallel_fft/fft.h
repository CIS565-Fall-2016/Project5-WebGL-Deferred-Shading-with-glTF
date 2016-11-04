#include "common.h"
#include <cstdio>
#include <cstring>
#include <cmath>
#include <thrust/complex.h>

void parallel_fft (int N, Complex<double> * samples, Complex<double> * transform);