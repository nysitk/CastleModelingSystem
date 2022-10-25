import * as THREE from '/build/three.module.js';
import { OrbitControls } from '../js/controls/OrbitControls.js';

// const canvas = document.getElementById('canvas');
// const context = canvas.getContext('2d');

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

    const dataNum = 1;
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
    const fx = 1.0 / (2.0 * Math.tan( fov * (Math.PI/180) / 2.0 )) * size.width;
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

    // 移動ベクトルと回転ベクトルの初期値を与えることで推測速度の向上をはかる
    tvec.data64F[0] = 100;
    tvec.data64F[1] = 100;
    tvec.data64F[2] = 3000;

    const success = cv.solvePnP(
        modelPoints,
        imagePoints,
        cameraMatrix,
        distCoeffs,
        rvec,
        tvec,
        true
    );

    const result = {
        success,
        imagePoints,
        cameraMatrix,
        distCoeffs,
        rvec, // 回転ベクトル
        tvec, // 移動ベクトル
    };

    const R_t = calc_R_t(rvec, tvec);
    const R = R_t.R;
    const t = R_t.t;

    for (let i = 0; i < currentData.coordinates.length; i++) {
        const coordinate = currentData.coordinates[i];
        verifyProjectionCalc(coordinate, currentData.coordinateSystem, R, t, cameraMatrix);
    }

}

function calc_R_t(rvec, tvec) {

    console.log("tvec:", tvec.data64F)

    const rmat = new cv.Mat();
    cv.Rodrigues(rvec, rmat);

    const R = new cv.Mat();
    cv.transpose(rmat, R);

    const t = new cv.Mat();
    cv.gemm(R, tvec, -1, new cv.Mat(), 0, t)
    // -R @ tvec

    console.log("rmat: ", rmat.data64F);
    console.log("t: ", t.data64F);
    console.log("R: ", R.data64F);

    console.log("traw: ", ConvertCoordinateUnrealEngineToThreeJs([t.data64F[0], t.data64F[1], t.data64F[2]]))

    return {R, t}

}

// 検算
function verifyProjectionCalc(coordinate, coordinateSystem, R, t, cameraMatrix) {

    let worldPoint = coordinate.worldCoordinate;
    if (coordinateSystem == "Three.js") {
        worldPoint = ConvertCoordinateThreeJsToUnrealEngine(worldPoint);
    }

    let screenPoint = coordinate.screenCoordinate;


    const xyz = cv.matFromArray(1, 3, cv.CV_64FC1, worldPoint)
    const xyz_ = cv.matFromArray(3, 1, cv.CV_64FC1, worldPoint)
    
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

    console.log(worldPoint)

    const uvz_est_data = uvz_est.data64F
    console.log("calc2D", [uvz_est_data[0]/uvz_est_data[2], uvz_est_data[1]/uvz_est_data[2] ])
    console.log("ans2D", screenPoint)

}