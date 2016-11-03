set(SOURCE_FILES
    "common.h"
    "common.cu"
    "fft.h"
    "fft.cu"
    )

cuda_add_library(parallel_fft
    ${SOURCE_FILES}
    OPTIONS -arch=sm_20
    )
