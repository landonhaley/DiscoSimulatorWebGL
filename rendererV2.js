/*
Copyright (c) 2014 Sumanta Pattanaik
File: rendereV1.js
Associated files:
	rendereV1.html, 
	utilities.js, 
	assimpJsonMeshObjectV1.js,
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

This version supports:
- Simple Mesh Object described by a simple geometric mesh object 
  and a simple material object
	- Geometric mesh object with minimally
		- "position" property whose value is an array of 3D vertices
		- and optionally "normal", "textCoord" and "index" properties.
		- ex:
		{
			position:[
				-1,-1,0,
				1,-1,0,
				1,1,0,
				-1,1,0
			],
			texCoord:[
				0,0,
				1,0,
				1,1,
				0,1
			],
			index:[
				0,1,3,
				1,2,3
			]
		}
	- Material object with any of the following properties:
		- "kd","ks","ambient","emission","shininess" that are floats with 
		   3, 3, 3, 3, 1 Float components respectively
		- and any or all of the following texture maps "diffuseMap","specularMap","normalMap"
		- Note: Of all these properties only "diffuseMap" is used for decal type of
		  texturing. However, later on they will be used for various other purposes.
- Object described in JSON with the following format:
	- 2013 Class model format 
		- Array containing one or more simple material definition (properties as above)
		- Array containing one or more geometric mesh object definitions (properties as above) each with a material index
		- and one or more nodes where each node represents actual renderable object(s)
		  defined by a 4x4 model transformation
		  list of that indices into to the geometric mesh object array 
		- sample file structure
		{
			"materials" : [
			{
				"diffuseTexture":[<texturefileName>,..],
				"diffuseReflectance": [1,0.968627,0.854902,1],
				"ambientReflectance": [0.67451,0.631373,0.517647,1],
				"specularReflectance": [1,0.968627,0.854902,1],
				"shininess": 0,
				"emissionColor": [0,0,0,1]
			},
			],
			"meshes": [
				{
					"vertexPositions": [...],
					"vertexNormals": [...],
					"materialIndex" : 0
				},
				...
			],
			"nodes" : [
				{
					"modelMatrix" : [1,0,0,0,0,0,-1,0,0,1,0,0,-182.964,3330.95,612.632,1],
					"meshIndices" : [0]
				},
				...
			]
		}

	- simple ASSIMP JSON models: (https://github.com/acgessler/assimp2json)
		- See ASSIMP page (http://assimp.sourceforge.net/) for format definition 
		  of their model importer data structure 
		- Very much similar to 2013 Class model format except, but has a 
		  hierarchical structure
		- {
			"rootnode": {
				 "name": "spider.obj",
				 "transformation": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
				 "children": [
					{
						"transformation": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
						"meshes": [0]
					},
					...
			},
			"meshes": [
				{
					"materialindex": 3,
					"vertices": [...],
					"normals": [...],
					"texturecoords": [[...],...],
					"faces": [[0,1,2],...],
				}
				...
			]
			,"materials": [
				{
					"properties": [
						{
							"key": "$tex.file",
							"semantic": 1,
							"index": 0,
							"value": ".\\engineflare1.jpg"
						}
						...
					]
				}
			]
		}
This version may be extended to support 
- camera
- animation
- lighting

Future versions will support more complex AssimpJSONModels.

Sumanta Pattanaik
Sept 6, 2014.
*/
"use strict";
var rendererGlobal = {};

