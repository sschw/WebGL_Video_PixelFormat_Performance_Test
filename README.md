## WebGL PixelFormat Test

This project is a modified version of the conformance tests of [WebGL](https://github.com/KhronosGroup/WebGL). It tests the performance of texSubImage2D on videos by calling it 1000 times. After that, it displays the time that was needed to do these calls.

In order to run the tests, call the server script `server.py` which will run a server with CORS activated. (Python 3 required)

Use `http://localhost:8000` to reach the test overview page.

As there is no warmup phase inside the test, you should run a test multiple times to get an accurate time.

The video, which is used in the tests, is generated out of data from the Helioviewer Project.
