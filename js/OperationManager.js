import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';

import { OBJExporter, OBJExporterWithMtl } from './controls/OBJExporter.js';

/**
 * 城郭モデル生成関連のモデルクラス
 */
 export class OperationManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.modelingManager = new ModelingManager(sceneManager);

        this.cursorInfo = {
            count: 0,
            mode: "orbit"
        }

        this.initCursorMode();

        this.view = sceneManager.renderer.domElement;

        // イベントリスナーの登録
        this.view.addEventListener('click', (e) => { this.onClickEvent(e) }, false);
        this.view.addEventListener('mousemove', (e) => { this.onMoveEvent(e) }, false);
        this.view.addEventListener('keydown', (e) => { this.onKeydownEvent(e) }, false);
    }

    initCursorMode() {
        $("#modeButton > li").each(function(i, button) {
            button.addEventListener('click', (e) => { this.clickCursorModeButton(e) }, false)
        }.bind(this));

        this.changeCursorMode("orbit");
    }

    clickCursorModeButton(e){
        // $('#modeButton > li').removeClass('is-active')
        // $(e.target).addClass('is-active');
        const mode = $(e.target).attr('id')
        this.changeCursorMode(mode);
    };

    changeCursorModeButtonColor(mode) {
        $('#modeButton > li').removeClass('is-active')
        $("#modeButton > #" + mode).addClass('is-active');
    }

    changeCursorMode(mode) {
        this.changeCursorModeButtonColor(mode)
        console.log(mode)
        switch (mode) {
            case "orbit":
                this.cursorInfo.mode = "orbit"
                this.sceneManager.orbit.enabled = true;
                $('html,body').css('cursor', 'grab');
                break;
            case "construction":
                this.cursorInfo.mode = "construction"
                this.sceneManager.orbit.enabled = false;
                $('html,body').css('cursor', 'crosshair');
                break;
            case "edit":
                this.cursorInfo.mode = "edit"
                this.sceneManager.orbit.enabled = false;
                $('html,body').css('cursor', 'default');
                break;
        }
    }

    generateRaycasterMousePos(e) {
        const element = e.target;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        return new THREE.Vector2(
            (e.clientX / width) * 2 - 1,
            -(e.clientY / height) * 2 + 1
        )
    }

    onMoveEvent(e) {
		const mousePos = new THREE.Vector2(e.clientX, e.clientY)
        
        switch (this.cursorInfo.count) {
            case 0:
                break;
            case 1:
                this.modelingManager.createBottomRectangleLine(mousePos);
                break;
            case 2:
                this.modelingManager.createIshigakiLine(mousePos);
                break;
            case 3:
                this.modelingManager.createYaguraLine(mousePos);
                this.modelingManager.createYaneLine(mousePos);
                break;
        }

        if (this.cursorInfo.mode == "edit") {
            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.selectYaneComponent(raycasterMousePos);
        }

        this.sceneManager.render();
    }

    onClickEvent(e) {
        this.modelingManager.determineClickPosition(e, this.cursorInfo.count);

        if (this.cursorInfo.mode == "construction") {
            switch (this.cursorInfo.count) {
                case 0:
                    this.cursorInfo.count++;
                    break;
                case 1:
                    this.cursorInfo.count++;
                    break;
                case 2:
                    this.modelingManager.removeBottomRectangleLine();
                    this.modelingManager.removeIshigakiLine();
                    this.modelingManager.createIshigakiPolygon();
                    this.cursorInfo.count++;
                    break;
                case 3:
                    this.modelingManager.removeYaguraLine();
                    this.modelingManager.removeYaneLine();
                    this.modelingManager.createYaguraPolygon();
                    this.modelingManager.createYanePolygon();
                    this.cursorInfo.count++;
                    this.changeCursorMode("orbit")
                    break;
            }
        } else if (this.cursorInfo.mode == "edit") {
            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.determineYaneComponent(raycasterMousePos);
        }

        this.sceneManager.render();
    }

    onKeydownEvent(e) {

		switch ( e.code ) {
            
			case 'KeyA': // A
                this.modelingManager.createAllModel();
                this.cursorInfo.count = 10;
                break;

            case 'KeyB': // B
                exportToObj(this.sceneManager);

                function exportToObj(sceneManager) {

                    const exporter = new OBJExporter("castle");
                    sceneManager.scene.remove(sceneManager.sky);

                    const result = exporter.parse( sceneManager.scene );
                    console.log(result)
                    var objblob = new Blob([result], {"type": "text/plain"});
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
                    sceneManager.scene.add(sceneManager.sky);

                }
                break;

            case 'KeyM':
                if (this.cursorInfo.mode == "orbit") {
                    this.changeClickMode("construction")
                } else if (this.cursorInfo.mode == "construction") {
                    this.changeClickMode("edit")
                } else if (this.cursorInfo.mode == "edit") {
                    this.changeClickMode("orbit")
                }
                break;

            case 'KeyP':
                console.log(this.sceneManager.currentCamera);
                console.log(this.sceneManager.currentCamera.getFocalLength());
                console.log(this.sceneManager.renderer.getSize());
                
                this.modelingManager.createAutoFloor();
                console.log(this.modelingManager.referencePoint.ishigakiBottom)
                break;
        }

    }
}