function main(canvasId)
{
	function draw(timeStamp){ // A parameter automatically passed by requestAnimationFrame
		if (rendererGlobal.renderingSetUpComplete())
		{
            handleKeys();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.useProgram(drawCode.program);
            camera.update(timeStamp);
			scene.draw(drawCode.uniformSetter,drawCode.attributeSetter,camera);
			if (animate){
                if (startTime == null) startTime = timeStamp;
				var elapsedTime = timeStamp - startTime;
				startTime = timeStamp;
				scene.updateStateOfAnimatingObjects(elapsedTime);
				animId=requestAnimationFrame(draw);
			}
        }else animId=requestAnimationFrame(draw);
	}
	function toggleAnimation()
	{
		if (animate) cancelAnimationFrame(animId);
		else { startTime = null; animId = requestAnimationFrame(draw);}
		animate = !animate;
	}
	var gl = init(canvasId);
	initRenderer(gl);

	var scene = whatToDraw(gl);
	var camera = new DummyCamera(scene.getBounds());	
	var drawCode = howToDraw(gl);

	var animate = true;
	var startTime;
	var animId=requestAnimationFrame(draw);
	
	var dragging = false;
    var prevX = -1;
    var prevY = -1;
    var rotationAngles = [0.0, 0.0];
    var upArrow = false;
    var downArrow = false;

    function handleKeys()
    {
        if (upArrow)
        {
            rendererGlobal.cameraRadius -= 0.05;
            if (rendererGlobal.cameraRadius < 0.8)
            {
                rendererGlobal.cameraRadius = 0.8;
            }
        }
        else if (downArrow)
        {
            rendererGlobal.cameraRadius += 0.05;
            if (rendererGlobal.cameraRadius > 10.0)
            {
                rendererGlobal.cameraRadius = 10.0;
            }
        }

    }

    function handleKeyDown(event) {
        if ((event.keyCode) == 37)
        {
            upArrow = true;
        }
        else if ((event.keyCode) == 39)
        {
            downArrow = true;
        }

    }

    function handleKeyUp(event) {
        if ((event.keyCode) == 37)
        {
            upArrow = false;
        }
        else if ((event.keyCode) == 39)
        {
            downArrow = false;
        }
    }

	function onMouseDown(event)
	{
	     prevX = event.clientX;
         prevY = event.clientY;
         
         dragging = true;
	}

	function onMouseUp(event)
	{
	     dragging = false;
	}
	
	function onMouseMove(event)
	{
	    if (dragging)
        {
            var deltaX = event.clientX - prevX;
            var deltaY = event.clientY - prevY;
            prevX = event.clientX;
            prevY = event.clientY;
            
            rotationAngles[0] -= deltaY;
            rotationAngles[1] -= deltaX;
            
            scene.mouseRotate(rotationAngles);
        }
	}

	document.getElementById("animToggle").addEventListener("click", toggleAnimation);
	document.getElementById("myCanvas").addEventListener("mousedown", onMouseDown);
	document.getElementById("myCanvas").addEventListener("mousemove", onMouseMove);
    document.getElementById("myCanvas").addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
}

function initRenderer(gl) {
    rendererGlobal.cameraRadius = 1.5;
    rendererGlobal.LARGE = 1e+20;
	rendererGlobal.imagecount = 0;
	rendererGlobal.renderingSetUpComplete = function () {
        return (rendererGlobal.imagecount === 0);
    };
	function createTextureFromData (imgData) {
		var tex = gl.createTexture();
    	gl.bindTexture(gl.TEXTURE_2D, tex);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, imgData);
    	gl.generateMipmap(gl.TEXTURE_2D);
		tex.complete = true;
		return tex;
	}
	rendererGlobal.dummyWhiteTexture = createTextureFromData(new Uint8Array([255, 255, 255, 255]));
	rendererGlobal.dummyGrayTexture = createTextureFromData(new Uint8Array([128, 128, 128, 255]));
	rendererGlobal.dummyBlackTexture = createTextureFromData(new Uint8Array([0, 0, 0, 255]));
	rendererGlobal.dummyNormalMapTexture = createTextureFromData(new Uint8Array([128, 128, 255, 255]));
	
	rendererGlobal.imageDictionary = {};

	rendererGlobal.activeMatrixUniforms = [];
	rendererGlobal.activeMaterialUniforms = [];
	rendererGlobal.activeMaterialMapUniforms = [];
	rendererGlobal.activeLightUniforms = [];
	rendererGlobal.activeMiscUniforms = [];
	rendererGlobal.activeAttributes = [];
}

