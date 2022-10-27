import * as THREE from '/build/three.module.js';
import { OrbitControls } from '../js/controls/OrbitControls.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

document.getElementById('startButton3').addEventListener('click', init);

function ConvertCoordinateThreeJsToUnrealEngine(p) {
    return [-1 * p[2], p[0], p[1]]
}

function ConvertCoordinateUnrealEngineToThreeJs(p) {
    return [p[1], p[2], -1 * p[0]]
}


function init() {
    let requestURL = 'dataset.json';
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';

    request.send();

    request.onload = function() {
        let JSONData = request.response;
        JSONData = JSON.parse(JSON.stringify(JSONData));
        
        solvePnPFromJSON(JSONData.data);
    }
}



function solvePnPFromJSON(data) {

    const dataNum = document.getElementById('sceneInput').value;
    if (dataNum == "") return;
    const currentData = data[dataNum];

    const testPoints3D = []
    const testPoints2D = []
    console.log(data.length)
    for (let i = 0; i < currentData.coordinates.length; i++) {

        let pW = currentData.coordinates[i].worldCoordinate;

        if (currentData.coordinateSystem == "Three.js") {
            pW = ConvertCoordinateThreeJsToUnrealEngine(pW);
        }

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

    const fov = currentData.camera.fov;
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
        tvec.data64F[0] = getRandomArbitrary(-1000, 1000);
        tvec.data64F[1] = getRandomArbitrary(-1000, 1000);
        tvec.data64F[2] = getRandomArbitrary(-1000, 1000);

        // tvec.data64F[0] = -1;
        // tvec.data64F[1] = 86;
        // tvec.data64F[2] = 1000;
            
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
            true
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
            console.log(i, ID)
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

    const json = JSON.stringify(estimatedCVFinal);
    console.log(estimatedCVFinal);
    console.log(json);

    document.getElementById('exportPnPButton').addEventListener('click', () => { exportPnP() });

    const t = estimatedCVFinal.camera.t.matrix;
    if (currentData.coordinateSystem == "Three.js") {
        console.log("traw(Three.js): ", ConvertCoordinateUnrealEngineToThreeJs(t))
    } else {
        console.log("traw: ", t)
    }

    drawResultAxis(currentData.coordinateSystem, rvec, tvec, cameraMatrix, distCoeffs)

}

function clearCanvas(currentData) {
    canvas.width = currentData.renderSize.width;
    canvas.height = currentData.renderSize.height;
    canvas.style.width = currentData.renderSize.width;
    canvas.style.height = currentData.renderSize.height;
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

    if (coordinateSystem == "Three.js") {
        worldPointArray = ConvertCoordinateThreeJsToUnrealEngine(worldPointArray);
    }

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

    if (coordinateSystem == "Three.js") {
        worldPointArray = ConvertCoordinateThreeJsToUnrealEngine(worldPointArray);
    }
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
    context.fillStyle = color;
    context.fillRect(coord2D[0], coord2D[1], 5, 5)
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
    context.beginPath();
    context.lineWidth = 2;
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
        [0.0, 0.0, length],
        [0.0, length, 0.0],
        [length, 0.0, 0.0],
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
