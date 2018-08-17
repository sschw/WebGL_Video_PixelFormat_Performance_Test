/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

// This block needs to be outside the onload handler in order for this
// test to run reliably in WebKit's test harness (at least the
// Chromium port). https://bugs.webkit.org/show_bug.cgi?id=87448
initTestingHarness();

var old = debug;
var debug = function(msg) {
  bufferedLogToConsole(msg);
  old(msg);
};

var generateTest = function(internalFormat, pixelFormat, pixelType, prologue, resourcePath, defaultContextVersion) {
    var wtu = WebGLTestUtils;
    var tiu = TexImageUtils;
    var gl = null;
    var successfullyParsed = false;

    var videos = [
      { src: resourcePath + "video.mp4", type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', },
    ];

    var init = function()
    {
        description('Verify texImage2D and texSubImage2D code paths taking video elements (' + internalFormat + '/' + pixelFormat + '/' + pixelType + ')');

        // Set the default context version while still allowing the webglVersion URL query string to override it.
        wtu.setDefault3DContextVersion(defaultContextVersion);
        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);

        runTest();
    }

    var runOneIteration = function(videoElement, useTexSubImage2D, flipY, sourceSubRectangle, program, bindingTarget)
    {
        sourceSubRectangleString = '';
        if (sourceSubRectangle) {
            sourceSubRectangleString = ' sourceSubRectangle=' + sourceSubRectangle;
        }
        debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
              ' with flipY=' + flipY + ' bindingTarget=' +
              (bindingTarget == gl.TEXTURE_2D ? 'TEXTURE_2D' : 'TEXTURE_CUBE_MAP') +
              sourceSubRectangleString);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Disable any writes to the alpha channel
        gl.colorMask(1, 1, 1, 0);
        var texture = gl.createTexture();
        // Bind the texture to texture unit 0
        gl.bindTexture(bindingTarget, texture);
        // Set up texture parameters
        gl.texParameteri(bindingTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Set up pixel store parameters
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        var targets = [gl.TEXTURE_2D];
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            targets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
        }
        // Handle the source sub-rectangle if specified (WebGL 2.0 only)
        if (sourceSubRectangle) {
            gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, sourceSubRectangle[0]);
            gl.pixelStorei(gl.UNPACK_SKIP_ROWS, sourceSubRectangle[1]);
        }
        // Upload the videoElement into the texture
        for (var tt = 0; tt < targets.length; ++tt) {
            if (sourceSubRectangle) {
                // Initialize the texture to black first
                if (useTexSubImage2D) {
                    // Skip sub-rectangle tests for cube map textures for the moment.
                    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                        continue;
                    }
                    gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                  sourceSubRectangle[2], sourceSubRectangle[3], 0,
                                  gl[pixelFormat], gl[pixelType], null);
                    
                    for(var j = 0; j < 1000; j++)
                        gl.texSubImage2D(targets[tt], 0, 0, 0,
                                         sourceSubRectangle[2], sourceSubRectangle[3],
                                         gl[pixelFormat], gl[pixelType], videoElement);
                } else {
                    for(var j = 0; j < 1000; j++)
                        gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                      sourceSubRectangle[2], sourceSubRectangle[3], 0,
                                      gl[pixelFormat], gl[pixelType], videoElement);
                }
            } else {
                // Initialize the texture to black first
                if (useTexSubImage2D) {
                    var width = videoElement.videoWidth;
                    var height = videoElement.videoHeight;
                    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                        // cube map texture must be square.
                        width = Math.max(width, height);
                        height = width;
                    }
                    gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                  width, height, 0,
                                  gl[pixelFormat], gl[pixelType], null);
                                  
                    for(var j = 0; j < 1000; j++)
                        gl.texSubImage2D(targets[tt], 0, 0, 0, gl[pixelFormat], gl[pixelType], videoElement);
                } else {
                    for(var j = 0; j < 1000; j++)
                        gl.texImage2D(targets[tt], 0, gl[internalFormat], gl[pixelFormat], gl[pixelType], videoElement);
                }
            }
        }

        if (sourceSubRectangle) {
            gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
            gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
        }
    }

    var runTest = function(videoElement)
    {
        var runTexImageTest = function(bindingTarget) {
            var program;
            if (bindingTarget == gl.TEXTURE_2D) {
                program = tiu.setupTexturedQuad(gl, internalFormat);
            } else {
                program = tiu.setupTexturedQuadWithCubeMap(gl, internalFormat);
            }

            return new Promise(function(resolve, reject) {
                var videoNdx = 0;
                var video;
                var runNextVideo = function() {
                    if (video) {
                        video.pause();
                    }

                    if (videoNdx == videos.length) {
                        resolve("SUCCESS");
                        return;
                    }

                    var info = videos[videoNdx++];
                    debug("");
                    debug("testing: " + info.type);
                    video = document.createElement("video");
                    var canPlay = true;
                    if (!video.canPlayType) {
                      testFailed("video.canPlayType required method missing");
                      runNextVideo();
                      return;
                    }

                    if(!video.canPlayType(info.type).replace(/no/, '')) {
                      debug(info.type + " unsupported");
                      runNextVideo();
                      return;
                    };

                    document.body.appendChild(video);
                    video.type = info.type;
                    video.src = info.src;
                    wtu.startPlayingAndWaitForVideo(video, runTest);
                }
                var runTest = function() {
                    runOneIteration(video, true, true,
                                    null,
                                    program, bindingTarget);
                    runNextVideo();
                }
                runNextVideo();
            });
        }
        runTexImageTest(gl.TEXTURE_2D).then(function(val) {
                wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
                finishTest();
        });
    }

    return init;
}
