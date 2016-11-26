
//Constructor
var OBJLoader = function(fileName) {
    this.fileName = fileName;
    this.mtl = new Array(0);
    this.objects = new Array(0);
    this.vertex = new Array(0);
    this.normal = new Array(0)
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
            }
        }
    }
    fileText.send(null);
}

function parse(fileText)
{
    //Store the vertex coordinates, color, normals, and indices of the Models
    while(false)
    {
        switch(command)
        {
            //TODO add a mtllib case logic

            //skip comments
            case '#':
                continue;
            case 'mtllib':
                continue;
            case 'o':
            case 'g':
            case 'v':
            case 'vn':
            case 'usemtl':
            case 's':
            case 'f':

        }
    }
}
/*
'use strict'

    //This script reads obj files and loads the model into arrays

var OBJLoader = function() {

}

OBJLoader.prototype.readTextFile = function (filePath) {
    var fileText = new XMLHttpRequest();
    fileText.open("GET", "filePath", true);
}

//Reads in obj file contents, sets vertex, normals and faces
OBJLoader.prototype.parseOBJ = function (fileContent) {

}

//Reads in MTL file contents, set materials, color, texture
OBJLoader.prototype.parseMTL = function (fileContent) {

}

//Creates empty 32 bit buffer for WebGL
OBJLoader.prototype.createBuffer = function () {

}

//Init WebGL buffers
OBJLoader.prototype.initBuffers = function () {

}

//Reads valid obj file from a http request
OBJLoader.prototype.readOBJFile = function (filePath) {

}

//Reads valid mtl file from a http request
OBJLoader.prototype.readMTLFile = function (filePath) {

}

//Performs logic on obj file based on validity of file
OBJLoader.prototype.onReadOBJFile = function () {

}

//Peforms logic on mtl file based on validity of file
OBJLoader.prototype.onReadMTLFile = function () {

}
*/
