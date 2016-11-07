/* Start reading here */

#include <fftw3.h>
#include <stdio.h>
#include <time.h>
#include <windows.h>


/* Never mind this bit */

#include <stdio.h>
#include <math.h>

#define REAL 0
#define IMAG 1

int NUM_POINTS = 0x1;

void acquire_from_somewhere(fftw_complex* signal) {
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
    printf("SAMPLES\n");
    for (i = 0; i < NUM_POINTS; ++i) {
        double mag = sqrt(signal[i][REAL] * signal[i][REAL] +
                          signal[i][IMAG] * signal[i][IMAG]);

        printf("%g\n", mag);
    }
}

void do_something_with(fftw_complex* result) {
    printf("RESULTS\n");
    int i;
    for (i = 0; i < NUM_POINTS; ++i) {
        double mag = sqrt(result[i][REAL] * result[i][REAL] +
                          result[i][IMAG] * result[i][IMAG]);

        printf("%g\n", mag);
    }
}


/* Resume reading here */

int main() {

  LARGE_INTEGER StartingTime, EndingTime, ElapsedMicroseconds;
  LARGE_INTEGER Frequency;

//
// We now have the elapsed number of ticks, along with the
// number of ticks-per-second. We use these values
// to convert to the number of elapsed microseconds.
// To guard against loss-of-precision, we convert
// to microseconds *before* dividing by ticks-per-second.
//

ElapsedMicroseconds.QuadPart *= 1000000;
ElapsedMicroseconds.QuadPart /= Frequency.QuadPart;

    while (NUM_POINTS < (0x1 << 12))
    {

      char a = getc(stdin);
     
      NUM_POINTS = NUM_POINTS << 1;
      fftw_complex signal[NUM_POINTS];
      fftw_complex result[NUM_POINTS];

      fftw_plan plan = fftw_plan_dft_1d(NUM_POINTS,
                                        signal,
                                        result,
                                        FFTW_FORWARD,
                                        FFTW_ESTIMATE);

      acquire_from_somewhere(signal);
     
      QueryPerformanceFrequency(&Frequency); 
      QueryPerformanceCounter(&StartingTime);

      fftw_execute(plan);

      QueryPerformanceCounter(&EndingTime);
      ElapsedMicroseconds.QuadPart = EndingTime.QuadPart - StartingTime.QuadPart;
      ElapsedMicroseconds.QuadPart *= 1000000;
      ElapsedMicroseconds.QuadPart /= Frequency.QuadPart;

      do_something_with(result);

      printf("Elapsed microseconds: %lu \n", ElapsedMicroseconds.QuadPart);

      fftw_destroy_plan(plan);
    }

    return 0;
}
