import * as THREE from '/build/three.module.js';

import { GUI } from '../controls/dat.gui.module.js';
import { Sky } from '../controls/Sky.js';
import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

import { OrbitControls } from '../controls/OrbitControls.js';
import { TransformControls } from '../controls/TransformControls.js';

import { OperationManager } from './OperationManager.js';

// import { DetectRectangleTest } from '../tests/DetectRectangle.js';

export class SceneManager {

	constructor() {

		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer();

		this.containerDom = document.getElementById("mainView");

		this.addHelper();       
		
		this.addCamera();
		this.addSky();
		this.addLight();

		this.addOrbit();
		this.addControl();

		this.renderer.domElement.addEventListener('keydown', (e) => { this.onKeydownEvent(e) }, false);
		this.onWindowResizeEvent = this.onWindowResize.bind(this);
		this.addOnWindowResize();
		
		this.addDomElement();

		this.addGUI();

		this.operationManager = new OperationManager(this);

		return this;

	}

	render() {

		this.renderer.setRenderTarget( null );
		this.renderer.render( this.scene, this.currentCamera );

		if (this.operationManager?.controlPanel?.sceneTab) {

			this.operationManager.controlPanel.sceneTab.content.displayStatus();

		}

	}

	addHelper() {

		this.grid = new THREE.Group();

		const grid1 = new THREE.GridHelper( 1000, 20, 0x888888 );
		grid1.material.color.setHex( 0x888888 );
		grid1.material.vertexColors = false;
		// this.grid.add( grid1 );

		const grid2 = new THREE.GridHelper( 1000, 5, 0xCCCCCC );
		grid2.material.color.setHex( 0x888888 );
		grid2.material.depthFunc = THREE.AlwaysDepth;
		grid2.material.vertexColors = false;
		this.grid.add( grid2 );

		this.scene.add(this.grid)


		this.axesHelper = new THREE.AxesHelper( 150 );

		this.scene.add( this.axesHelper );
		
	}

	addCamera() {

		this.aspect = this.containerDom.offsetWidth / this.containerDom.offsetHeight;

		this.cameraPersp = new THREE.PerspectiveCamera( 30, this.aspect, 1, 5000 );
		this.cameraOrtho = new THREE.OrthographicCamera( - 600 * this.aspect, 600 * this.aspect, 600, - 600, 0.01, 30000 );
		
		this.currentCamera = this.cameraPersp;
		this.currentCamera.position.set( 250, 200, 600 );

	}

	addSky() {

		this.sky = new Sky();
		this.sky.scale.setScalar( 450000 );
		this.scene.add(this.sky);

		this.sun = new THREE.Vector3();

		this.skyEffectController = {

			turbidity: 10,
			rayleigh: 3,
			mieCoefficient: 0.035,
			mieDirectionalG: 0.9,
			inclination: 0.35, // elevation / inclination
			azimuth: 0.38, // Facing front,
			exposure: this.renderer.toneMappingExposure

		};

	}

