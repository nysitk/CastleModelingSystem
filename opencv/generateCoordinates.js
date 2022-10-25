import * as THREE from '/build/three.module.js';
import { OrbitControls } from '../js/controls/OrbitControls.js';
import { Sky } from '../js/controls/Sky.js';
import { GUI } from '../js/controls/dat.gui.module.js';

// const canvas = document.getElementById('canvas');
// const context = canvas.getContext('2d');

document.getElementById('startButton2').addEventListener('click', init);

function init() {
    const threeJsScene = new ThreeJsScene();
    WebGLAnimation(threeJsScene)

    function WebGLAnimation() {
        requestAnimationFrame(WebGLAnimation);
        threeJsScene.render();
    }
}

class ThreeJsScene {

    constructor() {

        this.size = {
            width: 942,
            height: 714,
        };

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderTarget = new THREE.WebGLRenderTarget(this.size.width, this.size.height);

        this.init();

        this.spheres = [];
        this.sphereGroups = new THREE.Group();
        this.scene.add(this.sphereGroups)

        return this;

    }

    
    init() {

        this.addHelper();

        this.addCamera();
        this.addSky();
        
        this.adjustSize();
        this.addOrbit();
        this.addGUI();

        this.addEventListener();

    }

    render() {

        this.renderer.setRenderTarget( null );
        this.renderer.render( this.scene, this.currentCamera );

        this.changeSphereTable();

    }

    addHelper() {

        this.grid = new THREE.Group();

        const grid1 = new THREE.GridHelper( 1000, 20, 0x888888 );
        grid1.material.color.setHex( 0x888888 );
        grid1.material.vertexColors = false;
        // this.grid.add( grid1 );

        const grid2 = new THREE.GridHelper( 1000, 5, 0xffffff );
        grid2.material.color.setHex( 0x888888 );
        grid2.material.depthFunc = THREE.AlwaysDepth;
        grid2.material.vertexColors = false;
        this.grid.add( grid2 );

        this.scene.add(this.grid)

        this.axesHelper = new THREE.AxesHelper( 150 );
        this.scene.add( this.axesHelper );

    }

    addCamera() {
        
        this.aspect = this.size.width / this.size.height;

        this.currentCamera = new THREE.PerspectiveCamera( 30, this.aspect, 1, 5000 );
        this.currentCamera.position.set( 250, 200, 600 );

    }

    addOrbit() {
        
        this.orbit = new OrbitControls( this.currentCamera, this.renderer.domElement );
        this.orbit.target.set(1.0, 100.0, 1.0)
        this.orbit.update();

    }

    adjustSize() {

        // this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.size.width, this.size.height );
        document.body.appendChild( this.renderer.domElement );

    }

    addSky() {

        this.sky = new Sky();
        this.sky.scale.setScalar( 450000 );
        this.scene.add(this.sky);

    }

    addGUI() {

        this.gui = new GUI();

        this.addGUICamera();
        this.addGUIOrbit();
        this.addGUIRenderSize();

        this.changeGUI();

    }

    addGUICamera() {

        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.add(this.currentCamera, "fov", 0, 90, 1).onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.position, "x", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.position, "y", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.position, "z", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.rotation, "x", -1, 1, 0.1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.rotation, "y", -1, 1, 0.1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.add(this.currentCamera.rotation, "z", -1, 1, 0.1).listen().onChange( () => { this.changeGUI() } );
        cameraFolder.open()

    }

