Parallel Fast Fourier Transform
======================

***PAGE UNDER CONSTRUCTION***

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Gabriel Naghi
* Tested on: 
 - CPU implementation: Linux OpenSUSE, Intel Xeon E5-2470 @ 2.4 GHz, 32 GB RAM (Eniac)
 - GPU Implementation: Windows 10, Intel Core i7-2600 @ 3.4 GHz, 8 GB RAM, GeForce GT 730 1024 MB (DSL)

##Discrete Fourier Transforms
Fourier Transforms define a process by which to trasnform a signal from the time domain to the frequency ("forward transform") and vice versa ("inverse transform"). Fourier Transforms rely on the principle that and signal in the time domain can be represented as sinusoids. Generally, working with sinusoidal signals is preferred over singals of different shapes due to **properties?**. 

![](img/Fourier_unit_pulse.png)
Source: Wikipedia

In practice, Discrete Fourier Transforms (DFT) are used. This means that samples are of finite quantity and are equally spaced over time. The transform occurs by correlating each sample with with analyzing functions in the form of sinusoids. Of course, this produces high coefficients when the sample is similar and low amplitudes when dissimilar. 

In general the algorithm for computing a DFT is as follows: 

1. Sample the input signal uniformly, measuring the amplitude at each point. Label these x0, ... xN-1.
2. Calculate each frequency bin. Each frequency bin Xn is equal to the sum from 0 to N-1 of xn * e ^(-j2πkn / N)
3. Calculate the magnitude of each frequency bin
4. Calculate the frequency resolution. Frequency resolution can be calculated by dividing the sampleing frequency by the number of samples.
5. Throw out the samples at frequencies above the nyquist limit and *double the others?*.
6. ..
7. ..




##Fast Fourier Transforms



##Performance Analysis

My first optimization, as always was to find the generally optimal blocksize for the working implementation. No particular intermidiate value performed particulary well, so I chose blocksize of 64 as my "optimal" blocksize, against which I compared the CPU implementation. 

![](img/blocksizes.png)

Unfortunately for me and everyone else hoping for an easy exploit in the embarassingly parallel department, FFTW, an acronym for Fastest Fourier Transform in the West, really lives up to its name. It completely blew away my parallel GPU implementation, even on large inputs.

![](img/implementations.png)

To be fair to my unhappy little implementation, FFTW is a 100k + line monstrosity of finely tuned computation, and is generally considered the gold standard when it comes to fourier transforms. Some of the optimizations imbued in FFTW are:

* Routines coded in Assembly
* SIMD Instructions
* Dynamic Programming techniques to select from multiple strategies for a given input and machine (including memory and cache)
* Hard Coded Unrolled FFTs for small sizes


##Future Work
There is a lot of room for improvement in the FFT implementation I've done. Among these are:

* Vectorization
* Shared Memory usage
* Generalization to non radix-2 


##Roadblocks

I spent a gratuitous amount of time trying to decode GPU Gems 2's description of the algorithm, especially with regard to the Twiddle factor.

![](img/gpugems.png)
Source: NVIDIA GPU Gems 2

I could not figure out for the life of me what the relationship was between the stage/index and the exponent of the presumably global Nth root of unity. Fortunately, I eventually stumbled upon this graph, which depicts the proper proceedure and generally makes sense vis a vis the actual Cooley Tukey algorithm.

![](img/correctbutterfly.png)
Source: Scientific Research Publishing

###Sources
* GPU GEMS
* YouTube videos