function DummyCamera(bounds)
{
	var center = bounds.center();
	var diagonal = bounds.diagonal();
	var aspect = 1;
	var rotateAngle = 0.01;
	var fov = 45 * Math.PI / 180;
	var far = rendererGlobal.cameraRadius * 2;

	var vMatrix = mat4.create();
	var pMatrix = mat4.create();

	this.eye = [Math.sin(rotateAngle) * rendererGlobal.cameraRadius, 0.0, Math.cos(rotateAngle) * rendererGlobal.cameraRadius];
	mat4.lookAt(vMatrix, this.eye, [0,0,0], [0, 1.0, 0]);
	mat4.perspective(pMatrix, fov, aspect, 0.1, far * 2);

	this.viewMatrix =  vMatrix;
	this.perspectiveMatrix = pMatrix;

	this.rotate = function(angle)
	{
        this.eye = [Math.sin(angle) * rendererGlobal.cameraRadius, 0.0, Math.cos(angle) * rendererGlobal.cameraRadius];
		mat4.lookAt(this.viewMatrix, this.eye, [0,0,0], [0, 1.0, 0]);
		rotateAngle += angle;
	}

	this.update=function(time)
	{
        this.eye = [Math.sin(rotateAngle) * rendererGlobal.cameraRadius, 0.0, Math.cos(rotateAngle) * rendererGlobal.cameraRadius];
        mat4.lookAt(this.viewMatrix, this.eye, [0,0,0], [0, 1.0, 0]);
    }
}

function DummyLight(I0, Ia, angle, radius, y, strngth, pntDrcIndicator)
{
    var strength = strngth;
    this.rotateAngle = angle;
    
	this.L = [Math.sin(this.rotateAngle) * radius, y, Math.cos(this.rotateAngle) * radius, pntDrcIndicator];
	this.I0 = I0;
	this.Ia = Ia;
	
	this.rotateBy = function(angle)
	{
	    this.rotateAngle -= (strength * 0.01);
	    this.L = [Math.sin(this.rotateAngle) * radius, y, Math.cos(this.rotateAngle) * radius, pntDrcIndicator];
	}
}

function SimpleLight(gl,lightData)
{
	
	this.setUniforms=function(uniformSetter)
	{
		rendererGlobal.activeLightUniforms.forEach(
			function(uName){
				var setter = uniformSetter[uName];
				if (lightData[uName]) setter(lightData[uName]);
				else console.log("ERROR: "+uName+" data Missing");
			}
		);
	}
}

function SimpleMaterial(gl, materialData)
{
	var maps={};
	maps.diffuseMap = (materialData&&materialData.diffuseMap)?			
		createTextureFrom2DImage(gl,materialData.diffuseMap):
		rendererGlobal.dummyGrayTexture;
	maps.specularMap = (materialData&&materialData.specularMap)?			
		createTextureFrom2DImage(gl,materialData.specularMap):
		rendererGlobal.dummyBlackTexture;
	maps.normalMap = (materialData&&materialData.normalMap)?			
		createTextureFrom2DImage(gl,materialData.normalMap):
		rendererGlobal.dummyNormalMapTexture;
	var defaultValues={
		kd : vec3.fromValues(1,1,1),
		ks : vec3.fromValues(0,0,0),
		shininess : 1,
		ambient : vec3.fromValues(0.0,0.0,0.0)
	};
	
	this.setUniforms=function(uniformSetter)
	{
		rendererGlobal.activeMaterialMapUniforms.forEach(
			function(uName){
				var setter = uniformSetter[uName];
				if (maps[uName])
					if (!maps[uName].complete)setter(rendererGlobal.dummyWhiteTexture);
					else setter(maps[uName]);
				else console.log("ERROR: "+uName+" map data Missing");
			}
		);
		rendererGlobal.activeMaterialUniforms.forEach(
			function(uName){
				var setter = uniformSetter[uName];
				if (materialData&&materialData[uName]) setter(materialData[uName]);
				else if (defaultValues[uName]){
					setter(defaultValues[uName]);
					console.log(uName+" data Missing default provided");
				}
				else console.log("ERROR: "+uName+" data Missing. No default available.");
			}
		);
	}
}

