import * as THREE from '/build/three.module.js';
import { OrbitControls } from '../js/controls/OrbitControls.js';

// const canvas = document.getElementById('canvas');
// const context = canvas.getContext('2d');

document.getElementById('startButton').addEventListener('click', init);

function init() {
    const coord = {
        x: getRandomArbitrary(-1000, 1000),
        y: getRandomArbitrary(-1000, 1000),
        z: getRandomArbitrary(-1000, 1000),
    }

    // const resultCv = simpleCalcOpenCvProjection(coord.x, coord.y, coord.z);
    // const resultTh = simpleCalcThreeJsProjection(coord.x, coord.y, coord.z);
    const resultCv = simpleCalcOpenCvProjection(100,200,300);
    const resultTh = simpleCalcThreeJsProjection(100,200,300);

    console.log(resultCv, resultTh)
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function ConvertCoordinateThreeJsToUnrealEngine(p) {
    return [-1 * p[2], p[0], p[1]]
}

function ConvertCoordinateUnrealEngineToThreeJs(p) {
    return [p[1], p[2], -1 * p[0]]
}

function simpleCalcOpenCvProjection (x, y, z) {

    const cameraMatrix = calcCameraMatrix();
    
    const rvec = cv.matFromArray(3, 1, cv.CV_64FC1, [-67.7193500744558, 100.51275890018377, 121.90601256508904])
    const tvec = cv.matFromArray(3, 1, cv.CV_64FC1, [-0.06770030589928405, -98.53692659915583, -885.9708265632847])

    const rmat = new cv.Mat();
    cv.Rodrigues(rvec, rmat);

    const R = new cv.Mat();
    cv.transpose(rmat, R);

    const t = new cv.Mat();
    cv.gemm(R, tvec, -1, new cv.Mat(), 0, t)
    // -R @ tvec


    const xyz = cv.matFromArray(1, 3, cv.CV_64FC1, ConvertCoordinateThreeJsToUnrealEngine([x, y, z]))
    const xyz_ = cv.matFromArray(3, 1, cv.CV_64FC1, ConvertCoordinateThreeJsToUnrealEngine([x, y, z]))
    
    const R_t = rmat; // Rの転置
    const xyz__t = new cv.Mat();
    const uvz_est_ = new cv.Mat();
    const uvz_est = new cv.Mat();
    cv.subtract(xyz_, t, xyz__t)
    cv.gemm(R_t, xyz__t, 1, new cv.Mat(), 0, uvz_est_)
    cv.gemm(cameraMatrix, uvz_est_, 1, new cv.Mat(), 0, uvz_est)
    // K @ Rt @ (xyz_ - t)
    // https://showy-iguanodon-aca.notion.site/2D-5720fe51d2274809b357a8f0787dfcda

    const uvz_est_data = uvz_est.data64F

    // console.log(uvz_est_data[0]/uvz_est_data[2], uvz_est_data[1]/uvz_est_data[2] )
    return [uvz_est_data[0]/uvz_est_data[2], uvz_est_data[1]/uvz_est_data[2]];


    function calcCameraMatrix() {
    
        const size = {
            width: 942,
            height: 714,
        };

        const fov = 30;
        const fx = 1.0 / (2.0 * Math.tan( fov * (Math.PI/180) / 2.0 )) * size.width;
        const fy = fx;
        const cx = size.width / 2.0;
        const cy = size.height / 2.0;
        const center = [size.width / 2, size.height / 2];
        
        return cv.matFromArray(3, 3, cv.CV_64FC1, [
            ...[fx, 0, cx],
            ...[0, fy, cy],
            ...[0, 0, 1],
        ]);

    }
}

function calcOpenCvProjection() {

}

function simpleCalcThreeJsProjection(x, y, z) {

    const matrixWorldInverse = new THREE.Matrix4();
    matrixWorldInverse.set(
        0.9233958635481679, -0.058481916185951194, 0.3793678223852842, 0,
        0, 0.9883255941719126, 0.152356555174813, 0,
        -0.3838490317587543, -0.14068541283287056, 0.9126157654971295, 0,
        -0.5395468317894299, -98.63339208817239, -672.8827259295615, 1
    );
    matrixWorldInverse.transpose();

    const projectionMatrix = new THREE.Matrix4();
    projectionMatrix.set(
        2.828751885991697, 0, 0, 0,
        0, 3.7320508075688776, 0, 0,
        0, 0, -1.0004000800160031, -1,
        0, 0, -2.000400080016003, 0
    );
    projectionMatrix.transpose();

    const size = {
        width: 942,
        height: 714,
    };

    const plane = new Plane(200, 100);
    const vertices = plane.vertices;

    const screenCood = worldToScreenCoordinate(x, y, z);

    return [screenCood.x, screenCood.y]

    
    // ワールド座標からスクリーン座標に変換
    function worldToScreenCoordinate(x, y, z, camera) {
        // const projection = new THREE.Vector3(x, y, z).project(camera);
        console.log(x,y,z)
        console.log(matrixWorldInverse)
        console.log(projectionMatrix)
        const projection = new THREE.Vector3(x, y, z).applyMatrix4(matrixWorldInverse).applyMatrix4(projectionMatrix);

        const sx = (size.width / 2) * ( +projection.x + 1.0 );
        const sy = (size.height / 2) * ( -projection.y + 1.0 );
        console.log(projection)
        console.log(sx,sy)

        // スクリーン座標
        return new THREE.Vector2(sx, sy)
    }
}

function calcThreeJsProjection() {

    const paramT = {}

    initThreeJs();
    
    paramT.plane = new Plane(200, 100)
    paramT.scene.add(paramT.plane)

    paramT.plane.getVerticesCorrdinates(paramT);

    
    function initThreeJs() {
        paramT.size = {
            width: 942,
            height: 714,
        };

        paramT.scene = new THREE.Scene();
        paramT.renderer = new THREE.WebGLRenderer();
        paramT.renderTarget = new THREE.WebGLRenderTarget(paramT.size.width, paramT.size.height);

        paramT.renderer.setSize( paramT.size.width, paramT.size.height );

        paramT.aspect = window.innerWidth / window.innerHeight;

        paramT.currentCamera = new THREE.PerspectiveCamera( 30, paramT.aspect, 1, 5000 );
        paramT.currentCamera.position.set( 250, 200, 600 );
        console.log(paramT.currentCamera.projectionMatrixInverse)
        paramT.orbit = new OrbitControls( paramT.currentCamera, paramT.renderer.domElement );
        paramT.orbit.target.set(1.0, 100.0, 1.0)
        paramT.orbit.update();
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
    getVerticesCorrdinates(paramT) {
        this.vertices.forEach(v => {
            let c = this.worldToScreenCoordinate(v.x, v.y, v.z, paramT);
            console.log(v, c)
        });

        let c = this.worldToScreenCoordinate(0, 0, 0, paramT);
        console.log(new THREE.Vector3(0, 0, 0), c)

        console.log("camera:", paramT.currentCamera)
        console.log("orbit:", paramT.orbit)
        console.log("Width:", paramT.size.width, " Height:", paramT.size.height)
        console.log("matrixWorldInverse:", paramT.currentCamera.matrixWorldInverse)
        console.log("projectionMatrix:", paramT.currentCamera.projectionMatrix)
    }

    // ワールド座標からスクリーン座標に変換
    worldToScreenCoordinate(x, y, z, paramT) {
        const projection = new THREE.Vector3(x, y, z).project(paramT.currentCamera);
        // const projection = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);

        const sx = (paramT.size.width / 2) * ( +projection.x + 1.0 );
        const sy = (paramT.size.height / 2) * ( -projection.y + 1.0 );

        // スクリーン座標
        return new THREE.Vector2(sx, sy)
    }
}