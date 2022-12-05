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
            yaguraTop: new Array(2)

        };

        this.castle = new CastleModelManager(this);


        return this;

    }
    
    calcPointOnPlane(mousePos, plane) {

        if (!plane.isPlane) {

            console.error("Plane is not plane.");

            return;

        }
        
        const raycaster = new THREE.Raycaster();
        
        const rendererSize = this.sceneManager.renderer.getSize(new THREE.Vector2());

        const pointer = new THREE.Vector2(
            ( mousePos.x / rendererSize.x ) * 2 - 1,
            -( mousePos.y / rendererSize.y ) * 2 + 1
        );        
            
        raycaster.setFromCamera( pointer, this.sceneManager.currentCamera );

        let intersect = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
            
        if (intersect === null) {
            
            console.error("There are no intersections");

            intersect = new THREE.Vector3(0, 0, 0);

        }
        
        
        return intersect;
        
    }

    calcPointOnGround(mousePos) {

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);


        return this.calcPointOnPlane(mousePos, plane);

    }

    calcPointOnNormalPlane(mousePos, P1 = this.clickPosition[0], P2 = this.clickPosition[1]) {
    
        if (!P1.isVector3 || !P2.isVector3) {

            console.error("P1 or P2 is not Vector3.");
            return;

        }

        // 2点間方向ベクトル
        const vecP1P2 = new THREE.Vector3().subVectors(P2, P1);
        const vecP1O = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), P1);
        
        // 2点間方向ベクトルの法線ベクトル
        const normalVecP1P2 = new THREE.Vector3(-1 * vecP1P2.z, 0, vecP1P2.x).normalize();
        
        // 2点間を結ぶ直線と原点との距離
        const constant = (-(new THREE.Vector3().crossVectors(vecP1P2, vecP1O).y) / vecP1P2.length());

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

        return new THREE.Vector3(

            bottom[1].x - (top[1].x - bottom[0].x),
            top[1].y,
            bottom[1].z - (top[1].z - bottom[0].z)

        );

    }

    getCornerPoints(A, B) {

        return [
            A.clone(),
            new THREE.Vector3(B.x, (A.y + B.y) / 2, A.z),
            B.clone(),
            new THREE.Vector3(A.x, (A.y + B.y) / 2, B.z),
        ]

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

                // p.ishigakiTop[1] = this.adjustUpperPoint(this.clickPosition[2], p.ishigakiBottom);
                p.ishigakiTop[1] = this.clickPosition[2];
                p.ishigakiTop[0] = this.calcDiagonalPoint(p.ishigakiTop, p.ishigakiBottom);

                break;

            case 3:

                // p.yaguraTop[1] = this.adjustUpperPoint(this.clickPosition[3], p.ishigakiTop);
                p.yaguraTop[1] = this.clickPosition[3];
                p.yaguraTop[0] = this.calcDiagonalPoint(p.yaguraTop, p.ishigakiTop)

                break;

        }

    }

    adjustModelDirection() {

    }

    updateObject(obj) {

        obj.geometry.verticesNeedUpdate = true;
        obj.geometry.elementNeedUpdate = true;
        obj.geometry.computeFaceNormals();

    }

    createBottomRectangleLine() {

        if (!this.bottomRectangleLine) {

            this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFD7E00}));
            this.sceneManager.scene.add(this.bottomRectangleLine)

        }

        const A = this.referencePoint.ishigakiBottom[0].clone();
        const B = this.referencePoint.ishigakiBottom[1].clone();

        const adjustVertices = this.adjustDiagonalDirection(A, B);

        this.bottomRectangleLine.geometry.vertices = new ModelingSupporter().generateRectangleLine(adjustVertices.A, adjustVertices.B);
        
        this.updateObject(this.bottomRectangleLine);

        this.bottomRectangleLine.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), -adjustVertices.angle)
        this.bottomRectangleLine.position.set(A.x, A.y, A.z)

    }

    adjustDiagonalDirection(A, B, top) {

        A = A.clone();
        B = B.clone();
        
        B.sub(A);

        let angle = 0;
        
        if (B.x < 0 && B.z < 0) {

            angle = Math.PI * 3 / 2;

        } else if (B.x < 0 && B.z >= 0) {

            angle = Math.PI * 2 / 2;

        } else if (B.x >= 0 && B.z >= 0) {

            angle = Math.PI * 1 / 2;

        }

        B.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);


        let P3 = new THREE.Vector3(0, 0, 0);

        if (top) {

            top = top.clone()

            P3 = this.adjustUpperPoint(
            
                top.sub(A).applyAxisAngle(new THREE.Vector3(0,1,0), angle),
                [new THREE.Vector3(0,0,0), B]
            
            )

        }

        return {

            A: new THREE.Vector3(0,0,0),
            B: B,
            angle: angle,
            top: P3

        }


    }
    

    // createFloorLine() {
    //     this.bottomRectangleLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({color: 0xFD7E00}));
    //     const A = this.referencePoint.ishigakiBottom[0].clone();
    //     const B = this.referencePoint.ishigakiBottom[1].clone();

    //     this.bottomRectangleLine.geometry.vertices = new ModelingSupporter().generateRectangleLine(A, B);
    //     this.updateObject(this.bottomRectangleLine)

    //     this.sceneManager.scene.add(this.bottomRectangleLine)
    // }

    removeBottomRectangleLine() {

        if (this.bottomRectangleLine) {

            this.sceneManager.scene.remove(this.bottomRectangleLine)

        }   

    }

    createIshigaki(parameters) {

        let ishigakiTopPoint = this.referencePoint.ishigakiTop[1];

        if (!ishigakiTopPoint.isVector3) {
            
            console.error("The coordinate of top of ishigaki is not determined.");

            return;

        }


        this.createBottomRectangleLine();

        const A = this.referencePoint.ishigakiBottom[0].clone();
        const B = this.referencePoint.ishigakiBottom[1].clone();


        // 回転した状態の点を指定しても、正しくモデルが生成できるように調整
        const adjustVertices = this.adjustDiagonalDirection(A, B, ishigakiTopPoint)

        
        this.castle.createIshigaki(
            
            adjustVertices.A,
            adjustVertices.B,
            adjustVertices.top,
            parameters
            
        );

        this.castle.model.ishigaki.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), -adjustVertices.angle)
        this.castle.model.ishigaki.position.set(A.x, A.y, A.z)
    
    }

    removeIshigaki() {

        this.castle.removeIshigaki();

    }

    createYagura(parameters) {

        let yaguraTopPoint = this.referencePoint.yaguraTop[1];

        if (!yaguraTopPoint.isVector3) {

            console.error("The coordinate of top of yagura is not determined.");

            return;

        }


        this.removeYagura();

        const A = this.referencePoint.ishigakiTop[0].clone();
        const B = this.referencePoint.ishigakiTop[1].clone();

        const adjustVertices = this.adjustDiagonalDirection(A, B, yaguraTopPoint);
        
        this.castle.createYagura(
            
            adjustVertices.A,
            adjustVertices.B,
            adjustVertices.top,
            parameters
            
        );    

        this.castle.model.yagura.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), -adjustVertices.angle)
        this.castle.model.yagura.position.set(A.x, A.y, A.z)
        

    }

    removeYagura() {

        this.castle.removeYagura();

    }

    displayYaguraTopInfo(yagura = this.castle.model.yagura) {
        
        const topVertices = yagura.getYaguraVertices(this.castle.PARAMS.yagura.steps - 1)

        const point = topVertices.upper[1].clone().add(yagura.position);
        const screen = this.sceneManager.worldToScreenCoordinate(point, this.sceneManager.currentCamera);

        
        return {

            world: point,
            screen: screen

        }

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

    createPresetModel(name = "osaka", parameters = {}) {
        
        parameters.name = name;
        
        const modelPreset = ModelPresets[name];
        parameters.modelPreset = modelPreset;

        const camera = this.sceneManager.cameraPersp;


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
        

        this.sceneManager.orbit.update();
        
        camera.updateProjectionMatrix();
        

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


        this.createAllModel(parameters);

        
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

    createAllModel(parameters = {}) {

        if (!parameters.type) parameters.type = "polygon"
        if (!parameters.polygonType) parameters.polygonType = "whole";


        if (parameters.modelPreset) {

            this.castle.PARAMS.yagura.steps = parameters.modelPreset.yaguraSteps;
        
        }

        this.createIshigaki(parameters);
        this.createYagura(parameters);
        
        
        if (parameters.modelPreset) {

            this.castle.createHafuPreset(parameters);

            if (parameters.type == "polygon" && parameters.polygonType == "whole") {

                this.castle.setWallTexture(parameters);
                this.castle.setYaneColor(parameters);

            }

        }

    }

    displayClickPosition() {

        console.log(this.clickPosition);

    }

    display2DClickPosition() {

        const planeControlOutliner = document.getElementById("planeControlOutliner")

        planeControlOutliner.innerHTML = ""

        for (const point of this.click2DPosition) {

            if (!point?.isVector2) continue;

            const option = document.createElement('div');
            option.classList.add('option');

            option.innerHTML = point.x + ", " + point.y;
            
            planeControlOutliner.appendChild(option)

        }

    }

    set2DPosition(clickCount, mousePos) {

        this.click2DPosition[clickCount] = mousePos;

        this.display2DClickPosition();

    }

    createAllFrom2D(clickCount, parameters = {}) {
        
        if (!parameters.type) parameters.type = "line";
        // if (!parameters.type) parameters.type = "polygon";
        if (!parameters.polygonType) parameters.polygonType = "black";
        if (!parameters.topFloor) parameters.topFloor = false;
        

        if (clickCount > 0) {

            this.clickPosition[0] = this.calcPointOnGround(this.click2DPosition[0]);
            this.determineReferencePoint(0)

        }


        if (clickCount > 1) {

            this.clickPosition[1] = this.calcPointOnGround(this.click2DPosition[1]);
            this.determineReferencePoint(1)

            this.createBottomRectangleLine(parameters);

        }


        if (clickCount > 2) {

            this.clickPosition[2] = this.calcPointOnNormalPlane(this.click2DPosition[2]);
            this.determineReferencePoint(2)

            this.createIshigaki(parameters);

        }


        if (clickCount > 3) {

            this.clickPosition[3] = this.calcPointOnNormalPlane(this.click2DPosition[3]);
            this.determineReferencePoint(3)

            this.createYagura(parameters);

        }

    }
}