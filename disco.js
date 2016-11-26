'use strict'

/*
    This file implements WebGL functionality; by using shaders and WebGL API to render 3D objects into a HTML canvas
*/

var gl;

function initGL(canvas)
{
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {

    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function webGLStart()
{
    var canvas = document.getElementById("webgl");
    initGL(canvas);
    gl.clearColor(0.0, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
