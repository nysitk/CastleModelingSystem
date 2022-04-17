import * as THREE from '/build/three.module.js';

import { CastleModelManager } from './CastleModelManager.js';
import { ModelingSupporter } from './ModelingSupporter.js'

import { ModelPresets } from '../models/ModelPresets.js'
import { PARAMS } from './Params.js';

/**
 * 城郭モデル生成関連のモデルクラス
 */
 export class ModelingManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.clickPosition = new Array(4);
        this.referencePoint = {
            ishigakiBottom: new Array(2),
            ishigakiTop: new Array(2),
            yaguraTop: new Array(2),
        };
        this.castle = new CastleModelManager(this.referencePoint, sceneManager);
    }

    addTestMesh(x, y, z) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(3, 3, 3), new THREE.MeshNormalMaterial());
        mesh.position.set(x, y, z)
        this.sceneManager.scene.add(mesh);
    }

    /**
     * カメラ位置からカーソル位置までの方向ベクトルを算出
     * @param mouseX - マウス位置のx座標
     * @param mouseY - マウス位置のy座標
	 * @returns {THREE.Vector3} - 方向ベクトル
     */
    calcCameraToMouceRayVec(mouseX, mouseY) {
        const currentCamera = this.sceneManager.currentCamera;
        const rendererSize = this.sceneManager.renderer.getSize(new THREE.Vector2());
        const orbit = this.sceneManager.orbit;

		// 上向きベクトル算出
		const t = new THREE.Vector3(0, 1, 0).applyMatrix4(currentCamera.matrixWorld);

		// カメラの位置から注視点位置を引き、正規化
		const w = new THREE.Vector3().subVectors(currentCamera.position, orbit.target).normalize();
		// wとカメラの上向きベクトルの外積を計算し、正規化
		const u = new THREE.Vector3().crossVectors(w, t).normalize();
		// uとwの外積を計算し、正規化
		const v = new THREE.Vector3().crossVectors(u, w).normalize();

		// 視点座標系の軸ベクトル
		const axisVec = new THREE.Vector3(u, v, w);

        const xs = ((mouseX + 0) - rendererSize.x / 2.0) / rendererSize.y;
        const ys = ((mouseY + 0) - rendererSize.y / 2.0) / rendererSize.y;
        const delta_y = 2 * Math.tan(currentCamera.fov / 2 * Math.PI / 180);

        const xs_dy_u = new THREE.Vector3().copy(u).multiplyScalar(xs * delta_y);
        const ys_dy_v = new THREE.Vector3().copy(v).multiplyScalar(ys * delta_y);

		// カメラ位置からカーソル位置までの方向ベクトル
		return new THREE.Vector3().copy(xs_dy_u).add(ys_dy_v).add(w);
    }

    /**
     * 「直線の始点から交点までの線分の長さ」に関する値を算出
     * @param {THREE.Vector3} startPoint - 開始点（基本的にカメラ位置）
     * @param {THREE.Vector3} parallelVec - 直線と平行なベクトル
     * @param {THREE.Vector3} planeNormal - 平面の法線ベクトル
     * @param {THREE.Vector3} pointOnPlane - 平面上の1点
	 * @see {@link http://www.etcnotes.info/almath/raycast_heimen.html、http://tau.doshisha.ac.jp/lectures/2008.intro-seminar/html.dir/node29.html}
	 * @returns {THREE.Vector3} 媒介変数t
     */
    calcCameraToPlaneParam(startPoint, parallelVec, planeNormal, pointOnPlane) {
        const numerator = planeNormal.x * (startPoint.x - pointOnPlane.x) + planeNormal.y * (startPoint.y - pointOnPlane.y) + planeNormal.z * (startPoint.z - pointOnPlane.z);
        const denominator = planeNormal.x * parallelVec.x + planeNormal.y * parallelVec.y + planeNormal.z * parallelVec.z;
        return -1 * numerator / denominator; 
    }

    /**
     * 平面とレイの交点を算出し、マウス位置に対応する3次元点を取得
     * @param {THREE.Vector3} startPoint - 開始点（基本的にカメラ位置）
     * @param {THREE.Vector2} mousePos - スクリーン上のマウス位置
     * @param {THREE.Vector3} planeNormal - 平面の法線ベクトル
     * @param {THREE.Vector3} pointOnPlane - 平面上の1点
     * @returns {THREE.Vector3} レイと平面の交点
     */
    calcPointOnRayPlaneIntersection(startPoint, mousePos, planeNormal, pointOnPlane) {
        const cameraToMouseRayVec = this.calcCameraToMouceRayVec(mousePos.x, mousePos.y);
        const cameraToPlaneParam = this.calcCameraToPlaneParam(startPoint, cameraToMouseRayVec, planeNormal, pointOnPlane)
        return new THREE.Vector3(
            cameraToMouseRayVec.x * cameraToPlaneParam + startPoint.x,
            cameraToMouseRayVec.y * cameraToPlaneParam + startPoint.y,
            cameraToMouseRayVec.z * cameraToPlaneParam + startPoint.z
        )
    }

    /**
     * マウス位置に対応する、地面上の点を算出
     * @param {THREE.Vector2} mousePos - スクリーン上のマウス位置
     * @returns {THREE.Vector3} マウス位置に対応する地面上の点
     */
    calcPointOnGround(mousePos) {
		const planeNormal = new THREE.Vector3(0, 1, 0); //平面の法線ベクトル
		const pointOnPlane = new THREE.Vector3(0, 0, 0); //平面上の1点
		return this.calcPointOnRayPlaneIntersection(
            this.sceneManager.currentCamera.position,
            mousePos,
            planeNormal,
            pointOnPlane
        ) 
    }

    /**
     * マウス位置に対応する、P1とP2を含み、底面に垂直な平面上の点を算出
     * @param {THREE.Vector2} mousePos - スクリーン上のマウス位置
     * @returns {THREE.Vector3} マウス位置に対応する点
     */
    calcPointOnNormalPlane(mousePos) {
        // 2点間方向ベクトル
        const directionVector = new THREE.Vector3(
            this.clickPosition[1].x - this.clickPosition[0].x,
            0,
            this.clickPosition[1].z - this.clickPosition[0].z
        )
        // 2点間の方向ベクトルの法線ベクトル
        const normalVector = new THREE.Vector3(-1 * directionVector.z, 0, directionVector.x)
        return this.calcPointOnRayPlaneIntersection(
            this.sceneManager.currentCamera.position,
            mousePos,
            normalVector,
            this.clickPosition[0]
        )
    }

    /**
     * クリックしたときに、基準点（P1～P4）を保持する
     */ 
    determineClickPosition(e, clickCount) {
		const mousePos = new THREE.Vector2(e.clientX, e.clientY)
        if (clickCount < 2) {
            // 1,2回目のクリックは、地面上の点
            this.clickPosition[clickCount] = this.calcPointOnGround(mousePos);
        } else if (clickCount < 4) {
            // 3,4回目のクリックは、1,2回目の点を通る、地面に垂直な平面上の点
            this.clickPosition[clickCount] = this.calcPointOnNormalPlane(mousePos);
        } else {
            return;
        }
        this.determineReferencePoint(clickCount);
        // this.addTestMesh(this.clickPosition[clickCount].x, this.clickPosition[clickCount].y, this.clickPosition[clickCount].z)
    }

    /**
     * 上側の平面が下側の平面より小さくなるように調整
     * @param {THREE.Vector3} newPos - マウス位置から算出された点の位置
     * @param {Array} bottom - 下側の平面の対角の2点が入った配列
     * @returns {THREE.Vector3} 調整された点
     */
    adjustUpperPoint(newPos, bottom) {
        newPos = newPos.clone();
        bottom[0] = bottom[0].clone();
        bottom[1] = bottom[1].clone();
        if (newPos.x > bottom[1].x) newPos.x = bottom[1].x;
        if (newPos.x < (bottom[0].x + bottom[1].x) / 2) {
            newPos.x = (bottom[0].x + bottom[1].x) / 2;
        }
        if (newPos.y < 0) newPos.y = 0;
        if (newPos.z < bottom[1].z) newPos.z = bottom[1].z;
        if (newPos.z > (bottom[0].z + bottom[1].z) / 2) {
            newPos.z = (bottom[0].z + bottom[1].z) / 2;
        }
        return newPos;
    }

    /**
     * 平面の対角の頂点を算出
     * @param {Array} top - 上側の平面の既に決定している点が1つ入った配列
     * @param {Array} bottom - 下側の平面の対角の2点が入った配列
     * @returns {THREE.Vector3} 調整された点
     */
    calcDiagonalPoint(top, bottom) {
        top[1] = top[1].clone();
        bottom[0] = bottom[0].clone();
        bottom[1] = bottom[1].clone();
        return new THREE.Vector3(
            bottom[1].x - (top[1].x - bottom[0].x),
            top[1].y,
            bottom[1].z - (top[1].z - bottom[0].z)
        );
    }

    /**
     * モデル生成で参照する点を保存
     */
    determineReferencePoint(clickCount) {
        const p = this.referencePoint;
        switch(clickCount) {
            case 0:
                p.ishigakiBottom[0] = this.clickPosition[0].clone();
                break;
            case 1:
                p.ishigakiBottom[1] = this.clickPosition[1].clone();
                break;
            case 2:
                p.ishigakiTop[1] = this.adjustUpperPoint(this.clickPosition[2], p.ishigakiBottom);
                p.ishigakiTop[0] = this.calcDiagonalPoint(p.ishigakiTop, p.ishigakiBottom);

                break;
            case 3:
                p.yaguraTop[1] = this.adjustUpperPoint(this.clickPosition[3], p.ishigakiTop);
                p.yaguraTop[0] = this.calcDiagonalPoint(p.yaguraTop, p.ishigakiTop)
                break;
        }
    }

    updateObject(obj) {
        obj.geometry.verticesNeedUpdate = true;
        obj.geometry.elementNeedUpdate = true;
        obj.geometry.computeFaceNormals();        
    }

    createBottomRectangleLine(mousePos) {
        if (!this.bottomRectangleLine) {
            this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFFFFFF}));
            this.sceneManager.scene.add(this.bottomRectangleLine)
        }

        const A = this.referencePoint.ishigakiBottom[0].clone();
        const B = mousePos ? this.calcPointOnGround(mousePos) : this.referencePoint.ishigakiBottom[1].clone();

        this.bottomRectangleLine.geometry.vertices = new ModelingSupporter().generateRectangleLine(A, B);
        this.updateObject(this.bottomRectangleLine)
    }

    createFloorLine() {
        this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFFFFFF}));
        const A = this.referencePoint.ishigakiBottom[0].clone();
        const B = this.referencePoint.ishigakiBottom[1].clone();

        this.bottomRectangleLine.geometry.vertices = new ModelingSupporter().generateRectangleLine(A, B);
        this.updateObject(this.bottomRectangleLine)

        this.sceneManager.scene.add(this.bottomRectangleLine)
    }

    removeBottomRectangleLine() {
        if (this.bottomRectangleLine) {
            this.sceneManager.scene.remove(this.bottomRectangleLine)
        }        
    }

    createIshigakiLine(mousePos) {
        this.createBottomRectangleLine();
        this.castle.createIshigakiLine(
            this.referencePoint.ishigakiBottom[0].clone(),
            this.referencePoint.ishigakiBottom[1].clone(),
            this.adjustUpperPoint(
                this.calcPointOnNormalPlane(mousePos).clone(),
                this.referencePoint.ishigakiBottom
            )
        );       
    }

    removeIshigakiLine() {
        this.castle.removeIshigakiLine();
    }

    createIshigakiPolygon() {
        this.castle.createIshigakiPolygon(
            this.referencePoint.ishigakiBottom[0].clone(),
            this.referencePoint.ishigakiBottom[1].clone(),
            this.referencePoint.ishigakiTop[1].clone()
        );
    }

    createYaguraLine(mousePos) {
        this.castle.createYaguraLine(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.adjustUpperPoint(
                this.calcPointOnNormalPlane(mousePos).clone(),
                this.referencePoint.ishigakiTop
            )
        );
    }

    removeYaguraLine() {
        this.castle.removeYaguraLine();
    }

    createYaguraPolygon(mousePos) {
        let p = undefined;
        if (this.referencePoint.yaguraTop[1]) p = this.referencePoint.yaguraTop[1].clone();
        if (mousePos) p = this.adjustUpperPoint(
            this.calcPointOnNormalPlane(mousePos).clone(),
            this.referencePoint.ishigakiTop
        );

        if (!p) return;

        this.castle.createYaguraPolygon(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            p
        );
    }
 
    createYaneLine(mousePos) {
        this.castle.createYaneLine(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.adjustUpperPoint(
                this.calcPointOnNormalPlane(mousePos).clone(),
                this.referencePoint.ishigakiTop
            )
        );        
    }

    removeYaneLine() {
        this.castle.removeYaneLine();
    }

    createYanePolygon() {
        this.castle.createYanePolygon(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.referencePoint.yaguraTop[1].clone()
        );
    }

    selectYaneComponent(mousePos) {
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mousePos, this.sceneManager.currentCamera);
        const allYaneBodyMesh = this.castle.getAllYaneBodyMesh();
        const intersects = raycaster.intersectObjects(allYaneBodyMesh);

        allYaneBodyMesh.map((mesh) => {
            if (intersects.length > 0 && mesh === intersects[0].object) {
                mesh.material.color.setHex(0x774444);
            } else {
                mesh.material.color.setHex(0x222227);	
            }
        })

        if (intersects.length > 0) {
            $('html,body').css('cursor', 'pointer');
        } else {
            $('html,body').css('cursor', 'default');	
        }
    }

    determineYaneComponent(mousePos) {
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mousePos, this.sceneManager.currentCamera);
        const allYaneBodyMesh = this.castle.getAllYaneBodyMesh();
        const intersects = raycaster.intersectObjects(allYaneBodyMesh);
        
        allYaneBodyMesh.map((mesh) => {
            if (intersects.length > 0 && mesh === intersects[0].object) {
                mesh.parent.createInitialChidoriHafu(this.sceneManager);	
            }
        })
    }

    createPresetModel() {
        let name = "matsumae"
        let modelPreset = ModelPresets[name];
        let camera = this.sceneManager.cameraPersp;

        // 画面(canvas)のサイズ変更
        if (modelPreset.rendererSize) {
            this.sceneManager.changeRendererSize(
                modelPreset.rendererSize.x,
                modelPreset.rendererSize.y
            );
            this.sceneManager.removeOnWindowResize();
        } else {
            this.sceneManager.addOnWindowResize();
        }

        // カメラの視野角の変更
        if (modelPreset.fov) camera.fov = modelPreset.fov

        // カメラ位置の変更
        if (modelPreset.cameraPos) {
            camera.position.set(
                modelPreset.cameraPos.x,
                modelPreset.cameraPos.y,
                modelPreset.cameraPos.z
            );
        }

        // カメラの回転の変更
        if (modelPreset.cameraRot) {
            camera.rotation.set(
                modelPreset.cameraRot._x,
                modelPreset.cameraRot._y,
                modelPreset.cameraRot._z
            );
        }

        // orbitの注視点の変更
        if (modelPreset.orbitTarget) {
            this.sceneManager.orbit.target.set(
                modelPreset.orbitTarget.x,
                modelPreset.orbitTarget.y,
                modelPreset.orbitTarget.z
            );
        }
        
        camera.updateProjectionMatrix();
        this.sceneManager.orbit.update();

        // 城モデルのクリック座標情報がない場合は終了
        if (!modelPreset.clickPosition) {
            this.sceneManager.render();
            return false;
        }

        // クリック座標情報を登録
        modelPreset.clickPosition.forEach((e, i) => {
            this.clickPosition[i] = new THREE.Vector3(e.x, e.y, e.z);
        });

        this.registerReferencePoint();
        this.createAllModel(modelPreset);

        this.sceneManager.render();

        return true;
    }

    registerReferencePoint() {
        const p = this.referencePoint;
        p.ishigakiBottom[0] = this.clickPosition[0].clone();
        p.ishigakiBottom[1] = this.clickPosition[1].clone();
        p.ishigakiTop[1] = this.adjustUpperPoint(this.clickPosition[2], p.ishigakiBottom);
        p.ishigakiTop[0] = this.calcDiagonalPoint(p.ishigakiTop, p.ishigakiBottom);
        p.yaguraTop[1] = this.adjustUpperPoint(this.clickPosition[3], p.ishigakiTop);
        p.yaguraTop[0] = this.calcDiagonalPoint(p.yaguraTop, p.ishigakiTop)
    }

    createAllModel(modelPreset) {
        if (modelPreset.yaguraSteps) 
            PARAMS.yaguraSteps = modelPreset.yaguraSteps;

        this.createIshigakiPolygon()
        this.createYaguraPolygon()
        this.createYanePolygon();
        this.castle.createHafuPreset(modelPreset.hafuName);
        this.castle.setWallTexture(modelPreset.wallTexture);
        this.castle.setYaneColor(modelPreset.yaneColor);
    }

    createAutoFloor() {
        this.clickPosition[0] = new THREE.Vector3(-200, 0, 125)
        this.clickPosition[1] = new THREE.Vector3(200, 0, -125)
        
        const p = this.referencePoint;
        p.ishigakiBottom[0] = this.clickPosition[0].clone();
        p.ishigakiBottom[1] = this.clickPosition[1].clone();

        this.createFloorLine();
    }

    displayClickPosition() {
        console.log(this.clickPosition);
    }
}