	addLight(light = "directional") {

		switch (light) {

			case "hemisphere":
				
				const hemisphereLight = new THREE.HemisphereLight( 0xeeeeff,0x999999,1.0);
				hemisphereLight.position.set( 2000, 2000, 2000);
				this.scene.add( hemisphereLight );

				const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight);
				this.scene.add( hemisphereLightHelper);

				break;

			case "ambient":

				this.ambientLight = new THREE.AmbientLight(0xc0c0c0, 1.0);
				this.scene.add(this.ambientLight);

				break;

			case "directional":

				this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
				this.directionalLight.position.set(200, 200, 200);
				this.directionalLight.target.position.set(-5, 100, 0);

				this.directionalLight.castShadow = true;
				this.directionalLight.shadow.camera.right = 200;
				this.directionalLight.shadow.camera.left = -200;
				this.directionalLight.shadow.camera.top = -200;
				this.directionalLight.shadow.camera.bottom = 300;
				this.directionalLight.shadow.camera.far = 500;

				this.scene.add(this.directionalLight);
				this.scene.add(this.directionalLight.target);

				// var directionalLightShadowHelper = new THREE.CameraHelper(this.directionalLight.shadow.camera);
				// this.scene.add( directionalLightShadowHelper);
				// var directionalLightHelper = new THREE.DirectionalLightHelper( this.directionalLight);
				// this.scene.add( directionalLightHelper);

				break;
		
			default:
				break;

		}

	}

	addDomElement() {

		this.canvasController = {
			opacity: 1.0,
			width: this.containerDom.offsetWidth,
			height: this.containerDom.offsetHeight
		}

		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize(this.canvasController.width, this.canvasController.height);
		
		this.containerDom.appendChild( this.renderer.domElement );
		this.renderer.domElement.id = "mainCanvas"

		this.renderTarget = new THREE.WebGLRenderTarget(this.canvasController.width, this.canvasController.height);

	}

	addOrbit() {

		this.orbit = new OrbitControls( this.currentCamera, this.renderer.domElement );
		this.orbit.target.set(0,0,0)

	}

	addControl() {

		this.control = new TransformControls( this.currentCamera, this.renderer.domElement );

		this.control.addEventListener( 'dragging-changed', function ( event ) {
			this.orbit.enabled = ! event.value;
		} );

	}

	addGUI() {

		this.gui = new GUI( { autoPlace: false} );
		this.gui.domElement.id = "SceneGUI"
		$("#SceneGUIWrapper").append($(this.gui.domElement))

		this.addGUICamera();
		this.addGUISky();
		
		if (this.directionalLight !== undefined) this.addGUIDirectionalLight();
		
		this.addGUICanvas();

		this.changeGUI();
		
	}

	addGUICamera() {

		this.cameraFolder = this.gui.addFolder('Camera');

		this.cameraFolder.add(this.cameraPersp, "fov", 0, 90, 1).listen().onChange( () => { this.updateScene() } );
		this.cameraFolder.add(this.cameraPersp.position, "x", -5000, 5000, 1).name("position X").listen().onChange( () => { this.changeGUI() } );
		this.cameraFolder.add(this.cameraPersp.position, "y", -2000, 2000, 1).name("position Y").listen().onChange( () => { this.changeGUI() } );
		this.cameraFolder.add(this.cameraPersp.position, "z", -2000, 2000, 1).name("position Z").listen().onChange( () => { this.changeGUI() } );
		this.cameraFolder.add(this.cameraPersp.rotation, "x", -5, 5, 0.01).name("rotate X").listen().onChange( () => { this.changeGUI() } );
		this.cameraFolder.add(this.cameraPersp.rotation, "y", -5, 5, 0.01).name("rotate Y").listen().onChange( () => { this.changeGUI() } );
		this.cameraFolder.add(this.cameraPersp.rotation, "z", -5, 5, 0.01).name("rotate Z").listen().onChange( () => { this.changeGUI() } );
	
		this.cameraFolder.open();

	}

	addGUISky() {

		this.skyFolder = this.gui.addFolder('Sky');

		this.skyFolder.add( this.skyEffectController, "turbidity", 0.0, 20.0, 0.1 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "rayleigh", 0.0, 4, 0.001 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "mieCoefficient", 0.0, 0.1, 0.001 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "mieDirectionalG", 0.0, 1, 0.001 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "inclination", 0, 1, 0.0001 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "azimuth", 0, 1, 0.0001 ).listen().onChange( () => { this.changeGUI() } );
		this.skyFolder.add( this.skyEffectController, "exposure", 0, 1, 0.0001 ).listen().onChange( () => { this.changeGUI() } );

		this.skyFolder.open();

	}

	addGUIDirectionalLight() {

		this.directionalLightFolder = this.gui.addFolder('DirectionalLight');
		
		this.directionalLightFolder.add(this.directionalLight, 'intensity', 0, 2, 0.01).listen().onChange( () => { this.changeGUI() } );
		this.directionalLightFolder.add(this.directionalLight.target.position, 'x', -2000, 2000).listen().onChange( () => { this.changeGUI() } );
		this.directionalLightFolder.add(this.directionalLight.target.position, 'y', 0, 2000).listen().onChange( () => { this.changeGUI() } );
		this.directionalLightFolder.add(this.directionalLight.target.position, 'z', -2000, 2000).listen().onChange( () => { this.changeGUI() } );

		// this.directionalLightFolder.open();

	}

	addGUICanvas() {

		this.canvasFolder = this.gui.addFolder('Canvas');


		this.canvasFolder.add(this.canvasController, 'opacity', 0, 1.0).listen().onChange( (e) => { this.changeGUI() });
		
		this.canvasFolder.add(this.canvasController, 'width', 0, 5000, 1).listen().onChange( (e) => { 
			
			this.removeOnWindowResize();
			this.changeGUI();

		});

		this.canvasFolder.add(this.canvasController, 'height', 0, 5000, 1).listen().onChange( (e) => { 
			
			this.removeOnWindowResize();
			this.changeGUI();

		});

		this.canvasFolder.open();

	}

	updateScene() {

		const is2DfixEnabled = this.operationManager?.controlPanel?.planeControlTab?.content?.is2DfixEnabled;
		const isPlaneEstimation = this.operationManager?.controlPanel?.planeControlTab?.content?.planeEstimation;

		if (is2DfixEnabled) {

			const count = this.operationManager.controlPanel.planeControlTab.content.clickCount2DFix

			if (isPlaneEstimation && count == 4) {

				console.log("true")
					
			} else {

				console.log("false")
				this.operationManager.modelingManager.createAllLineFrom2D(count);

			}
				

		}

		if (isPlaneEstimation) {

			console.log("planeEstimation")
			this.operationManager.controlPanel.planeControlTab.content.planeEstimation.startSolvePnP();

		}

		this.changeGUI();
		
	}

	changeGUI() {

		this.changeGUICamera();
		this.changeGUISky();

		$(this.renderer.domElement).css('opacity', this.canvasController.opacity);

		this.changeRendererSize(this.canvasController.width, this.canvasController.height);

	}

	changeGUICamera() {

		const position = this.currentCamera.position.clone();

		this.currentCamera.position.copy( position );

		this.control.camera = this.currentCamera;

		this.cameraPersp.updateProjectionMatrix()

        if (this.orbit.enabled) {

            this.orbit.object = this.currentCamera;
            this.currentCamera.lookAt( this.orbit.target.x, this.orbit.target.y, this.orbit.target.z );
        
			this.orbit.update();
			
		}


	}
	
	changeGUISky() {

		const uniforms = this.sky.material.uniforms;
		uniforms[ "turbidity" ].value = this.skyEffectController.turbidity;
		uniforms[ "rayleigh" ].value = this.skyEffectController.rayleigh;
		uniforms[ "mieCoefficient" ].value = this.skyEffectController.mieCoefficient;
		uniforms[ "mieDirectionalG" ].value = this.skyEffectController.mieDirectionalG;

		const theta = Math.PI * ( this.skyEffectController.inclination - 0.5 );
		const phi = 2 * Math.PI * ( this.skyEffectController.azimuth - 0.5 );

		this.sun.x = Math.cos( phi );
		this.sun.y = Math.sin( phi ) * Math.sin( theta );
		this.sun.z = Math.sin( phi ) * Math.cos( theta );

		uniforms[ "sunPosition" ].value.copy( this.sun );

		this.renderer.toneMappingExposure = this.skyEffectController.exposure;
	
	}

	addSphere( x = 0, y = 0, z = 0 ) {

		const sphereRadius = 3;
		const sphereWidthDivisions = 32;
		const sphereHeightDivisions = 16;

		const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
		const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
		
		const mesh = new THREE.Mesh(sphereGeo, sphereMat);
		mesh.position.set(x, y, z);
		
		this.scene.add(mesh);
	
	}

	onKeydownEvent(event) {
		
		switch ( event.keyCode ) {
			
			case 67: // C

				const position = this.currentCamera.position.clone();

				this.currentCamera = this.currentCamera.isPerspectiveCamera ? this.cameraOrtho : this.cameraPersp;
				this.currentCamera.position.copy( position );

				this.orbit.object = this.currentCamera;
				this.control.camera = this.currentCamera;

				this.currentCamera.lookAt( this.orbit.target.x, this.orbit.target.y, this.orbit.target.z );
				this.onWindowResize();

				break;

		}

	}

	changeRendererSize(width, height) {

		this.canvasController.width = width;
		this.canvasController.height = height;

		this.aspect = width / height;
	
		this.cameraPersp.aspect = this.aspect;
		this.cameraPersp.updateProjectionMatrix();
	
		this.cameraOrtho.left = this.cameraOrtho.bottom * this.aspect;
		this.cameraOrtho.right = this.cameraOrtho.top * this.aspect;
		this.cameraOrtho.updateProjectionMatrix();
	
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize( width, height );
        this.renderTarget.setSize( width, height );
	
		this.render();

	}

	addOnWindowResize() {
		window.addEventListener( 'resize', this.onWindowResizeEvent, false );
	}

	removeOnWindowResize() {
		window.removeEventListener( 'resize', this.onWindowResizeEvent, false );
	}

	onWindowResize(event, width, height) {
	
		if ( !width ) width = this.containerDom.offsetWidth;
		if ( !height ) height = this.containerDom.offsetHeight;

		this.changeRendererSize( width, height );
	  
	}

}