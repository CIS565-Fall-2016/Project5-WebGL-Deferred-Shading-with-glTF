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

### Demo Video/GIF

[![](img/video.png)](TODO)

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

### 2. Two-pass Gaussian blur Bloom Effect
|  Without Bloom Effect | With Bloom Effect |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without_bloom.gif "Without Bloom Effect") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/only_bloom.gif " With Bloom Effect") |

### 3. Toon Shading
|  Without Toon Shading | With Toon Shading |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without-toon-shading.gif "Without Toon Shading") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/toon-shading.gif " With Toon Shading") |

### 4. Motion Blur
| Without Motion Blur | With Motion Blur |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/without_motion_blur.gif "Without Motion Blur") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/motion_blur_correct2.gif "With Motion Blur") |

### Part Two: Optimization
### 1. Scissor Test
| Debug View Of Scissor Test | Debug View Of Scissor Test |
|------|------|
|![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/debug_scissor.gif "Debug Scissor Test") | ![alt text](https://github.com/xueyinw/Project5-WebGL-Deferred-Shading-with-glTF/blob/master/result/debug_scissor2.gif "Debug Scissor Test") |








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
