/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');
		
		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal'); // Normal attribute for lighting

		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.normbuffer = gl.createBuffer(); // Buffer for vertex normals

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		// Lighting-related uniforms
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
	
		// Default values for lighting
		this.lightPos = [1.0, 1.0, 1.0]; // Initial light position
		this.ambient = 0.2; // Ambient light intensity
		this.lightingEnabled = false; // Lighting disabled by default
	
		// Register event listeners for controlling light position with arrow keys
		window.addEventListener('keydown', (event) => {
			keys[event.key] = true;
		});
	
		window.addEventListener('keyup', (event) => {
			keys[event.key] = false;
		});

		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

		// Default values for specular lighting
		this.specularIntensity = 0.5; // Default specular intensity
		this.shininess = 32.0; // Default shininess factor


		// Start rendering loop to track light position
        this.startLightUpdater();
		
	}

	startLightUpdater() {
        const updateLoop = () => {
            updateLightPos(this); // Update light position based on arrow key inputs
            requestAnimationFrame(updateLoop); // Continuously call in the render loop
        };
        updateLoop(); // Start the loop
    }

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		//this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        /**
         * @Task2 : You should update this function to handle the lighting
         */

        ///////////////////////////////
		// Pass normal data
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	
		// Update lighting uniforms
		//updateLightPos(this); // Update light position based on arrow key inputs
		gl.uniform3fv(this.lightPosLoc, this.lightPos);
		gl.uniform1f(this.ambientLoc, this.ambient);
		gl.uniform1i(this.enableLightingLoc, this.lightingEnabled ? 1 : 0);

		//Draw method for specular
		gl.uniform1f(this.specularIntensityLoc, this.specularIntensity);
		gl.uniform1f(this.shininessLoc, this.shininess);

	
		// Draw triangles
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

    }


	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			//console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			/**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */
			// Configure for NPOT textures
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
        //console.error("Task 2: You should implement the lighting and implement this function ");
        /**
         * @Task2 : You should implement the lighting and implement this function
         */
		this.lightingEnabled = show;
    }

	
	setAmbientLight(ambient) {
        //console.error("Task 2: You should implement the lighting and implement this function ");
        /**
         * @Task2 : You should implement the lighting and implement this function
         */
		this.ambient = ambient;
    }

	//FOR TASK 3
	setSpecularIntensity(intensity) {
		this.specularIntensity = intensity;
	}
	
	setShininess(shininess) {
		this.shininess = shininess;
	}

	setSpecularLight(intensity) {
        
        const specularUniform = gl.getUniformLocation(this.prog, 'specularIntensity');
        gl.useProgram(this.prog);
        gl.uniform1f(specularUniform, intensity);
    }
	
}



function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
        precision mediump float;

		uniform bool showTex;
		uniform bool enableLighting;
		uniform sampler2D tex;
		uniform vec3 color; 
		uniform vec3 lightPos;
		uniform float ambient;
		uniform float specularIntensity; // Specular light intensity
		uniform float shininess; // Shininess factor

		varying vec2 v_texCoord;
		varying vec3 v_normal;

		void main()
		{
			vec3 norm = normalize(v_normal); // Normalize the interpolated normal
			vec3 lightDir = normalize(lightPos); // Direction to the light source
			vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0)); // Assume camera is along z-axis
			vec3 reflectDir = reflect(-lightDir, norm); // Reflect light vector around normal

			// Compute diffuse light intensity
			float diffuse = max(dot(norm, lightDir), 0.0);

			// Compute specular light intensity
			float specular = pow(max(dot(reflectDir, viewDir), 0.0), shininess) * specularIntensity;

			// Combine ambient, diffuse, and specular lighting
			float lighting = ambient + diffuse + specular;

			if (showTex && enableLighting) {
				vec4 texColor = texture2D(tex, v_texCoord);
				gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
			} else if (showTex) {
				gl_FragColor = texture2D(tex, v_texCoord);
			} else {
				gl_FragColor = vec4(color * lighting, 1.0);
			}
		}
`;



// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos(meshDrawer) {
    const translationSpeed = 0.1; // Adjust speed as needed
    if (keys['ArrowUp']) meshDrawer.lightPos[1] += translationSpeed;
    if (keys['ArrowDown']) meshDrawer.lightPos[1] -= translationSpeed;
    if (keys['ArrowRight']) meshDrawer.lightPos[0] += translationSpeed;
    if (keys['ArrowLeft']) meshDrawer.lightPos[0] -= translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
function SetSpecularLight(param) {
    const intensity = param.value / 100; // Normalize intensity to [0, 1]
    meshDrawer.setSpecularLight(intensity);
    DrawScene(); // Redraw the scene with updated specular intensity
}



