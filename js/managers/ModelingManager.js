import * as THREE from '/build/three.module.js';

import { CastleModelManager } from './CastleModelManager.js';
import { ModelingSupporter } from './ModelingSupporter.js'

import { ModelPresets } from '../models/ModelPresets.js'

/**
 * 城郭モデル生成関連のモデルクラス
 */
 export class ModelingManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;

        this.clickPosition = new Array(4);
        this.click2DPosition = new Array(4);

        this.referencePoint = {
            ishigakiBottom: new Array(2),
            ishigakiTop: new Array(2),
            yaguraTop: new Array(2),
        };

        this.PARAMS = {
            ishigakiSteps: 6,
            yaguraSteps: 5,
            yaneSizeRatio: new THREE.Vector3(1.0, 1.0, 1.0),
            yaneUpperPosition: 1.0,
            yaneLowerPosition: 1.0,
            seiRatio: 1.0,
            windowNum: 1.0,
            windowWidth: 1.0,
            hafu: []
        }

        this.castle = new CastleModelManager(this);
    }

    addTestMesh(x, y, z) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(3, 3, 3), new THREE.MeshNormalMaterial());
        mesh.position.set(x, y, z)
        this.sceneManager.scene.add(mesh);
    }    
    
    calcPointOnPlane(mousePos, plane) {
        
        const raycaster = new THREE.Raycaster();
        
        const rendererSize = this.sceneManager.renderer.getSize(new THREE.Vector2());
        const pointer = new THREE.Vector2(
            ( mousePos.x / rendererSize.x ) * 2 - 1,
            -( mousePos.y / rendererSize.y ) * 2 + 1
            );        
            
            raycaster.setFromCamera( pointer, this.sceneManager.currentCamera );
            const intersect = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
            
        if (intersect === null) console.error("There are no intersections");
        
        return intersect;
        
    }

    calcPointOnGround(mousePos) {

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        return this.calcPointOnPlane(mousePos, plane);

    }

    calcPointOnNormalPlane(mousePos, P1 = this.clickPosition[0], P2 = this.clickPosition[1]) {
        
        // 2点間方向ベクトル
        const vecP1P2 = new THREE.Vector3().subVectors(P2, P1);
        const vecP1O = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), P1);
        
        // 2点間方向ベクトルの法線ベクトル
        const normalVecP1P2 = new THREE.Vector3(-1 * vecP1P2.z, 0, vecP1P2.x).normalize();
        
        // 2点間を結ぶ直線と原点との距離
        const constant = ((new THREE.Vector3().crossVectors(vecP1P2, vecP1O).length()) / vecP1P2.length());

        // 2点を含み、地平面に垂直な平面
        const plane = new THREE.Plane(normalVecP1P2, constant);

        return this.calcPointOnPlane(mousePos, plane);

    }
    
    /**
     * クリックしたときに、基準点（P1～P4）を保持する
     */ 
    determineClickPosition(mousePos, clickCount) {
        
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
            this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFD7E00}));
            this.sceneManager.scene.add(this.bottomRectangleLine)
        }

        const A = this.referencePoint.ishigakiBottom[0].clone();
        const B = mousePos ? this.calcPointOnGround(mousePos) : this.referencePoint.ishigakiBottom[1].clone();

        console.log(A, B)
        this.bottomRectangleLine.geometry.vertices = new ModelingSupporter().generateRectangleLine(A, B);
        this.updateObject(this.bottomRectangleLine)
    }

    createFloorLine() {
        this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFD7E00}));
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
        let ishigakiTopPoint = this.referencePoint.ishigakiTop[1];

        if (mousePos) {
            ishigakiTopPoint = this.calcPointOnNormalPlane(mousePos).clone()
        }

        if (ishigakiTopPoint === undefined) {
            console.error("The coordinate of top of ishigaki is not determined.")
            return;
        }

        this.createBottomRectangleLine();
        this.castle.createIshigakiLine(
            this.referencePoint.ishigakiBottom[0].clone(),
            this.referencePoint.ishigakiBottom[1].clone(),
            this.adjustUpperPoint(
                ishigakiTopPoint,
                this.referencePoint.ishigakiBottom
            )
        );       
    }

    removeIshigakiLine() {
        this.castle.removeIshigakiLine();
    }

    createIshigakiPolygon(mousePos, type = "whole") {
        this.castle.createIshigakiPolygon(
            this.referencePoint.ishigakiBottom[0].clone(),
            this.referencePoint.ishigakiBottom[1].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            type
        );
    }

    createYaguraLine(mousePos) {
        let yaguraTopPoint = this.referencePoint.yaguraTop[1];

        if (mousePos) {
            yaguraTopPoint = this.calcPointOnNormalPlane(mousePos).clone()
        }

        if (yaguraTopPoint === undefined) {
            console.error("The coordinate of top of yagura is not determined.")
            return;
        }

        this.castle.createYaguraLine(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.adjustUpperPoint(
                yaguraTopPoint,
                this.referencePoint.ishigakiTop
            )
        );
    }

    removeYaguraLine() {
        this.castle.removeYaguraLine();
    }

    createYaguraPolygon(mousePos, type="whole") {
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
            p,
            type
        );
    }
 
    createYaneLine(mousePos) {
        let yaguraTopPoint = this.referencePoint.yaguraTop[1];

        if (mousePos) {
            yaguraTopPoint = this.calcPointOnNormalPlane(mousePos).clone()
        }

        if (yaguraTopPoint === undefined) {
            console.error("The coordinate of top of yagura is not determined.")
            return;
        }

        this.castle.createYaneLine(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.adjustUpperPoint(
                yaguraTopPoint,
                this.referencePoint.ishigakiTop
            )
        );        
    }

    removeYaneLine() {
        this.castle.removeYaneLine();
    }

    createYanePolygon(mousePos, type = "whole") {
        this.castle.createYanePolygon(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.referencePoint.yaguraTop[1].clone(),
            type
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

    createPresetModel(name, type) {

        name = (name) ? name : "osaka"
        type = (type) ? type : "whole"  //line, black, whole

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
        // if (modelPreset.cameraRot) {
        //     camera.rotation.set(
        //         modelPreset.cameraRot._x,
        //         modelPreset.cameraRot._y,
        //         modelPreset.cameraRot._z
        //     );
        // }

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

        //クリック座標情報を登録
        modelPreset.clickPosition.forEach((e, i) => {
            this.clickPosition[i] = new THREE.Vector3(e.x, e.y, e.z);
        });

        this.registerReferencePoint();
        this.createAllModel(modelPreset, type);

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

    createAllModel(modelPreset, type = "whole") {
        if (modelPreset) 
            this.castle.PARAMS.yaguraSteps = modelPreset.yaguraSteps;

        if (type === "line") {
            this.createIshigakiLine()
            this.createYaguraLine()
            this.createYaneLine();
        } else {
            this.createIshigakiPolygon(undefined, type)
            this.createYaguraPolygon(undefined, type)
            this.createYanePolygon(undefined, type);
        }

        if (modelPreset) {
            this.castle.createHafuPreset(modelPreset.hafuName);

            if (type == "whole") {
                console.log(modelPreset)
                this.castle.setWallTexture(modelPreset.wallTexture);
                this.castle.setYaneColor(modelPreset.yaneColor);
            }
        }
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

    set2DPosition(clickCount, mousePos) {
        this.click2DPosition[clickCount] = mousePos;
        console.log(this.click2DPosition)
    }

    createAllLineFrom2D(clickCount, type = "polygon", polygonType = "black") {

        if (clickCount > 0) {
            this.clickPosition[0] = this.calcPointOnGround(this.click2DPosition[0]);
            this.determineReferencePoint(0)
        }

        if (clickCount > 1) {
            this.clickPosition[1] = this.calcPointOnGround(this.click2DPosition[1]);
            this.determineReferencePoint(1)
            this.createBottomRectangleLine(this.click2DPosition[1]);
        }

        if (clickCount > 2) {
            this.clickPosition[2] = this.calcPointOnNormalPlane(this.click2DPosition[2]);
            this.determineReferencePoint(2)

            if (type == "polygon") {
                this.createIshigakiPolygon(this.click2DPosition[2], polygonType);
            } else {
                this.createIshigakiLine(this.click2DPosition[2]);
            }
        }

        if (clickCount > 3) {
            this.clickPosition[3] = this.calcPointOnNormalPlane(this.click2DPosition[3]);
            this.determineReferencePoint(3)

            if (type == "polygon") {
                this.createYaguraPolygon(this.click2DPosition[3], polygonType);
                this.createYanePolygon(this.click2DPosition[3], polygonType);
            } else {
                this.createYaguraLine(this.click2DPosition[3]);
                this.createYaneLine(this.click2DPosition[3]);
            }
        }

    }
}