import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';
import { SidePanelManager } from './SidePanelManager.js';

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

    disableOrbit() {
            
            this.sceneManager.orbit.enabled = false;
            this.controlPanel.disableOrbitMode();
            $(this.sceneManager.renderer.domElement).css('cursor', 'default');

            this.cursorMode = undefined;

    }

    enableOrbit() {
            
            this.sceneManager.orbit.enabled = true;
            this.controlPanel.enableOrbitMode();
            $(this.sceneManager.renderer.domElement).css('cursor', 'grab');

            this.cursorMode = "orbit";

    }

    propOrbit() {

        if (this.cursorMode == "orbit") {

            this.disableOrbit();

        } else {

            this.enableOrbit();

        }

    }

    changeCursorMode(mode = "orbit") {

        this.controlPanel.changeCursorModeButtonColor(mode);

        // 元のモードのアクションを終了させる
        switch (this.cursorMode) {

            case "orbit":

                this.disableOrbit();
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

            case "planeEstimation":

                this.controlPanel.planeControlTab.content.disablePlaneEstimationMode();
                break;

            default:
                break;

        }

        // 引数の新しいモードのアクションを開始する
        switch (mode) {

            case "orbit":

                this.enableOrbit();
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

            case "planeEstimation":

                this.controlPanel.planeControlTab.content.enablePlaneEstimationMode();
                $(this.sceneManager.renderer.domElement).css('cursor', 'default');
                break;

        }

        this.cursorMode = mode;

    }

    onMoveEvent(e) {

        const x = e.pageX - $("#mainCanvas").offset().left;
        const y = e.pageY - $("#mainCanvas").offset().top;
		const mousePos = new THREE.Vector2(x, y)
		
        if (this.controlPanel?.sceneTab) {

			this.controlPanel.sceneTab.content.displayStatus(mousePos);

		}


        if (this.cursorMode == "construction") {

            this.controlPanel.castleEditTab.content.onMoveEvent(mousePos);       

        } else if (this.cursorMode == "addHafu") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.selectYaneComponent(raycasterMousePos);

        } else if (this.cursorMode == "2Dfix") {

            this.controlPanel.planeControlTab.content.onMove2DFixEvent(mousePos); 


        } else if (this.cursorMode == "planeEstimation") {

            // this.controlPanel.planeControlTab.content.onMovePlaneEstimationEvent(mousePos); 


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

            this.controlPanel.planeControlTab.content.onClick2DFixEvent(mousePos);       

        } else if (this.cursorMode == "planeEstimation") {

            // this.controlPanel.planeControlTab.content.onClickPlaneEstimationEvent(mousePos);       

        }
    }

}