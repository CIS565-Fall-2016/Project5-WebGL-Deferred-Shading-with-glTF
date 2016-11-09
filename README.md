CUDA Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Daniel Krupka
* Tested on: Debian testing (stretch), Intel(R) Core(TM) i7-4710HQ CPU @ 2.50GHz 8GB, GTX 850M


# About
This is a WebGL deferred renderer, featuring
* GLTF model loading
* Scissor optimization
* Bloom lighting, with single or two-pass Gaussian blur
* Cel shading

# Screenshots
![Sponza, Full](img/sponza_full.png "Sponza, Full")
![Duck, Full](img/duck.png "Duck, Full")

# Performance - Lights and Scissor Optimization
As expected, increasing the number of lights degrades the performance of the deferred lighting pass.
This graph shows the percentage of each frame's processing time that was spent on each pass.
![Sponza, no scissor, light plot](img/plot_lights.png "Sponza, no scissor, light plot")