function howToDraw(gl)
{
	// Describes how to draw
	
	var program = initShaders(gl,
			document.getElementById("vertex-shader-code").text, 
			document.getElementById("fragment-shader-code").text
	);	
	
	// All possible uniforms
	var uniformMethods = ["uniform1f","uniform2fv","uniform3fv","uniform4fv"];
	var miscUniforms = ["eye"];
    var intUniforms = ["texCoordFlag"];
	var miscUniformComponents = [3];
	var lightUniforms = ["L","I0","Ia"];
	var lightUniformComponents = [4,3,3];
	var materialUniforms = ["kd","ks","ambient","emission","shininess"];
	var materialUniformComponents = [3,3,3,3,1];
	var uniformMatrices = ["modelMatrix","viewMatrix","projectionMatrix","modelViewMatrix","viewProjectionMatrix","modelViewProjectionMatrix","normalMatrix"]; // 4x4 matrices
	var uniformMaps = ["diffuseMap","specularMap","normalMap"];

	var uniformSetter = {};

	var textureUnitNumber=0;
	// Check if you have not accounted for all the Uniforms declared in the shader program
	// and create its setter.
	for (var nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); nUniforms > 0; nUniforms--) 
	(function(activeUniform){
		var uName=activeUniform.name;
		var loc = gl.getUniformLocation(program,uName);			
		var arrayFlag = false;
		if (uName.substr(-3)=="[0]"){
			uName = uName.substr(0,uName.length-3);
			arrayFlag = true;
		}
		if (arrayFlag) console.log(uName+" size = "+activeUniform.size+" is an array");;
		var miscIndex=-1,lightIndex=-1,matIndex=-1,uniformMethod;
		if ((miscIndex=miscUniforms.indexOf(uName))>=0
		  ||(matIndex=materialUniforms.indexOf(uName))>=0
		  ||(lightIndex=lightUniforms.indexOf(uName))>=0){
			if (miscIndex>=0){
				rendererGlobal.activeMiscUniforms.push(uName);
				uniformMethod=uniformMethods[miscUniformComponents[miscIndex]-1];
			}
			else if(matIndex>=0){
				rendererGlobal.activeMaterialUniforms.push(uName);
				uniformMethod=uniformMethods[materialUniformComponents[matIndex]-1];
			}
			else if (lightIndex>=0){
				uniformMethod=uniformMethods[lightUniformComponents[lightIndex]-1];
				rendererGlobal.activeLightUniforms.push(uName);
			}
			uniformSetter[uName] = (arrayFlag)?
			function(v){
				if (!v) console.log("null value");
				//else gl.uniform1fv(loc,v);
				else gl[uniformMethod](loc,v);
			}:
			function(v){
				if (!v) console.log("null value");
				else gl[uniformMethod](loc,v);
			};		
		}
		else if (uniformMaps.indexOf(uName)>=0){
			rendererGlobal.activeMaterialMapUniforms.push(uName);
			uniformSetter[uName] = (function(unit) {
			    return function(v){
					if (!v) console.log("null value");
					else{
						gl.activeTexture(gl.TEXTURE0 + unit);
						gl.bindTexture(gl.TEXTURE_2D, v);
						gl.uniform1i(loc, unit);
					}
				}
			})(textureUnitNumber);
			textureUnitNumber++;			
		}else if (uniformMatrices.indexOf(uName)>=0){
			rendererGlobal.activeMatrixUniforms.push(uName);
			var uniformMethod= (uName=="normalMatrix")?"uniformMatrix3fv":"uniformMatrix4fv";
			uniformSetter[uName] = function(v){
				if (!v) console.log(uName + " null value");
				else gl[uniformMethod](loc,false,v);
			};
		}
        else if (intUniforms.indexOf(uName) >= 0)
        {
            uniformSetter[uName] = function(v)
            {
                rendererGlobal.activeMiscUniforms.push(uName);
                gl.uniform1i(loc, v);
            }
        }
		else console.log("ERROR: Uniform "+uName+" Is declared in Program but nor supported in the renderer.");
	})(gl.getActiveUniform(program, nUniforms-1));

	console.log("Active Uniforms: "+
		((rendererGlobal.activeMiscUniforms.length)?(rendererGlobal.activeMiscUniforms.join()+","):"")+
		((rendererGlobal.activeMaterialUniforms.length)?(rendererGlobal.activeMaterialUniforms.join()+","):"")+
		((rendererGlobal.activeMaterialMapUniforms.length)?(rendererGlobal.activeMaterialMapUniforms.join()+","):"")+
		((rendererGlobal.activeLightUniforms.length)?(rendererGlobal.activeLightUniforms.join()+","):"")+
		rendererGlobal.activeMatrixUniforms.join());
	
	// All possible Attributes
	var attributes = ["position","normal","tangent","bitangent","texCoord"];
	var attributeComponents = [3,3,3,3,2];
	
	var attributeSetter = {};
	// Check if you have not accounted for all the attributes declared in the shader program
	// and create its setter
	for (var nAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); nAttributes>0; nAttributes--)
	(function(activeAttrib) {
		var aName=activeAttrib.name;
		var loc = gl.getAttribLocation(program, aName);
		var index=attributes.indexOf(aName);
		var attribComponents = attributeComponents[index];
		if (index>=0){
			rendererGlobal.activeAttributes.push(aName);
			attributeSetter[aName] = function(v){
				if (!v){gl.disableVertexAttribArray(loc);}
				else {	
					gl.enableVertexAttribArray(loc);
					gl.bindBuffer(gl.ARRAY_BUFFER, v);
					gl.vertexAttribPointer(loc, attribComponents, gl.FLOAT, false, 0, 0);
				}
			};
		}
		else console.log("ERROR: Attribute "+aName+" Is declared in Program but not supported in the renderer.");
	})(gl.getActiveAttrib(program, nAttributes-1));
	console.log("Active Attributes: "+rendererGlobal.activeAttributes.join());
		
	return {
		program: program,
		uniformSetter: uniformSetter,
		attributeSetter: attributeSetter
	};
}