    addGUIOrbit() {
        
        const orbitFolder = this.gui.addFolder('Orbit');
        orbitFolder.add(this.orbit.target, "x", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        orbitFolder.add(this.orbit.target, "y", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        orbitFolder.add(this.orbit.target, "z", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        orbitFolder.open()

    }

    addGUIRenderSize() {

        const renderSizeFolder = this.gui.addFolder('RenderSize');
        renderSizeFolder.add(this.size, "width", 0, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        renderSizeFolder.add(this.size, "height", 0, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        renderSizeFolder.open();

    }

    changeGUI() {

        this.changeRendererSize(this.size.width, this.size.height);
        this.changeGUICamera();
        this.changeSphereTable();

        this.render();

    }

    changeRendererSize(width, height) {

        this.aspect = width / height;
    
        this.currentCamera.aspect = this.aspect;
        this.currentCamera.updateProjectionMatrix();
    
        // this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize( width, height );
        this.renderTarget.setSize( width, height );
    
    }

    changeGUICamera() {
        this.orbit.object = this.currentCamera;

        // this.currentCamera.lookAt( this.orbit.target.x, this.orbit.target.y, this.orbit.target.z );
        this.currentCamera.updateProjectionMatrix()
        // this.onWindowResize();

    }

    addEventListener() {

        document.getElementById('addSphereButton').addEventListener('click', () => { this.addSphere() });
        document.getElementById('setSceneButton').addEventListener('click', () => { this.setSceneInit() });
        this.renderer.domElement.addEventListener('mousemove', (e) => { this.onMoveEvent(e) }, false);

    }

    onMoveEvent(e) {
        
        const mousePos = new THREE.Vector2(e.offsetX, e.offsetY);
        document.getElementById("mousePos").innerHTML = mousePos.x + ", " + mousePos.y;
    }

    addSphere() {

        const x = getRandomArbitrary(-1000, 1000);
        const y = getRandomArbitrary(-1000, 1000);
        const z = getRandomArbitrary(-1000, 1000);
        
        function getRandomArbitrary(min, max) {
            return Math.random() * (max - min) + min;
        }

        const sphere = new Sphere(this, x, y, z);

        this.sphereGroups.add(sphere.mesh);
        this.spheres.push(sphere);

        sphere.ID = this.spheres.length;

        this.addGUISphere(sphere);
        sphere.addTableRow();

        return sphere;

    }

    addGUISphere(sphere) {

        const sphereFolder = this.gui.addFolder('Sphere-' + sphere.ID);
        sphereFolder.add(sphere.mesh, 'visible').listen().onChange( () => { this.changeGUI() } );
        sphereFolder.add(sphere.mesh.position, "x", -2000, 2000, 1).listen().onFinishChange( () => { this.changeGUI() } );
        sphereFolder.add(sphere.mesh.position, "y", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        sphereFolder.add(sphere.mesh.position, "z", -2000, 2000, 1).listen().onChange( () => { this.changeGUI() } );
        sphereFolder.open();

    }

    changeSphereTable() {

        if (this.spheres == undefined) return;

        for (let i = 0; i < this.spheres.length; i++) {
            
            this.spheres[i].changeTableRow();
            
        }

    }

    setSceneInit() {
        const scene = this;
        let requestURL = 'dataset.json';
        let request = new XMLHttpRequest();
        request.open('GET', requestURL);
        request.responseType = 'json';

        request.send();

        request.onload = function() {
            let JSONData = request.response;
            JSONData = JSON.parse(JSON.stringify(JSONData));
            
            setScene(scene, JSONData.data);
        }

        function setScene(scene, data) {

            const currentData = data[2];

            scene.size.width = currentData.renderSize.width;
            scene.size.height = currentData.renderSize.height;

            scene.currentCamera.fov = currentData.camera.fov;
            let cameraPos = currentData.camera.position;
            if (currentData.coordinateSystem == "UnrealEngine") {
                cameraPos = ConvertCoordinateUnrealEngineToThreeJs(cameraPos)
            }
            scene.currentCamera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);

            let cameraRot = currentData.camera.rotation;
            if (cameraRot != undefined) {
                if (currentData.coordinateSystem == "UnrealEngine") {
                    cameraRot = ConvertCoordinateUnrealEngineToThreeJs(cameraRot)
                    console.log(cameraRot)
                }
                function degToRad(deg) {
                    return deg * (Math.PI/180)
                }
                scene.currentCamera.rotation.set(degToRad(41), degToRad(0), degToRad(326));
            }
            console.log(scene.currentCamera.rotation)

            let orbitTarget = currentData.orbit.target;
            if (orbitTarget != undefined) {
                if (currentData.coordinateSystem == "UnrealEngine") {
                    orbitTarget = ConvertCoordinateUnrealEngineToThreeJs(orbitTarget)
                }
                scene.orbit.target.set(orbitTarget[0], orbitTarget[1], orbitTarget[2]);
            }

            for (let i = 0; i < currentData.coordinates.length; i++) {

                const coordinate = currentData.coordinates[i];

                const sphere = scene.addSphere();
                let c = coordinate.worldCoordinate;
                if (currentData.coordinateSystem == "UnrealEngine") {
                    c = ConvertCoordinateUnrealEngineToThreeJs(c)
                }
                sphere.mesh.position.set(c[0], c[1], c[2])
                
            }

            scene.changeGUI();

        }

        function ConvertCoordinateUnrealEngineToThreeJs(p) {
            return [p[1], p[2], -1 * p[0]]
        }

    }

}

class Sphere {

    constructor(sceneManager, x = 0, y = 0, z = 0) {

        this.sceneManager = sceneManager;

        this.mesh = this.generateMesh();
        this.setPosition(x, y, z);

        return this;

    }

    generateMesh() {

        const sphereRadius = 3;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;

        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshBasicMaterial({color: '#C00'});
        
        return new THREE.Mesh(sphereGeo, sphereMat);

    }

    setPosition(x = 0, y = 0, z = 0) {

        this.mesh.position.set(x, y, z);

    }

    addTableRow() {

        this.tableRow = document.createElement('tr')
        this.tds = {}

        this.tds.tdID = document.createElement('td')
        this.tds.tdID.classList.add('ID')
        this.tds.tdID.innerHTML = this.ID;
        this.tableRow.appendChild(this.tds.tdID);

        this.tds.td3Dx = document.createElement('td')
        this.tds.td3Dx.classList.add('td3Dx')
        this.tableRow.appendChild(this.tds.td3Dx);

        this.tds.td3Dy = document.createElement('td')
        this.tds.td3Dy.classList.add('td3Dy')
        this.tableRow.appendChild(this.tds.td3Dy);

        this.tds.td3Dz = document.createElement('td')
        this.tds.td3Dz.classList.add('td3Dz')
        this.tableRow.appendChild(this.tds.td3Dz);

        this.tds.td2Dx = document.createElement('td')
        this.tds.td2Dx.classList.add('td2Dx')
        this.tableRow.appendChild(this.tds.td2Dx);

        this.tds.td2Dy = document.createElement('td')
        this.tds.td2Dy.classList.add('td2Dy')
        this.tableRow.appendChild(this.tds.td2Dy);

        this.changeTableRow();

        document.getElementById("sphereTable").appendChild(this.tableRow)

    }

    changeTableRow() {

        this.tds.td3Dx.innerHTML = this.mesh.position.x;
        this.tds.td3Dy.innerHTML = this.mesh.position.y;
        this.tds.td3Dz.innerHTML = this.mesh.position.z;

        this.screenPosition = this.worldToScreenCoordinate();

        this.tds.td2Dx.innerHTML = this.screenPosition.x;
        this.tds.td2Dy.innerHTML = this.screenPosition.y;

    }

    worldToScreenCoordinate() {

        const camera = this.sceneManager.currentCamera;
        const x = this.mesh.position.x;
        const y = this.mesh.position.y;
        const z = this.mesh.position.z;

        const projection = new THREE.Vector3(x, y, z).project(camera);
        // const projection = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);

        const sx = (this.sceneManager.size.width / 2) * ( +projection.x + 1.0 );
        const sy = (this.sceneManager.size.height / 2) * ( -projection.y + 1.0 );

        // スクリーン座標
        return new THREE.Vector2(sx, sy)

    }

}