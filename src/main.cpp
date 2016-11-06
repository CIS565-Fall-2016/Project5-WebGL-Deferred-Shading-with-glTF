#include <cstdio>
#include "testing_helpers.hpp"
#include "fft.h"

#define NUM_POINTS 64

thrust::complex signal[NUM_POINTS];
thrust::complex result[NUM_POINTS];

void acquire_from_somewhere( thrust::complex * signal ) {
    /* Generate two sine waves of different frequencies and
     * amplitudes.
     */

    int i;
    for (i = 0; i < NUM_POINTS; ++i) {
        double theta = (double)i / (double)NUM_POINTS * M_PI;

        signal[i][REAL] = 1.0 * cos(10.0 * theta) +
                          0.5 * cos(25.0 * theta);

        signal[i][IMAG] = 1.0 * sin(10.0 * theta) +
                          0.5 * sin(25.0 * theta);
    }
}

int main(int argc, char* argv[]) {
    //const int SIZE = 1 << 8;
    //const int NPOT = NUM_POINTS - 3;
    //thrust::complex<double> a[SIZE], b[SIZE], c[SIZE];
 	acquire_from_somewhere(signal);
    parallel_fft(NUM_POINTS, signal, result);

    for (i = 0; i < NUM_POINTS; ++i) {
        double mag = sqrt(result[i][REAL] * result[i][REAL] +
                          result[i][IMAG] * result[i][IMAG]);
        
        printf("%g\n", mag);
    }
}