function Scene(gl){
	var objects = [];
	var bounds = new Bounds();
	var modelMatrix = mat4.create();
	this.addObject=function(o)
	{
	    objects.push(o); 
	    bounds.merge(o.bounds);
	    var diagonal = bounds.diagonal();
		var center = bounds.center();
		var m = mat4.create();
		mat4.scale(m,m,[2/diagonal,2/diagonal,-2/diagonal]); // scale and RHS to LHS
		mat4.translate(m,m,[-center[0],-center[1],-center[2]]);
	      
		modelMatrix = m;
	}
	
	this.removeObject=function(){var o=objects.pop();o.deleteBuffers();}
	this.getBounds=function(){ return bounds; }
	var lights = [];
	this.addLight=function(l){lights.push(l); }
	// in Future it will have an addLight method.
		

    this.mouseRotate = function(rotationAngles)
	{
	    var diagonal = bounds.diagonal();
		var center = bounds.center();
		  
	    var m = mat4.create();
		mat4.scale(m,m,[2/diagonal,2/diagonal,-2/diagonal]); // scale and RHS to LHS
		mat4.translate(m,m,[-center[0],-center[1],-center[2]]);
	   	mat4.rotateX(m, m, rotationAngles[0] * Math.PI / 180);
		mat4.rotateY(m, m, rotationAngles[1] * Math.PI / 180);
		
		modelMatrix = m;
	}
	
	function updateLights()
	{
	    lights.forEach(function (l) {l.rotateBy(0.01);})
	}
	
	this.updateStateOfAnimatingObjects=function(timeInMS)
	{
		objects.forEach(function (o){if (o.animate)o.animate(timeInMS);});
	}
	
	this.draw=function(uniformSetter,attributeSetter,camera)
    {
      function setSceneSpecificUniform()
	  {} // no scene specific uniform so far
	  
	  function setCameraSpecificUniform(){
		uniformSetter["viewProjectionMatrix"](mat4.multiply(mat4.create(),camera.perspectiveMatrix,camera.viewMatrix));	
		if (uniformSetter["eye"])uniformSetter["eye"](camera.eye);
	  }
	  function setLightSpecificUniform(){
		// "L", "I0", "Ia"
		var L_array = [], I0_array = [], Ia_array =[0,0,0];
		lights.forEach(function (l){ 
			L_array.push(l.L[0]);L_array.push(l.L[1]);L_array.push(l.L[2]);L_array.push(l.L[3]);
			I0_array.push(l.I0[0]);I0_array.push(l.I0[1]);I0_array.push(l.I0[2]);
			Ia_array[0]=Math.max(Ia_array[0],l.Ia[0]);
			Ia_array[1]=Math.max(Ia_array[1],l.Ia[1]);
			Ia_array[2]=Math.max(Ia_array[2],l.Ia[2]);
		});
		
		if (uniformSetter["L"])uniformSetter["L"](new Float32Array(L_array));
		if (uniformSetter["I0"])uniformSetter["I0"](new Float32Array(I0_array));
		if (uniformSetter["Ia"])uniformSetter["Ia"](new Float32Array(Ia_array));  	
	  }

      setSceneSpecificUniform();
	  setCameraSpecificUniform();
	  updateLights();
	  setLightSpecificUniform();
	  objects.forEach(function (o){ o.draw(uniformSetter, attributeSetter, modelMatrix, camera);});
	}
}

