WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Ottavio Hartman
* Tested on: **Google Chrome 54.0.2840.71**
  Windows 10, FX-8320 @ 3.50GHz 8GB, GTX 1060 3GB

### Live Online

[![](img/thumb.png)](http://TODO.github.io/Project5B-WebGL-Deferred-Shading)

### Demo GIF

![](img/demo.gif)

### Basic Deferred Renderer

This is a WebGL implementation of a deferred renderer. Some of the features I have included are Blinn-Phong shading, toon shading, and motion blur. The optimizations
which make the renderer run smoothly include scissor rendering and reducing the number of g-buffers needed to render the scene. 

The deferred renderer first renders the scene to 4 different textures, known as g-buffers. These textures hold the color, position, normal, and normal-map information
for every fragment on the screen. By sampling these textures in a shader in a per-light loop, I use their information to implement Blinn-Phong shading very rapidly for
hundreds of lights.

Below is an image from the renderer calculating the shading from 400 lights.

![](img/blinnphong.PNG)

Because the algorithm loops over the number of lights in the scene, it gets slower as more lights are added. The analysis of the performance degredation as lights are 
added can be found in the __optimization__ section.

### Toon Shading



### Bloom

### Motion Blur
http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html


Concise overview write-up of the feature.
Performance change due to adding the feature.
If applicable, how do parameters (such as number of lights, etc.) affect performance? Show data with simple graphs.
Show timing in milliseconds, not FPS.
If you did something to accelerate the feature, what did you do and why?
How might this feature be optimized beyond your current implementation?


### Optimization

#### Scissor

#### G-Buffer optimization
4 g-buffers -> 3 g-buffers

Before: 16-17ms per frame (scissor on)

Bloom
16x16 ~ 16ms (100 lights)
32x32 ~ 16ms
64x64 ~ 50ms

Bloom is independent on number of lights--depends on screen size/blur size


### Credits

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
