WebGL Deferred Shading
======================

**University of Pennsylvania, CIS 565: GPU Programming and Architecture, Project 5**

* Xueyin Wan
* Platform: *FireFox 49.0.2* on Windows 10 x64, i7-6700K @ 4.00GHz 16GB, GTX 970 4096MB (Personal Desktop)

###Features I Implemented

* Deferred Blinn-Phong shading
* Bloom using blur
* Bloom using two-pass Gaussian blur (extract, blur, blurtwice, combine)
* Toon Shading (ramp shading, edge detection)
* Scissor Test Optimization (with debug view)
* Screen-space Motion Blur 
* G-Buffer Optimization

### Live Online

[![](img/thumb.png)](http://TODO.github.io/Project5B-WebGL-Deferred-Shading)

## Showcase My Result
### Part One

### 1. Deferred Blinn-Phong shading
|  Depth Map  | Position Map |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436556417.png "Depth Map") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436560546.png "Position Map") |

| Geometry Normal  | Normal map |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436569856.png "Geometry Normal") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436581008.png "Normal Map") |

| Surface Normal  | Color map |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436585799.png "Surface Normal") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/deferred-1478436575930.png "Color Map") |

Above pictures show the whole procudure of deferred shading. In our code base, Blinn-Phong shading was the first basic feature. We do not contain any post processing fancy effects. Just applied Blinn-Phong lighting in blinnphong-pointlight.frag.glsl and render with this shader.

### 2. Two-pass Gaussian blur Bloom Effect
|  Without Bloom Effect | With Bloom Effect |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without_bloom.gif "Without Bloom Effect") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/only_bloom.gif " With Bloom Effect") |
I learned bloom effect on this website: http://learnopengl.com/#!Advanced-Lighting/Bloom

We can see, that basically 4 steps contained in bloom effect. We just follow the steps to achieve this effect.

`First : Extract`
In this step, we extract all the fragments that exceed a certain brightness.This gives us an image that only shows the bright colored regions as their fragment intensities exceeded a certain threshold.

`Second : Blur Horizontally`
In this step, we simply took the average of surrounding pixels of an image. We choose Gaussian Operator here. 

First, we select the horizontal neighbor pixels to start blur.
We save this first blur in the first framebuffer, since we need to blur it vertically based on this current result.

`Third: Blur Vertically`
In this step, we toggle to the vertically blur mode.

With these two steps, we simply finish the Two-pass Gaussian blur and we can save current image to next step.

`Fourth: Combine`
We combine the result we derived after above three steps with our original picture. Then we could get the bloom effect.

By the way I think two pass blur is really clever since we deduplicate a lot of repeated I/O and calculations.

### 3. Toon Shading
|  Without Toon Shading | With Toon Shading |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without-toon-shading.gif "Without Toon Shading") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/toon-shading.gif " With Toon Shading") |

Toon shading contains two steps: ramp shading + edge detection.
In ramp shading procedure, what we need to think about is that: the diffuse and specular values in the blinn-phong shading should be calculated based on step functions, rather than continous functions. So we use step function to classify the fragments with different lambert and specular terms.

After we finish ramp shading, we come to the edge detection stage. Luckily I've using opencv during 2014-2015, so I have some basic image processing concepts about this. Basically here, we select our contour based on depth information of the fragment itself and surrounding pixels.


### 4. Motion Blur
| Without Motion Blur | With Motion Blur |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without_motion_blur.gif "Without Motion Blur") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/motion_blur_correct2.gif "With Motion Blur") |

Here, we need to take advantage of camera's projection matrix since in our scene, in fact it is the camera always moving, not the geometry in the scene. We then need the previous frame's camera projection matrix(we could save it as a global variable). Then we come into next frame, we first pass this to camera's prev_matrix property, then using current frame's camera projection matrix to update this global previous projection matrix. This method works fine!

How do I think out this idea? Thanks to this very very very useful tutorial: http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html

In this tutorial, we could see that we need the previous camera projection matrix information. Then I just follow the formula in the code provided in this tutorial to get the correct result.
We could get the blur vector between two frames, and simply divide by 2 to get the velocity.(blur along velocity direction)

### Part Two: Optimization
### 1. Scissor Test
| Debug View Of Scissor Test | Debug View Of Scissor Test |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/debug_scissor.gif "Debug Scissor Test") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/debug_scissor2.gif "Debug Scissor Test") |
With scissor test, we do not need to render the full image. We only need to render a rectangle area around the light. This will definitely shorten the time of rendering.

### 2. Decrease the size of the G-Buffer
When read through the code, I found that
```javascript
    vec3 pos = gb0.xyz;     // World-space position
    vec3 geomnor = gb1.xyz;  // Normals of the geometry as defined, without normal mapping
    vec3 colmap = gb2.rgb;  // The color map - unlit "albedo" (surface color)
    vec3 normap = gb3.xyz;  // The raw normal map (normals relative to the surface they're on)
    vec3 nor = applyNormalMap (geomnor, normap); // Surface normal   
```
We can see in the code above, we have gb1 and gb3 contain two vectors related to normal : geometry normal and raw normal map. Since at last we need to apply Normal map to Geometry normal and finally get a surface normal, we could save the spaces and do the computation in between, and then directly pass Surface normal to gbuffer. It definitely won't affect the correctness of the result but SAVE SPACE and IMPROVE TIME EFFICIENCY.
 

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

### Extra Credits
* [Toon Shading](https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Toon_Shading)
* [Bloom Effect](http://learnopengl.com/#!Advanced-Lighting/Bloom)
* [Motion Blur](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html)