function CreateMenu()
{
	var select = document.createElement('select');
	var modelNames = ["texturedQuad",
			"teapot","house","house of parliament","stPeter","stBasil","shrine","crytek","dabrovic-sponza",
			"collada","teapots","spider","bull","jeep"];
	modelNames.forEach(function(elem,id) {
		var option = document.createElement('option');
		option.setAttribute('value', id);
		option.appendChild(document.createTextNode(elem));
		select.appendChild(option);
	});
    document.getElementById("modelMenu").appendChild(select);
	return select;
}

function whatToDraw(gl)
{
	// Garbage collection to be done in the next version.
    rendererGlobal.normalTex = createTextureFrom2DImage(gl,"normal.png");

	//console.log(modelId);
	var scene = new Scene(gl);
	var modelObject = new AssimpJsonMeshObject(gl, "TRIANGLES", "assimp3DModels\\teapots.dae.assimp.json");

	scene.addObject(modelObject);
	var center = scene.getBounds().center();
	var distance = 0.5;
	
	console.log("Diagonal : "+scene.getBounds().diagonal()+" Distance : "+distance);

	// blue point light source
	scene.addLight(new DummyLight(vec3.fromValues(1.0,1.0,1.0), vec3.fromValues(0.1,0.1,0.1), -0.5, distance, 0.0, 1, 1));
	// green point light source
	scene.addLight(new DummyLight(vec3.fromValues(1.0,1.0,1.0), vec3.fromValues(0.1,0.1,0.1), 0.5, distance, 0.0, -1, 1));
    // grey directional light source
    scene.addLight(new DummyLight(vec3.fromValues(1.0,1.0,1.0), vec3.fromValues(0.1,0.1,0.1), -Math.PI, 10000 * distance, center[1], 0, 0));

	return scene;
}

