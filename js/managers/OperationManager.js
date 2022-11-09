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

}