import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';
import { SidePanelManager } from './SidePanelManager.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

import * as gradientDescent from '../tests/gradientDescent.js'

/**
 * ユーザー操作関連のモデルクラス
 */
 export class OperationManager {

    constructor(sceneManager) {

        this.sceneManager = sceneManager;
        this.modelingManager = new ModelingManager(sceneManager);

        this.cursorMode = "orbit"

        this.controlPanel = new SidePanelManager(this);
        this.changeCursorMode(this.cursorMode);

        this.view = sceneManager.renderer.domElement;
        this.addEventListener();

    }

    addEventListener() {

        // イベントリスナーの登録
        document.getElementById("mainView").addEventListener('click', (e) => { this.onClickEvent(e) }, false);
        document.getElementById("mainView").addEventListener('mousemove', (e) => { this.onMoveEvent(e) }, false);
        document.getElementById("mainView").addEventListener('keydown', (e) => { this.onKeydownEvent(e) }, false);
    
    }

    generateRaycasterMousePos(e) {

        const element = e.target;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        const x = e.pageX - $("#mainCanvas").offset().left;
        const y = e.pageY - $("#mainCanvas").offset().top;

        return new THREE.Vector2(
            (x / width) * 2 - 1,
            -(y / height) * 2 + 1
        )

    }

    changeCursorMode(mode = "orbit") {

        this.controlPanel.changeCursorModeButtonColor(mode);

        // 元のモードのアクションを終了させる
        switch (this.cursorMode) {

            case "orbit":

                this.sceneManager.orbit.enabled = false;
                this.controlPanel.disableOrbitMode();
                break;

            case "construction":

                this.controlPanel.castleEditTab.content.disableConstructionMode();
                break;

            case "addHafu":

                this.controlPanel.castleEditTab.content.disableAddHafuMode();
                break;

            case "2DFix":

                this.controlPanel.planeControlTab.content.disable2DFixMode();
                break;

            default:
                break;

        }

        // 引数の新しいモードのアクションを開始する
        switch (mode) {

            case "orbit":

                this.sceneManager.orbit.enabled = true;
                this.controlPanel.enableOrbitMode();
                $(this.sceneManager.renderer.domElement).css('cursor', 'grab');
                break;

            case "construction":

                this.controlPanel.castleEditTab.content.enableConstructionMode();
                $(this.sceneManager.renderer.domElement).css('cursor', 'crosshair');
                break;

            case "addHafu":

                this.controlPanel.castleEditTab.content.enableAddHafuMode();
                $(this.sceneManager.renderer.domElement).css('cursor', 'pointer');
                break;

            case "2Dfix":

                this.controlPanel.planeControlTab.content.enable2DFixMode();
                $(this.sceneManager.renderer.domElement).css('cursor', 'crosshair');
                break;

        }

        this.cursorMode = mode;

    }

    onMoveEvent(e) {

        const x = e.pageX - $("#mainCanvas").offset().left;
        const y = e.pageY - $("#mainCanvas").offset().top;
		const mousePos = new THREE.Vector2(x, y)

        if (this.cursorMode == "construction") {

            this.controlPanel.castleEditTab.content.onMoveEvent(mousePos);       

        } else if (this.cursorMode == "2Dfix") {

            this.controlPanel.planeControlTab.content.onMoveEvent(mousePos); 


        } else if (this.cursorMode == "addHafu") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.selectYaneComponent(raycasterMousePos);

        }

    }

    onClickEvent(e) {

        const x = e.pageX - $("#mainCanvas").offset().left;
        const y = e.pageY - $("#mainCanvas").offset().top;
		const mousePos = new THREE.Vector2(x, y)

        if (this.cursorMode == "construction") {

            this.controlPanel.castleEditTab.content.onClickEvent(mousePos);       

        } else if (this.cursorMode == "addHafu") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.determineYaneComponent(raycasterMousePos);
        
        } else if (this.cursorMode == "2Dfix") {

            this.controlPanel.planeControlTab.content.onClickEvent(mousePos);       

        }
    }

    onKeydownEvent(e) {

		switch ( e.code ) {
            
			case 'KeyA': // A
                let createAllModel = this.modelingManager.createPresetModel();
                if (createAllModel) this.cursorInfo.count = 10;
                break;

            case 'KeyB': // B
                exportToObj(this.sceneManager);

                function exportToObj(sceneManager) {

                    const exporter = new OBJExporterWithMtl("castle");

                    sceneManager.scene.remove(sceneManager.sky);

                    const result = exporter.parse( sceneManager.scene );

                    sceneManager.scene.add(sceneManager.sky);

                    console.log(result.obj)
                    console.log(result.mtl)

                    var objblob = new Blob([result.obj], {"type": "text/plain"});
                    var mtlblob = new Blob([result.mtl], {"type": "text/plain"});

                    if (window.navigator.msSaveBlob) { 
                        window.navigator.msSaveBlob(objblob, "castle.obj");
                        window.navigator.msSaveBlob(mtlblob, "castle.mtl");
                        // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
                        window.navigator.msSaveOrOpenBlob(objblob, "castle.obj"); 
                        window.navigator.msSaveOrOpenBlob(mtlblob, "castle.mtl"); 
                    } else {
                        document.getElementById("objExport").href = window.URL.createObjectURL(objblob);
                        document.getElementById("mtlExport").href = window.URL.createObjectURL(mtlblob);
                    }

                }
                break;

            case 'KeyD':
                this.modelingManager.castle.setYaneColor("0x638A72");
                break;

            case 'KeyI':
                
                gradientDescent.gradientDescentCameraParameter();

                break;

            case 'KeyJ':

                let calcError = () => {
                    let errorRate = gradientDescent.calcError("rate");
                    console.log(errorRate)
                }
                gradientDescent.calcErrorbind = calcError.bind(this);
                this.sceneManager.orbit.addEventListener('change', this.calcErrorbind)

                const errorRawData = gradientDescent.calcError()

                gradientDescent.downloadFile(errorRawData, "errorData.json")

                break;

            case 'KeyK':

                const sceneData = gradientDescent.generatePixelData();
                gradientDescent.downloadFile(sceneData, "sceneData.json")

                break;

            case 'KeyM':
                if (this.cursorMode == "orbit") {
                    this.changeClickMode("construction")
                } else if (this.cursorMode == "construction") {
                    this.changeClickMode("addHafu")
                } else if (this.cursorMode == "addHafu") {
                    this.changeClickMode("orbit")
                }
                break;

            case 'KeyP':
                console.log("camera info:", this.sceneManager.currentCamera);
                console.log("camera pos:", this.sceneManager.currentCamera.position);
                console.log("camera rot:", this.sceneManager.currentCamera.rotation);
                console.log("focal length:", this.sceneManager.currentCamera.getFocalLength());
                console.log("display size:", this.sceneManager.renderer.getSize(new THREE.Vector2()));
                console.log("target:", this.sceneManager.orbit.target);
                
                // this.modelingManager.createAutoFloor();
                console.log(this.modelingManager.clickPosition)
                break;

            case 'KeyS':
                gradientDescent.gradientDescentPrototype2();
                break;

            case 'KeyW':
                this.modelingManager.removeWallTexture();
                break;
        }

    }

}