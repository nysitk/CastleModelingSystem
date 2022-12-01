import * as THREE from '/build/three.module.js';

import { DraggablePoint } from './planeControlTab.js';

/**
 * 平面カメラ推定
 */
export class PlaneEstimation {

	constructor(sceneManager) {
		
		this.sceneManager = sceneManager;
		this.renderSize = {
            width: sceneManager.canvasController.width,
		    height: sceneManager.canvasController.height
        }

        this.rectAspect = 1.0; // aspect of rectangle. ( = width / height);
        this.rectWidth = 200;

		this.vertices2D = [
			new DraggablePlaneEstimationPoint(this.renderSize.width / 4 * 1, this.renderSize.height / 4 * 3, 0).add(this),
			new DraggablePlaneEstimationPoint(this.renderSize.width / 4 * 3, this.renderSize.height / 8 * 7, 1).add(this),
			new DraggablePlaneEstimationPoint(this.renderSize.width / 4 * 3, this.renderSize.height / 2 * 1, 2).add(this),
			new DraggablePlaneEstimationPoint(this.renderSize.width / 8 * 3, this.renderSize.height / 2 * 1, 3).add(this),
		]

	}

    startSolvePnP() {

        if (this.vertices2D.length != 4) {
            console.error("Number of Draggable Point must be 4.");
            return;
        }

        const currentData = this.exportScene();
        const estimatedCV = solvePnPFromJSON(currentData);
        this.setFromEstimatedCV(estimatedCV);

    }

    exportScene() {
        
        const data = {};

        data.coordinateSystem = "Three.js";

        data.coordinates = this.exportCoordinatesSet();

        data.camera = {
            fov: this.sceneManager.currentCamera.fov
        }

        data.renderSize = {
            width: this.sceneManager.canvasController.width,
            height: this.sceneManager.canvasController.height
        }
        
        return data;

    }

    exportCoordinatesSet() {

        const width = this.rectWidth;
        const height = width / this.rectAspect;

        const coordinatesSet = [];

        this.vertices3D = [
            new THREE.Vector3(-width/2, 0, height/2),
            new THREE.Vector3(width/2, 0, height/2),
            new THREE.Vector3(width/2, 0, -height/2),
            new THREE.Vector3(-width/2, 0, -height/2),
        ]

        for (let i = 0; i < this.vertices2D.length; i++) {

            const coordinate = {};

            coordinate.ID = i+1;

            const worldCoordinate = this.vertices3D[i];
            coordinate.worldCoordinate = [worldCoordinate.x, worldCoordinate.y, worldCoordinate.z];

            const screenCoordinate = this.vertices2D[i].positionInCanvas;
            coordinate.screenCoordinate = [screenCoordinate.x, screenCoordinate.y];

            coordinatesSet.push(coordinate);
            
        }

        return coordinatesSet;

    }

    setFromEstimatedCV(estimatedCV) {

        this.sceneManager.operationManager.disableOrbit();

        const R3 = new THREE.Matrix3().fromArray(estimatedCV.camera.R.matrix).transpose();
        const R4 = setFromMatrix3(R3, new THREE.Matrix4())
        const cameraRotation = new THREE.Euler().setFromRotationMatrix(R4, 'XYZ');
        this.sceneManager.currentCamera.rotation.set(cameraRotation.x - Math.PI, -cameraRotation.y, -cameraRotation.z)

        const camera_t = estimatedCV.camera.t;
        this.sceneManager.currentCamera.position.set(camera_t.matrix[0], camera_t.matrix[1], camera_t.matrix[2]);

        // console.log(this.sceneManager.orbit.target)
        // this.updateOrbit();
        // console.log(this.sceneManager.orbit.target)
        
        function setFromMatrix3( m3, m4 ) {

            const me = m3.elements;

            m4.set(

                me[ 0 ], me[ 3 ], me[ 6 ], 0,
                me[ 1 ], me[ 4 ], me[ 7 ], 0,
                me[ 2 ], me[ 5 ], me[ 8 ], 0,
                0, 0, 0, 1

            );

            return m4;

        }

    }

    updateOrbit() {

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(0, 0); // 画面の中心

        const rectangle = generateRectangle(10000, 10000)
        this.sceneManager.scene.add(rectangle)
        this.sceneManager.render();

        raycaster.setFromCamera( pointer, this.sceneManager.currentCamera );
        const intersect = raycaster.intersectObject(rectangle);

        console.log(intersect)
        if (intersect[0] === undefined) return;

        const p = intersect[0].point;
        console.log(p)

        this.sceneManager.orbit.target.set(p.x, p.y, p.z)
        this.sceneManager.orbit.update();
        this.sceneManager.orbit.enabled = false;


        function generateRectangle(width, height) {
            
            const geometry = new THREE.PlaneGeometry( width, height );
            const material = new THREE.MeshBasicMaterial( {color: 0xffff00, opacity: 0} );

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;

            return mesh;

        }

    }

}

