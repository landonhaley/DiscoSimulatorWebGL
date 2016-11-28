
var gl;

function initShaders() {

}

function readTextFile(filePath) {
    var fileText = new XMLHttpRequest();
    fileText.open("GET", filePath, true);
    fileText.onreadystatechange = function ()
    {
        if(fileText.readyState === 4)
        {
            if(fileText.status === 200 || fileText.status == 0)
            {
                alert(fileText.responseText);
                return fileText.responseText;
            }
        }
    }
    fileText.send(null);
}

var vertexBuffer, normalBuffer, indexBuffer;

function loadJSON(jsonData)
{
    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(jsonData.vertexNormals), gl.STATIC_DRAW);
    normalBuffer.itemSize = 3;
    normalBuffer.numItems = jsonData.vertexNormals.length / 3;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(jsonData.vertexPositions), gl.STATIC_DRAW);
    vertexBuffer.itemSize = 3;
    vertexBuffer.numItems = jsonData.vertexPositions.length / 3;
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(jsonData.indices), gl.STATIC_DRAW);
    indexBuffer.itemSize = 1;
    indexBuffer.numItems = jsonData.indices.length;
}

function drawScene()
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(normalBuffer == null || vertexBuffer == null || indexBuffer == null)
    {
        return;
    }
}

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
    loadJSON();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}
