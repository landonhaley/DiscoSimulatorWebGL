/*
Copyright (c) 2014 Sumanta Pattanaik
File: simpleMeshObjectV1.js
Associated files:
	rendereV1.html, 
	utilities.js, 
	assimpJsonMeshObjectV1.js,
	ourJsonMeshObjectV1.js,
	rendereV1.js
	
Uses public domain library gl-matrix.js (http://glmatrix.net/)

Permission is hereby granted, to the UCF Computer Graphics class students
to use this software for their class assignment. They can use, copy, modify, 
merge, as long as it is for the assignment submission purposes.

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

This version along with its associated files
supports Texturing of Triangular Mesh(es) using WebGL.

Sumanta Pattanaik
Sept 6, 2014.
*/
function SimpleMeshObject(gl, drawMode, meshData, material)
{
	"use strict";
	var buffers = createBuffers(gl,meshData);
	var nVertices = (meshData.index)?meshData.index.length:(meshData.position.length/3);
	material =  (material)?material:new SimpleMaterial(gl);
	var modelMatrix = mat4.create();
	this.bounds = getBounds();
	//console.log("vertices: "+nVertices);
	if (!drawMode) drawMode = "TRIANGLES";
	this.setModelMatrix = function (m) {
		mat4.copy(modelMatrix,m);
		this.bounds = getBounds();
	};
	this.draw = function (uniformSetter, attributeSetter, sceneModelMatrix, camera){
		uniformSetter["modelMatrix"](sceneModelMatrix);
		if (uniformSetter["normalMatrix"])
			uniformSetter["normalMatrix"](mat3.normalFromMat4(mat3.create(),sceneModelMatrix));
		material.setUniforms(uniformSetter);
		bufferDraw(gl,drawMode,attributeSetter,nVertices,buffers);
	}
	this.deleteBuffers=function(){deleteBuffers(gl,buffers);}
	function getBounds() {
		var xmin = rendererGlobal.LARGE, xmax = -rendererGlobal.LARGE, 
		    ymin = rendererGlobal.LARGE, ymax = -rendererGlobal.LARGE, 
			zmin = rendererGlobal.LARGE, zmax = -rendererGlobal.LARGE;
		var i;
		for (i = 0; i<meshData.position.length; i+=3) {
			var vertex = vec3.transformMat4(vec3.create(), [meshData.position[i], meshData.position[i+1], meshData.position[i+2]], modelMatrix);
			if (vertex[0] < xmin) xmin = vertex[0];
			if (vertex[0] > xmax) xmax = vertex[0]; 
			if (vertex[1] < ymin) ymin = vertex[1];
			if (vertex[1] > ymax) ymax = vertex[1];
			if (vertex[2] < zmin) zmin = vertex[2];
			if (vertex[2] > zmax) zmax = vertex[2]; 
		}
		return new Bounds([xmin, ymin, zmin], [xmax, ymax, zmax]);
	}
}