/**
 * 2Dfixモードでクリックしたときに、基準点（P1～P4）の画素座標を保持する
 */ 
 class DraggablePlaneEstimationPoint extends DraggablePoint {

    constructor(x = 0, y = 0, clickCount = 0) {
        
        super(x, y, clickCount);

        this.name = "draggablePointPlaneEstimation"

		return this;

    }

    add(planePointControl) {

        this.planePointControl = planePointControl;
        this.sceneManager = planePointControl.sceneManager;

        super.add();

        super.setMouseEvent({
            "mousedown": this.mousedown,
            "viewMousemove": this.viewMousemove,
            "mouseup": this.mouseup
        })

		return this;

    }

    mousedown(e, arg) {

        super.mousedown(e, arg);

    }

    viewMousemove(e, arg) {

        if (!arg.isDragging) return;
		
        super.viewMousemove(e, arg);
        
        arg.planePointControl.startSolvePnP(arg.clickCount, arg.positionInCanvas);

        arg.planePointControl.sceneManager.updateScene();

    }

    mouseup(e, arg) {

        super.mouseup(e, arg);

    }
    
}


function solvePnPFromJSON(currentData) {

    const testPoints3D = []
    const testPoints2D = []

    for (let i = 0; i < currentData.coordinates.length; i++) {

        let pW = currentData.coordinates[i].worldCoordinate;
        testPoints3D.push(...pW);

        let pS = currentData.coordinates[i].screenCoordinate;
        testPoints2D.push(...pS);

    }

    const rows = testPoints3D.length / 3;

    // camera matrix
    const size = {
        width: currentData.renderSize.width,
        height: currentData.renderSize.height,
    };

    const fov = currentData.camera.fov ? currentData.camera.fov : 30;
    const fx = 1.0 / (2.0 * Math.tan( fov * (Math.PI/180) / 2.0 )) * size.height;
    const fy = fx;
    const cx = size.width / 2.0;
    const cy = size.height / 2.0;
    const center = [size.width / 2, size.height / 2];
    const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
        ...[fx, 0, cx],
        ...[0, fy, cy],
        ...[0, 0, 1],
    ]);

    // image matrix
    const distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64FC1);
    const rvec = new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1);
    const tvec = new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1);

    // 2D points
    const imagePoints = cv.matFromArray(rows, 2, cv.CV_64FC1, testPoints2D);

    // 3D points
    const modelPoints = cv.matFromArray(rows, 3, cv.CV_64FC1, testPoints3D);

    const result = {}
    let estimatedCVFinal = {}
    let estimatedCVtmp = {}
    let diffFinal = Infinity;

    const trials = 1;
    for (let i = 0; i < trials; i++) {
        // 移動ベクトルと回転ベクトルの初期値を与えることで推測速度の向上をはかる
        // tvec.data64F[0] = getRandomArbitrary(-1000, 1000);
        // tvec.data64F[1] = getRandomArbitrary(-1000, 1000);
        // tvec.data64F[2] = getRandomArbitrary(-1000, 1000);
            
        function getRandomArbitrary(min, max) {
            return Math.random() * (max - min) + min;
        }

        const success = cv.solvePnP(
            modelPoints,
            imagePoints,
            cameraMatrix,
            distCoeffs,
            rvec,
            tvec,
            false,
            cv.SOLVEPNP_P3P
        );

        if (!success) {
            console.error("solvePnP failed");
            return;
        }

        const R_t = calc_R_t(rvec, tvec);

        const rmat = R_t.rmat;
        const R = R_t.R;
        const t = R_t.t;

        estimatedCVtmp.camera = {}
        estimatedCVtmp.camera.rvec = convertMatToJSON(rvec);
        estimatedCVtmp.camera.tvec = convertMatToJSON(tvec);
        estimatedCVtmp.camera.rmat = convertMatToJSON(rmat);
        estimatedCVtmp.camera.R = convertMatToJSON(R);
        estimatedCVtmp.camera.t = convertMatToJSON(t);
        estimatedCVtmp.camera.K = convertMatToJSON(cameraMatrix);

        clearCanvas(currentData);

        estimatedCVtmp.coordinates = []
        let diffu = 0, diffv = 0;
        for (let ID = 0; ID < currentData.coordinates.length; ID++) {

            const coordinate = currentData.coordinates[ID];

            const coordinateResult = {}
            coordinateResult.original = coordinate

            coordinateResult.Rt2Duvz = verifyProjectionCalc_R_t(coordinate.worldCoordinate, currentData.coordinateSystem, R, t, cameraMatrix);
            coordinateResult.Rt2Duv = UVZtoUV(coordinateResult.Rt2Duvz)

            coordinateResult.Pr2D = verifyProjectionCalc_Projection(coordinate.worldCoordinate, currentData.coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs);
            
            diffu += Math.abs(coordinateResult.Rt2Duv[0] - coordinate.screenCoordinate[0]);
            diffv += Math.abs(coordinateResult.Rt2Duv[1] - coordinate.screenCoordinate[1]);

            estimatedCVtmp.coordinates.push(convertCoordToJSON(coordinateResult))
            // console.log(i, ID)
        }

        if (diffu + diffv < diffFinal) {
            diffFinal = diffu + diffv;
            estimatedCVFinal = estimatedCVtmp;
        }
    }

    for (let ID = 0; ID < estimatedCVFinal.coordinates.length; ID++) {

        const coordinateResult = estimatedCVFinal.coordinates[ID];

        drawCanvasPoint(coordinateResult.screenCoordinate, "blue");
        // drawCanvasPoint(coordinateResult.Pr2D, "green")
        drawCanvasPoint(currentData.coordinates[ID].screenCoordinate, "red");
        
    }

    drawResultAxis(currentData.coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs)

    return estimatedCVFinal;
    
}

