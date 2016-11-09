WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Ruoyu Fan
* Tested on: **Google Chrome 54.0.2840.87** on
  * Windows 10 x64, i7-4720HQ @ 2.60GHz, 16GB Memory, GTX 970M 3072MB (personal laptop)

__NOTE:__ my submission requires an additional WebGL extension - `EXT_frag_depth`, used in `defered/ambient.frag.glsl` to properly write depth data into lighting passes' frame buffer to do __inverted depth test__ with __front-face culling__

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
    * Use menu option to control blur size (which changes uniform variable `u_scale` passing to `bloom.frag.glsl`)
  * Finally combine the blurred image to the original output
* __Scissor test for lighting__: when accumulating shading from each point light source, only render in a rectangle around the light.
  * Use `debugScissor` option to toggle scissor visual, or select `6 Light scissors` to show scissor only.
  * This is used to compare with my __light proxy__ implementation
* __Light proxy__: instead of rendering a scissored full-screen quad for every light, I render __proxy geometry__ which covers the part of the screen affected by a light (using spheres for point lights), thus __reducing wasted fragments in lighting pass__.
  * Using __inverted depth test__ with __front-face culling__ to avoid lighting geometries that are far behind the light, thus further reducing wasted fragments.
  * This feature requires WebGL's `EXT_frag_depth` extension to write depth data into frame buffer at defered shading stage in order to do the depth test.
  * Use `useLightProxy` option to toggle on/off and use `useInvertedDepthTestForLightProxy` option to toggle depth test and front face culling for lighting pass.
* __Optimized g-buffer__ from 4*vec4 to 2*vec4 by compressing normal to two floats, increasing framerate to __167%__, see below for details

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
