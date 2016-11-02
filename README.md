Parallel Fast Fourier Transform
======================

***PAGE UNDER CONSTRUCTION***

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Gabriel Naghi
* Tested on: GeForce GT 730 1024 MB

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