function clearCanvas(currentData) {

    const canvas = document.getElementById('estimationCanvas');
    const context = canvas.getContext('2d');

    canvas.width = currentData.renderSize.width;
    canvas.height = currentData.renderSize.height;
    context.clearRect(0, 0, canvas.width, canvas.height);

}

function convertMatToJSON(mat) {
    const matrix = []
    for (let i = 0; i < mat.data64F.length; i++) {
        matrix.push(mat.data64F[i]);
    }

    return {
        "rows": mat.rows,
        "cols": mat.cols,
        "matrix": matrix
    }
}

function convertCoordToJSON(coord) {
    return {
        "ID": coord.original.ID,
        "uvz": coord.Rt2Duvz,
        "screenCoordinate": coord.Rt2Duv
    }
}

function calc_R_t(rvec, tvec) {

    const rmat = new cv.Mat();
    cv.Rodrigues(rvec, rmat);

    const R = new cv.Mat();
    cv.transpose(rmat, R);

    const t = new cv.Mat();
    cv.gemm(R, tvec, -1, new cv.Mat(), 0, t)
    // -R @ tvec

    return {rmat, R, t}

}

// 検算
function verifyProjectionCalc_R_t(worldPointArray, coordinateSystem, R, t, cameraMatrix) {

    const xyz = cv.matFromArray(1, 3, cv.CV_64FC1, worldPointArray)
    const xyz_ = cv.matFromArray(3, 1, cv.CV_64FC1, worldPointArray)
    
    const R_t = new cv.Mat();
    cv.transpose(R, R_t);

    const xyz__t = new cv.Mat();
    const uvz_est_ = new cv.Mat();
    const uvz_est = new cv.Mat();
    cv.subtract(xyz_, t, xyz__t)
    cv.gemm(R_t, xyz__t, 1, new cv.Mat(), 0, uvz_est_)
    cv.gemm(cameraMatrix, uvz_est_, 1, new cv.Mat(), 0, uvz_est)
    // K @ Rt @ (xyz_ - t)
    // https://showy-iguanodon-aca.notion.site/2D-5720fe51d2274809b357a8f0787dfcda

    return [uvz_est.data64F[0], uvz_est.data64F[1], uvz_est.data64F[2]]

}

function UVZtoUV(arr) {
    return [ arr[0] / arr[2], arr[1] / arr[2]];
}

function verifyProjectionCalc_Projection(worldPointArray, coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs) {

    const worldPoint = cv.matFromArray(1, 3, cv.CV_64FC1, worldPointArray);

    const screenPoint = new cv.Mat();
    const jaco = new cv.Mat();

    cv.projectPoints(
        worldPoint,
        rvec,
        tvec,
        cameraMatrix,
        distCoeffs,
        screenPoint,
        jaco
    );

    return screenPoint.data64F;

}

function drawCanvasPoint(coord2D, color) {
    const canvas = document.getElementById('estimationCanvas');
    const context = canvas.getContext('2d');

    context.fillStyle = color;
    context.fillRect(coord2D[0], coord2D[1], 24, 24)
}

function drawCanvasLine(start, end, direction) {

    let color = "black"
    switch (direction) {
        case "x":
            color = "red"
            break;
        case "y":
            color = "green"
            break;
        case "z":
            color = "blue"
            break;
    }
    
    const canvas = document.getElementById('estimationCanvas');
    const context = canvas.getContext('2d');

    context.beginPath();
    context.lineWidth = 8;
    context.strokeStyle = color;
    context.moveTo(start[0], start[1]);
    context.lineTo(end[0], end[1]);
    context.stroke();
    context.closePath();

}

function drawResultAxis(coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs) {

    const length = 100.0;

    const refPoints = [
        [0.0, 0.0, 0.0],
        [length, 0.0, 0.0],
        [0.0, length, 0.0],
        [0.0, 0.0, length],
    ]

    const scrPoints = []
    for (let i = 0; i < refPoints.length; i++) {
        const refPoint = refPoints[i];
        const coord2D = verifyProjectionCalc_Projection(refPoint, coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs);
        scrPoints.push(coord2D)
    }

    drawCanvasLine(scrPoints[0], scrPoints[1], "x");
    drawCanvasLine(scrPoints[0], scrPoints[2], "y");
    drawCanvasLine(scrPoints[0], scrPoints[3], "z");

}
