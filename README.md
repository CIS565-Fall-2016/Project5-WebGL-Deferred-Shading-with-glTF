WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Bowen Bao
* Tested on: Firefox 49.0.2 on
  Windows 10, i7-6700K @ 4.00GHz 32GB, GTX 1080 8192MB (Personal Computer)

## Overview

1. Core Features:
	* Blinn-Phong shading
	* Bloom using Gaussian blur
	* Scissor test optimization
	* g-buffer optimization
2. Extra Features:
	* Toon shading
	* Screen-space motion blur

## Performance

We first compare the performance under different effects with settings of different amount of lights.

![](/img/perf.png)

It is interesting as we could observe that the effects are not putting a heavy load on the performance. And we get a linearly decrease in frame rates with the increasing number of lights. 

![](/img/perf2.png)

Observe that we used to pass four arrays in GBuffer, but two(normal and normal map) among them are only required so that we could calculate the modified normal for later use. We can optimize this step by pre calculating the normal, and pass it in one array in the GBuffer. Now we only pass 3 arrays each time. And as observed, the performance rises.

![](/img/scissor.png)

Above shows the box of scissor test. We improve performance by only rendering the region which is affected by each light(the red rectangle).

## Effects

![](/img/basic.png)

![](/img/bloom.png)

(Due to the number of lights, the bloom effect is not that obvious... The lights now would seem to glow compared to the basic rendering)

![](/img/blur.gif)


## Credits

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
