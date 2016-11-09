WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Xiaomao Ding
* Tested on: Windows 8.1, i7-4700MQ @ 2.40GHz 8.00GB, GT 750M 2047MB (Personal Computer)

### Live Online

[![](img/thumb.png)](https://xnieamo.github.io/Project5-WebGL-Deferred-Shading-with-glTF/)

### Demo Video/GIF

[![](img/Demo.gif)]

### Intro

This repository implements a WebGL based deferred shader. The concept behind deferred shading is to store the geometry information in a GBuffer. Then, further lighting and post-processing passes are executed on this buffer. This organization of shading will allow us to render multiple lights with a lower performance hit. This is because we no longer need to calculate the geometry for each additional light.  

#### Features
The deferred shader in this repository has the following features:
* Blinn-Phong shading
* Toon shading
* Bloom shading
* 2x 1D Gaussian Bloom shading optimization
* GBuffer packing optimizations

### Performance Analysis
#### GBuffer Optimization
The GBuffer is where we store information relevant to our geometry during the single pass through the scene. The naive implementation stores the color, position, normal, and normal map for each fragment in our shader. We can first optimize this by calculating the modified normal during the GBuffer copy pass, which reduces the number of vectors we need to store from 4 to 3.  Furthermore, the GBuffers are vec4's but both color and position are only vec3's. Since the normals are normalized, we can be clever and store just 2 values of the normal (calculating the third on the fly).  This allows us to further reduce the number of vec4's we need down to 2. The following is the organization of our buffers, where P stands for position, C for color, and N for normals:

[Px][Py][Pz][Nx]

[Cr][Cg][Cb][Ny]

As expected, reducing the size of the GBuffer improves performance. 

<p align="center">
  <img src="https://github.com/xnieamo/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/img/GBufferOpt.png?raw=true">
</p>

#### Shaders
The Blinn-Phong shader is the default in this repository. It combines a diffuse and specular component of the light color in order to fill in the fragments. The toon shader applies a ramp to the color of the fragments. In this implementation, the ramp is only applied to the diffuse color while a hard threshold is set for the specular. Finally, the bloom shader is a post-processing effect that adds blur to the lights in a scene. The result is that lights in a scene now appear to glow.  This can be achieve by applied a 2D Gaussian filter. Using Multiple Rendering Targets, we create a separate color buffer that contains only the lights, selected as fragments that have a brightness exceeding some threshold. Because this buffer contains only the lights, applying the Gaussian filter will not blur the rest of the scene. This repository contains two implementations of the Gaussian filter. The first implementation calculates the entire filter in 1 shader. The second optimizes the process by applying two shaders, one horizontal and the other vertical. The addition of the post-process step is expected to decrease performance, while the optimization should improve it.


<p align="center">
  <img src="https://github.com/xnieamo/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/img/Shaders.png?raw=true">
</p>

The Bloom optimizations turn out to not be too great. It could possibly be because the filter is too small (9x9) or perhaps that it is because the first pass now needs to allocate a framebuffer so that its results can be saved and sent to the second pass.


### Credits

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
