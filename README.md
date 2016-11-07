WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Ruoyu Fan
* Tested on: (TODO) **Google Chrome 222.2** on
  Windows 22, i7-2222 @ 2.22GHz 22GB, GTX 222 222MB (Moore 2222 Lab)

### Live Online

[![](img/thumb.png)](https://windydarian.github.io/Project5-WebGL-Deferred-Shading-with-glTF/)

FIXME: glTF files returns 404 on GitHub Pages

### Demo Video/GIF

[![](img/video.png)](TODO)

### Work Done

* Deferred __Blinn-Phong shading__ with normal mapping
  * Using `clamp(1.0 - light_distance * light_distance / (u_lightRad * u_lightRad), 0.0, 1.0) ` as attenuation model for point lights
* __Bloom__ post-processing effect with __two-pass Gaussian blur__ using three steps:
  * First extract bright areas with a threshold
  * Then do a __two-pass Gaussian blur__ using separable convolution (vertical then horizontal)
    * Using a uniform variable `u_strength` to control blur strength (see `bloom.frag.glsl`)
  * Finally combine the blurred image to the original output
* __Scissor test optimization__: when accumulating shading from each point light source, only render in a rectangle around the light.
  * Use `debugScissor` option to toggle scissor visual, or select `6 Light scissors` to show scissor only.

*DO NOT* leave the README to the last minute! It is a crucial part of the
project, and we will not be able to grade you without a good README.

This assignment has a considerable amount of performance analysis compared
to implementation work. Complete the implementation early to leave time!


### Credits

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
