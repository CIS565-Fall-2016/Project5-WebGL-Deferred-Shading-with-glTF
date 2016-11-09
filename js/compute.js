
var computeBuffer = function(nItems, nComponents) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var pixelsForComponents = Math.ceil(nComponents / 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, nItems, pixelsForComponents, 0, gl.RGBA, gl.FLOAT, null);

  var buffer = new Float32Array(nItems * pixelsForComponents * 4);
  
  gl.bindTexture(gl.TEXTURE_2D, null)
  return {
    tex: tex,
    buffer: buffer,
    dimx: nItems,
    dimy: pixelsForComponents
  }
}

// var computeProxyFramebuffer = function(dimx, dimy) {
//   if (!dimy) dimy = 1;
//   var fbo = gl.createFramebuffer();
//   var tex = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, tex);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dimx, dimy, gl.RGBA, gl.UNSIGNED)


//   return {
//     fbo: fbo,
//     tex: tex
//   }
// }
