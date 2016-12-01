/*
Copyright (c) 2014 Sumanta Pattanaik
File: assimpJsonMeshObjectV1.js
Associated files:
	rendereV1.html, 
	utilities.js, 
	rendereV1.js,
	ourJsonMeshObjectV1.js
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

function AssimpJsonMeshObject(gl, drawMode, filePath) {
    "use strict";
	function extractCurrentDirectory() {
		var parts = filePath.split('\\');
		parts.pop();
		return ((parts.length < 1) ? '.' : parts.join('\\')) + '\\';
	}
	var texturePath = extractCurrentDirectory();
	var model = parseJSON(filePath);
	this.bounds = getBounds();
	//console.log("[" + this.bounds.min.join() + "][" + this.bounds.max.join() + "]");
	
	var materials = [];
	model.materials.forEach(
	  function (m) {
	   var properties = m.properties;
	   var materialData = {};
	   //for (var prop in properties){
	   properties.forEach(function (prop) {
			if(prop.key === '$tex.file') {
				var mapName;
				switch (prop.semantic) {
				case 1: mapName = "diffuseMap"; break;
				case 2: mapName = "specularMap"; break;
				case 5: mapName = "bumpMap"; break;
				case 6: mapName = "normalMap"; break;
				}
				if (mapName) materialData[mapName] = (texturePath + prop.value).replace(/\\/g, '/');
				console.log("Material : " + materialData[mapName] + " " + mapName);
			}
			else if (prop.key === '$clr.diffuse') {
				materialData.kd = [prop.value[0], prop.value[1], prop.value[2]];
			}
			else if (prop.key === '$clr.specular') {
				materialData.ks = [prop.value[0], prop.value[1], prop.value[2]];
			}
			else if (prop.key === '$clr.ambient') {
				materialData.ambient = [prop.value[0], prop.value[1], prop.value[2]];
			}
			else if (prop.key === '$clr.emissive') {
				materialData.emission = [prop.value[0],prop.value[1],prop.value[2]];
			}
			else if (prop.key === '$mat.shininess') {
				materialData.shininess = prop.value;
			}
	   });
	   materials.push(
		new SimpleMaterial(gl, materialData)
	   );
	  }
	);
	var meshes = [];
	model.meshes.forEach(
	  function (m,i){
		var indices;
		if (m.faces){
			indices = [];
			m.faces.forEach(function (f) {
				indices.push(f[0]);
				indices.push(f[1]);
				indices.push(f[2]);//console.log(indices);
			});
			//console.log(indices.length);
		}
		meshes[i] = {
		  buffers:
			createBuffers(gl,
				{
					position : m.vertices,
					normal : m.normals,
					tangent : m.tangents,
					bitangent : m.bitangents,
					texCoord : (m.texturecoords)?m.texturecoords[0]:undefined,
					index : indices
				}
			),
			nVertices : (indices) ? indices.length : (m.vertices.length/3),
			material : materials[m.materialindex]	  
	    };
		//console.log("vertices:"+m.vertices.length/3);
		//if (m.normals)console.log("normals:"+m.normals.length/3);
		//if (m.texturecoords)console.log("texCoordinates:"+m.texturecoords[0].length/2);
	  }
	);
	
	if (!drawMode) drawMode = "TRIANGLES";
	
	this.draw = function (uniformSetter, attributeSetter, sceneModelMatrix, camera) {
		function drawNode(node, m)
		{
		    var modelMatrix = mat4.transpose(mat4.create(), node.transformation);
			modelMatrix = mat4.multiply(mat4.create(), m, modelMatrix);
			var mm = mat4.mul(mat4.create(), sceneModelMatrix, modelMatrix);
			var i,id;
			if (node.meshes) {
				uniformSetter["modelMatrix"](mm);	
				if (uniformSetter["normalMatrix"])
				{
				    var mMatrix = mat4.mul(mat4.create(), sceneModelMatrix, modelMatrix);
					uniformSetter["normalMatrix"](mat3.normalFromMat4(mat3.create(),mMatrix));
				}				
				for (id = 0;  id < node.meshes.length; id++) {
					var index = node.meshes[id];
					meshes[index].material.setUniforms(uniformSetter);
					bufferDraw(gl, drawMode, attributeSetter, meshes[index].nVertices, meshes[index].buffers);
				}
			}
			if (node.children) {
				for (i = 0; i < node.children.length; i++)
                {
                    var texCoordFlag = 1;

                    if (i == 2)
                        texCoordFlag = 0;

                    uniformSetter["texCoordFlag"](texCoordFlag);

					drawNode(node.children[i], modelMatrix);
				}
			}
		}
		drawNode(model.rootnode,mat4.create());
	};
	this.deleteBuffers=function(){
		meshes.forEach (function (mesh) {deleteBuffers(gl,mesh.buffers);});
	}
	function getBounds() // Computes Model bounding box
	{		
		var xmin = rendererGlobal.LARGE, xmax = -rendererGlobal.LARGE, 
		    ymin = rendererGlobal.LARGE, ymax = -rendererGlobal.LARGE, 
			zmin = rendererGlobal.LARGE, zmax = -rendererGlobal.LARGE;
		function nodeBound(node, m)
		{
			//console.log("original matrix:"+mat4.str(node.transformation));
			var modelMatrix = mat4.transpose(mat4.create(), node.transformation);
			//console.log("Transpose matrix:"+mat4.str(modelMatrix));
			modelMatrix = mat4.multiply(mat4.create(), m, modelMatrix);
			//console.log("Transformed matrix:"+mat4.str(modelMatrix));
			var i, id;
			if (node.meshes) {
				//console.log(node.name);
				//console.log(mat4.str(modelMatrix));
				for (id = 0;  id < node.meshes.length; id++) {
					var index = node.meshes[id];
					//console.log(index + " " + node.name);
					var mesh = model.meshes[index];
					for (i = 0; i<mesh.vertices.length; i+=3){
						var vertex = vec3.transformMat4(vec3.create(), [mesh.vertices[i], mesh.vertices[i+1], mesh.vertices[i+2]], modelMatrix);
						if (vertex[0] < xmin) xmin = vertex[0];
						if (vertex[0] > xmax) xmax = vertex[0]; 
						if (vertex[1] < ymin) ymin = vertex[1];
						if (vertex[1] > ymax) ymax = vertex[1];
						if (vertex[2] < zmin) zmin = vertex[2];
						if (vertex[2] > zmax) zmax = vertex[2]; 
					}
				}
			}
			if (node.children){
				for (i = 0; i < node.children.length; i++) {
						nodeBound(node.children[i], modelMatrix);
				}
			}
		}
		nodeBound(model.rootnode, mat4.create());
		return new Bounds([xmin, ymin, zmin],[xmax, ymax, zmax]);
	}
}

