/*
Copyright (c) 2014 Sumanta Pattanaik
File: ourJsonMeshObjectV1.js
Associated files:
	rendereV1.html, 
	utilities.js, 
	assimpJsonMeshObjectV1.js,
	rendereV1.js,
	simpleMeshObjectV1.js
	
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

function OurJsonMeshObject(gl, drawMode, modelDirectory)
{
    "use strict";
	var jsonDirectory = modelDirectory + "\\models\\";
	var jsonFileName = jsonDirectory + "model.json";
	var model = parseJSON(jsonFileName);
	this.bounds = getBounds();
	var materials = [];
	model.materials.forEach(
	  function (m) {
	   materials.push(
		new SimpleMaterial(gl,
		 {
			kd        : m.diffuseReflectance.splice(0, 3),
			ks        : m.specularReflectance.splice(0, 3),
			ambient   : m.ambientReflectance.splice(0, 3),
			emission  : m.emissionColor.splice(0, 3),
			shininess : m.shininess,
			diffuseMap: ((m.diffuseTexture && m.diffuseTexture[0]) ? (jsonDirectory + m.diffuseTexture[0]) : undefined)
		 }
		)
	   );
	  }
	);
	var meshes = [];
	model.meshes.forEach(
	  function (m, i) {
		meshes[i] = {
		  buffers   :
			createBuffers(gl,
			{
				position : m.vertexPositions,
				normal   : m.vertexNormals,
				tangent  : m.vertexTangents,
				bitangent: m.vertexBiTangents,
				texCoord : ((m.vertexTexCoordinates && m.vertexTexCoordinates[0]) ? m.vertexTexCoordinates[0] : undefined),
				index    : m.indices
			}
			),
		  nVertices : (m.indices) ? m.indices.length : (m.vertexPositions.length / 3),
		  material  : materials[m.materialIndex]
	    };
		//console.log(meshes[i]);
	  }
	);
	
	if (!drawMode) drawMode = "TRIANGLES";
	
	this.draw = function (uniformSetter, attributeSetter, sceneModelMatrix, camera) {
		model.nodes.forEach (function (node) {
		    //console.log("modelMatrix matrix:"+mat4.str(camera.modelMatrix));
		    var mm = mat4.mul(mat4.create(), sceneModelMatrix, node.modelMatrix);
			uniformSetter["modelMatrix"](mm);			
			if (uniformSetter["normalMatrix"])
			{
			    var mMatrix = mat4.mul(mat4.create(), sceneModelMatrix, node.modelMatrix);
			    uniformSetter["normalMatrix"](mat3.normalFromMat4(mat3.create(),mMatrix));	
			}
			node.meshIndices.forEach (function (index) {
				meshes[index].material.setUniforms(uniformSetter);
				bufferDraw(gl, drawMode, attributeSetter, meshes[index].nVertices, meshes[index].buffers);
			});				
		});
	};
	
	this.deleteBuffers=function(){
		meshes.forEach (function (mesh) {deleteBuffers(gl,mesh.buffers);});
	}

	function getBounds() // Computes Model bounding box
	{		
		var xmin=rendererGlobal.LARGE, xmax=-rendererGlobal.LARGE, 
		    ymin=rendererGlobal.LARGE, ymax=-rendererGlobal.LARGE, 
			zmin=rendererGlobal.LARGE, zmax=-rendererGlobal.LARGE;
		var nNodes = (model.nodes) ? model.nodes.length : 1;
		for (var k=0; k<nNodes; k++){
			var m = mat4.create();
			if (model.nodes)mat4.copy(m,model.nodes[k].modelMatrix);
			var nMeshes = (model.nodes) ? model.nodes[k].meshIndices.length : model.meshes.length;
			for (var n = 0; n < nMeshes; n++){
				var index = (model.nodes) ? model.nodes[k].meshIndices[n] : n;
				var mesh = model.meshes[index];
				for (var i = 0; i<mesh.vertexPositions.length; i+=3) {
					var vertex = vec3.transformMat4(vec3.create(), [mesh.vertexPositions[i], mesh.vertexPositions[i+1], mesh.vertexPositions[i+2]], m);
					if (vertex[0] < xmin) xmin = vertex[0];
					if (vertex[0] > xmax) xmax = vertex[0];
					if (vertex[1] < ymin) ymin = vertex[1];
					if (vertex[1] > ymax) ymax = vertex[1];
					if (vertex[2] < zmin) zmin = vertex[2];
					if (vertex[2] > zmax) zmax = vertex[2];
				}
			}
		}
		return new Bounds([xmin, ymin, zmin], [xmax, ymax, zmax]);
	}
}
