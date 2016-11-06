#include <cstdio>
#include <math.h>
#include <parallel_fft\fft.h>

#define REAL 0
#define IMAG 1
#define M_PI 3.14159265358979323846
#define NUM_POINTS 8

thrust::complex<double> signal[NUM_POINTS];
thrust::complex<double> result[NUM_POINTS];

void acquire_from_somewhere( thrust::complex<double> * signal ) {
    /* Generate two sine waves of different frequencies and
     * amplitudes.
     */

    int i;
    for (i = 0; i < NUM_POINTS; ++i) {
        double theta = (double)i / (double)NUM_POINTS * M_PI;

        signal[i] = thrust::complex<double> (1.0 * cos(10.0 * theta) +
                          0.5 * cos(25.0 * theta),
					1.0 * sin(10.0 * theta) +
                          0.5 * sin(25.0 * theta));
    }
}

int main(int argc, char* argv[]) {
    //const int SIZE = 1 << 8;
    //const int NPOT = NUM_POINTS - 3;
    //thrust::complex<double> a[SIZE], b[SIZE], c[SIZE];
 	acquire_from_somewhere(signal);
    parallel_fft(NUM_POINTS, signal, result);

    for (int i = 0; i < NUM_POINTS; ++i) {
        double mag = thrust::abs(result[i]);
        
        printf("%f\n", mag);
    }
}
