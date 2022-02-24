import * as THREE from '/build/three.module.js';

import { GUI } from './controls/dat.gui.module.js';
import { Sky } from './controls/Sky.js';
import { OBJExporter, OBJExporterWithMtl } from './controls/OBJExporter.js';

import { OrbitControls } from './controls/OrbitControls.js';
import { TransformControls } from './controls/TransformControls.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();

        this.init();

        this.renderer.domElement.addEventListener('keydown', (e) => { this.onKeydownEvent(e) }, false);
        window.addEventListener( 'resize', (e) => { this.onWindowResize() }, false );
    }

    init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // this.scene.add( new THREE.AxesHelper(300) );        
        this.scene.add( new THREE.GridHelper( 1000, 10, 0x888888, 0x444444 ) );
        
        this.addCamera();
        this.addSky();
        this.addLight();
        
        this.adjustSize();

        this.addOrbit();
        this.addControl();

        const oc = new THREE.OctahedronGeometry( 50);
        const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
        const mesh = new THREE.Mesh(oc, sphereMat);
        // this.scene.add(mesh);

        this.addGUI();
    }

    render() {
        this.renderer.render( this.scene, this.currentCamera );
    }

    addCamera() {
        this.aspect = 800 / 600;
        // this.aspect = window.innerWidth / window.innerHeight;

        this.cameraPersp = new THREE.PerspectiveCamera( 30, this.aspect, 0.01, 30000 );
        this.cameraOrtho = new THREE.OrthographicCamera( - 600 * this.aspect, 600 * this.aspect, 600, - 600, 0.01, 30000 );
        
        this.currentCamera = this.cameraPersp;
        // this.currentCamera.position.set( 136, 300, 226 );
        this.currentCamera.position.set( 335, 240, 335 );
        // this.currentCamera.position.set(8.087405011139255, 5.850093081453902, 4.798730430005799)
        // this.currentCamera.matrix.set(-0.8375326424136753, 0.3863541593483669, -0.3863541593483669, 8.087405011139255,
        //     -0.3863541593483669, 0.08123367879316212, 0.9187663212068374, 5.850093081453902,
        //     0.3863541593483669, 0.9187663212068374, 0.08123367879316212, 4.798730430005799,
        //     0,0,0,1)
    }

    addSky() {
        this.sky = new Sky();
        this.sky.scale.setScalar( 450000 );
        this.scene.add(this.sky);
    }

    addLight() {
        // const hemisphereLight = new THREE.HemisphereLight( 0xeeeeff,0x999999,1.0);
        // hemisphereLight.position.set( 2000, 2000, 2000);
        // this.scene.add( hemisphereLight );

        // const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight);
        // this.scene.add( hemisphereLightHelper);
        this.ambientLight = new THREE.AmbientLight(0xc0c0c0, 1.0);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(200, 200, 200);
        this.directionalLight.target.position.set(-5, 100, 0);

        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.camera.right = 200;
        this.directionalLight.shadow.camera.left = -200;
        this.directionalLight.shadow.camera.top = -200;
        this.directionalLight.shadow.camera.bottom = 300;
        this.directionalLight.shadow.camera.far = 500;
        // this.directionalLight.shadow.mapSize.width = 1024;
        // this.directionalLight.shadow.mapSize.height = 1024;

        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target);

        // var directionalLightShadowHelper = new THREE.CameraHelper(this.directionalLight.shadow.camera);
        // this.scene.add( directionalLightShadowHelper);
        // var directionalLightHelper = new THREE.DirectionalLightHelper( this.directionalLight);
        // this.scene.add( directionalLightHelper);
    }

    adjustSize() {
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( 800, 600 );
        // this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        $('#background-Image').on( 'change', (e) => { this.changeBackground(e) } );
    }

    changeBackground(e) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $("body").css('background-image', 'url("' + e.target.result + '")');
        }
        reader.readAsDataURL(e.target.files[0]);
        $(this.renderer.domElement).css('opacity', '0.7')
    }

    addOrbit() {
        this.orbit = new OrbitControls( this.currentCamera, this.renderer.domElement );
        this.orbit.target.set(0, 75, 0)
        this.orbit.update();
        this.orbit.addEventListener( 'change', () => { this.render() } );
    }

    addControl() {
        this.control = new TransformControls( this.currentCamera, this.renderer.domElement );
        this.control.addEventListener( 'change', () => { this.render() } );

        this.control.addEventListener( 'dragging-changed', function ( event ) {
            this.orbit.enabled = ! event.value;
        } );
    }

    addGUI() {
        this.gui = new GUI();

        this.addGUICamera();
        this.addGUISky();
        this.addGUILight();

        this.changeGUI();
    }

    addGUICamera() {
        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.add(this.cameraPersp, "fov", 0, 90, 1).onChange( () => { this.changeGUI() } );
    }

    addGUISky() {
        this.sun = new THREE.Vector3();

        this.effectController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.035,
            mieDirectionalG: 0.9,
            inclination: 0.35, // elevation / inclination
            azimuth: 0.38, // Facing front,
            exposure: this.renderer.toneMappingExposure
        };

        const skyFolder = this.gui.addFolder('Sky');

        skyFolder.add( this.effectController, "turbidity", 0.0, 20.0, 0.1 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "rayleigh", 0.0, 4, 0.001 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "mieDirectionalG", 0.0, 1, 0.001 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "inclination", 0, 1, 0.0001 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "azimuth", 0, 1, 0.0001 ).onChange( () => { this.changeGUI() } );
        skyFolder.add( this.effectController, "exposure", 0, 1, 0.0001 ).onChange( () => { this.changeGUI() } );

    }

    addGUILight() {
        const directionalLightFolder = this.gui.addFolder('DirectionalLight');
        directionalLightFolder.add(this.directionalLight, 'intensity', 0, 2, 0.01).onChange( () => { this.changeGUI() } );
        directionalLightFolder.add(this.directionalLight.target.position, 'x', -2000, 2000).onChange( () => { this.changeGUI() } );
        directionalLightFolder.add(this.directionalLight.target.position, 'z', -2000, 2000).onChange( () => { this.changeGUI() } );
        directionalLightFolder.add(this.directionalLight.target.position, 'y', 0, 2000).onChange( () => { this.changeGUI() } );

    }

    changeGUI() {
        this.changeGUICamera();
        this.changeGUISky();
        this.changeGUILight();
        this.renderer.render( this.scene, this.currentCamera );
    }

    changeGUICamera() {
        const position = this.currentCamera.position.clone();

        this.currentCamera.position.copy( position );

        this.orbit.object = this.currentCamera;
        this.control.camera = this.currentCamera;

        this.currentCamera.lookAt( this.orbit.target.x, this.orbit.target.y, this.orbit.target.z );
        this.onWindowResize();
    }
    
    changeGUISky() {

        const uniforms = this.sky.material.uniforms;
        uniforms[ "turbidity" ].value = this.effectController.turbidity;
        uniforms[ "rayleigh" ].value = this.effectController.rayleigh;
        uniforms[ "mieCoefficient" ].value = this.effectController.mieCoefficient;
        uniforms[ "mieDirectionalG" ].value = this.effectController.mieDirectionalG;

        const theta = Math.PI * ( this.effectController.inclination - 0.5 );
        const phi = 2 * Math.PI * ( this.effectController.azimuth - 0.5 );

        this.sun.x = Math.cos( phi );
        this.sun.y = Math.sin( phi ) * Math.sin( theta );
        this.sun.z = Math.sin( phi ) * Math.cos( theta );

        uniforms[ "sunPosition" ].value.copy( this.sun );

        this.renderer.toneMappingExposure = this.effectController.exposure;
    }

    changeGUILight() {

    }

    addSphere(x,y,z) {
        const sphereRadius = 3;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        if (x) mesh.position.set(x,y,z);
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

    onWindowResize() {
        // this.aspect = window.innerWidth / window.innerHeight;
        this.aspect = 800 / 600;
    
        this.cameraPersp.aspect = this.aspect;
        this.cameraPersp.updateProjectionMatrix();
    
        this.cameraOrtho.left = this.cameraOrtho.bottom * this.aspect;
        this.cameraOrtho.right = this.cameraOrtho.top * this.aspect;
        this.cameraOrtho.updateProjectionMatrix();
    
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize( 800, 600 );
        // this.renderer.setSize( window.innerWidth, window.innerHeight );
    
        this.render();
    
    }
}