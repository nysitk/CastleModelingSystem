import * as THREE from '/build/three.module.js';


export class DetectRectangleTest {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;

        this.plane = new Plane(200, 100)
        this.scene.add(this.plane)

        this.plane.getVerticesCorrdinates(this.sceneManager);
    }
}

class Plane extends THREE.Mesh {
    constructor(width, height) {
        super();

        this.geometry = new THREE.PlaneGeometry( width, height );
        this.material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

        this.width = width;
        this.height = height;

        this.vertices = [
            new THREE.Vector3(width/2, 0, -height/2),
            new THREE.Vector3(width/2, 0, height/2),
            new THREE.Vector3(-width/2, 0, height/2),
            new THREE.Vector3(-width/2, 0, -height/2),
        ]

        this.rotateX(Math.PI / 2)
    }

    // 4頂点のワールド座標と対応するスクリーン座標を表示
    getVerticesCorrdinates(sceneManager) {
        this.vertices.forEach(v => {
            let c = this.worldToScreenCoordinate(v.x, v.y, v.z, sceneManager.currentCamera);
            console.log(v, c)
        });

        let c = this.worldToScreenCoordinate(0, 0, 0, sceneManager.currentCamera);
        console.log(new THREE.Vector3(0, 0, 0), c)

        console.log("camera:", sceneManager.currentCamera)
        console.log("orbit:", sceneManager.orbit)
        console.log("Width:", window.innerWidth, " Height:", window.innerHeight)
    }

    // ワールド座標からスクリーン座標に変換
    worldToScreenCoordinate(x, y, z, camera) {
        const projection = new THREE.Vector3(x, y, z).project(camera);
        // const projection = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);

        const sx = (window.innerWidth / 2) * ( +projection.x + 1.0 );
        const sy = (window.innerHeight / 2) * ( -projection.y + 1.0 );

        // スクリーン座標
        return new THREE.Vector2(sx, sy)
    }
}


// 2D<->3D対応とカメラパラメータ例
// [Data 1]
// Vector3 {x: 100, y: 0, z: -50, isVector3: true} Vector2 {x: 688.286260309103, y: 547.7693216104362, isVector2: true}
// Vector3 {x: 100, y: 0, z: 50, isVector3: true} Vector2 {x: 635.1535061118146, y: 609.1185319461545, isVector2: true}
// Vector3 {x: -100, y: 0, z: 50, isVector3: true} Vector2 {x: 246.5258163046029, y: 556.9337685790189, isVector2: true}
// Vector3 {x: -100, y: 0, z: -50, isVector3: true} Vector2 {x: 341.2150407142316, y: 508.03381906990717, isVector2: true}
// Vector3 {x: 0, y: 0, z: 0, isVector3: true} Vector2 {x: 469.9316697369703, y: 552.2991501471544, isVector2: true}
// this.currectCamera.position.set( 250, 200, 600 )
// this.orbit.target.set(1.0, 100.0, 1.0)
// DetectRectangle.js:43 Width: 942  Height: 714
// cameraDetail: {
//     "metadata": {
//         "version": 4.5,
//         "type": "Object",
//         "generator": "Object3D.toJSON"
//     },
//     "object": {
//         "uuid": "2765F9CF-1C27-48D2-9A14-0A30894B7F26",
//         "type": "PerspectiveCamera",
//         "layers": 1,
//         "matrix": [
//             0.9233958635481679,
//             0,
//             -0.3838490317587543,
//             0,
//             -0.0584819161859512,
//             0.9883255941719127,
//             -0.14068541283287056,
//             0,
//             0.3793678223852842,
//             0.152356555174813,
//             0.9126157654971294,
//             0,
//             250.00000000000006,
//             200.00000000000006,
//             600.0000000000001,
//             1
//         ],
//         "fov": 30,
//         "zoom": 1,
//         "near": 1,
//         "far": 5000,
//         "focus": 10,
//         "aspect": 1.319327731092437,
//         "filmGauge": 35,
//         "filmOffset": 0
//     }
// }
// orbitDetail: {
//     "object": {
//         "metadata": {
//             "version": 4.5,
//             "type": "Object",
//             "generator": "Object3D.toJSON"
//         },
//         "object": {
//             "uuid": "2765F9CF-1C27-48D2-9A14-0A30894B7F26",
//             "type": "PerspectiveCamera",
//             "layers": 1,
//             "matrix": [
//                 0.9233958635481679,
//                 0,
//                 -0.3838490317587543,
//                 0,
//                 -0.0584819161859512,
//                 0.9883255941719127,
//                 -0.14068541283287056,
//                 0,
//                 0.3793678223852842,
//                 0.152356555174813,
//                 0.9126157654971294,
//                 0,
//                 250.00000000000006,
//                 200.00000000000006,
//                 600.0000000000001,
//                 1
//             ],
//             "fov": 30,
//             "zoom": 1,
//             "near": 1,
//             "far": 5000,
//             "focus": 10,
//             "aspect": 1.319327731092437,
//             "filmGauge": 35,
//             "filmOffset": 0
//         }
//     },
//     "domElement": {},
//     "enabled": true,
//     "target": {
//         "x": 1,
//         "y": 100,
//         "z": 1
//     },
//     "minDistance": 0,
//     "maxDistance": null,
//     "minZoom": 0,
//     "maxZoom": null,
//     "minPolarAngle": 0,
//     "maxPolarAngle": 3.141592653589793,
//     "minAzimuthAngle": null,
//     "maxAzimuthAngle": null,
//     "enableDamping": false,
//     "dampingFactor": 0.05,
//     "enableZoom": true,
//     "zoomSpeed": 1,
//     "enableRotate": true,
//     "rotateSpeed": 1,
//     "enablePan": true,
//     "panSpeed": 1,
//     "screenSpacePanning": true,
//     "keyPanSpeed": 7,
//     "autoRotate": false,
//     "autoRotateSpeed": 2,
//     "enableKeys": true,
//     "keys": {
//         "LEFT": 37,
//         "UP": 38,
//         "RIGHT": 39,
//         "BOTTOM": 40
//     },
//     "mouseButtons": {
//         "LEFT": 0,
//         "MIDDLE": 1,
//         "RIGHT": 2
//     },
//     "touches": {
//         "ONE": 0,
//         "TWO": 2
//     },
//     "target0": {
//         "x": 0,
//         "y": 0,
//         "z": 0
//     },
//     "position0": {
//         "x": 250,
//         "y": 200,
//         "z": 600
//     },
//     "zoom0": 1
// }
