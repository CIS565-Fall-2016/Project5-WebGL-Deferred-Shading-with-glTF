WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Akshay Shah
* Tested on: **Google Chrome 54.0.2840.87 m** on Windows 10, i7-5700HQ @ 2.70GHz 16GB, GTX 970M 6GB (Personal Computer)

### Live Online

[![Deferred Shader](img/deferred_shader.PNG)](https://aksris.github.io/Project5-WebGL-Deferred-Shading-with-glTF/)

### Demo Video/GIF

[![](img/bloom.PNG)](https://vimeo.com/190890932)

### Deferred Renderer

Deferred shading is a screen-space method where the first pass does not actually involve shading and is deferred to the second pass. In the first pass positions, normals, and materials for each surface are rendered into the  g-buffer and the shading happens in the deferred pass computing the lighting at each pixel using textures. The primary advantage is that geometry is separate from lighting giving a significant performance improvement over raytracers or rasterizers.

&nbsp;&nbsp;&nbsp;&nbsp;This renderer uses several debug passes: Depth, position, normal and color map after packing the geometry normal into the copy stage.

| Depth | Position | Color Map | Blinn-Phong |
| ----- | -------- | --------- | ----------- |
| ![](img/depth.PNG) | ![](img/position.PNG) | ![](img/colormap.PNG) | ![](img/blinnphong.PNG) |

Effects
-------

- [x] Implemented deferred Blinn-Phong shading (diffuse + specular) for point lights
  - With normal mapping
- [x] Bloom using post-process blur
  - [x] Two-pass Gaussian blur using separable convolution using a second postprocess render pass) to improve bloom or other 2D blur performance

  Optimizations
  -------------

- [x] Scissor test optimization: when accumulating shading from each point light source, only   render in a rectangle around the light.
  - [x] Improved screen-space AABB for scissor test


- [x] Optimized g-buffer format - reduced the number and size of g-buffers:
  - Reduce number of properties passed via g-buffer, by:
    - Applying the normal map in the copy shader pass instead of copying both geometry normals and normal maps

More stuff
-----------

- [x] Toon shading (ramp shader + simple edge detection)
- [x] Improved screen-space AABB for scissor test
- [x] Two-pass Gaussian blur using separable convolution (using a second postprocess render pass) to improve bloom or other 2D blur performance

### References

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
