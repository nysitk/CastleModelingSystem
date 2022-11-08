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

        this.cursorInfo = {
            count2D: 0,
            mode: "orbit"
        }

        this.controlPanel = new SidePanelManager(this);
        this.changeCursorMode(this.cursorInfo.mode);

        this.view = sceneManager.renderer.domElement;
        this.addEventListener(this.view);

        this.is2DfixEnabled = true;
        this.draggablePoint = new Array(4);

    }

    addEventListener(view) {

        // イベントリスナーの登録
        view.addEventListener('click', (e) => { this.onClickEvent(e) }, false);
        view.addEventListener('mousemove', (e) => { this.onMoveEvent(e) }, false);
        view.addEventListener('keydown', (e) => { this.onKeydownEvent(e) }, false);
    
    }

    generateRaycasterMousePos(e) {

        const element = e.target;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        return new THREE.Vector2(
            (e.offsetX / width) * 2 - 1,
            -(e.offsetY / height) * 2 + 1
        )

    }

    changeCursorMode(mode = "orbit") {

        this.controlPanel.changeCursorModeButtonColor(mode);
        this.cursorInfo.mode = mode;

        this.sceneManager.orbit.enabled = false;
        this.controlPanel.disableOrbit();

        switch (mode) {

            case "orbit":

                this.sceneManager.orbit.enabled = true;
                this.controlPanel.enableOrbit();
                $('#mainView').css('cursor', 'grab');
                break;

            case "construction":

                $('#mainView').css('cursor', 'crosshair');
                break;

            case "edit":

                $('#mainView').css('cursor', 'default');
                break;

            case "2Dfix":

                $('#mainView').css('cursor', 'crosshair');
                break;

        }

    }

    onMoveEvent(e) {

		const mousePos = new THREE.Vector2(e.offsetX, e.offsetY)

        if (this.cursorInfo.mode == "construction") {

            this.controlPanel.castleEditTab.content.onMoveEvent(mousePos);       

        } else if (this.cursorInfo.mode == "2Dfix") {

            if (this.is2DfixEnabled) this.modelingManager.createAllLineFrom2D(this.cursorInfo.count2D);

        } else if (this.cursorInfo.mode == "edit") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.selectYaneComponent(raycasterMousePos);

        }

    }

    onClickEvent(e) {

		const mousePos = new THREE.Vector2(e.offsetX, e.offsetY)

        if (this.cursorInfo.mode == "construction") {

            this.controlPanel.castleEditTab.content.onClickEvent(mousePos);       

        } else if (this.cursorInfo.mode == "edit") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.determineYaneComponent(raycasterMousePos);
        
        } else if (this.cursorInfo.mode == "2Dfix") {

            if (this.cursorInfo.count2D < 4)
            this.addDraggablePoint(mousePos, this.cursorInfo.count2D);

            switch (this.cursorInfo.count2D) {

                case 0:

                    this.cursorInfo.count2D++;

                    let createAllLineFrom2D = () => {
                        this.modelingManager.createAllLineFrom2D(4);
                    }

                    this.createAllLineFrom2Dbind = createAllLineFrom2D.bind(this);
                    this.sceneManager.orbit.addEventListener('change', this.createAllLineFrom2Dbind)
                    
                    break;

                case 1:

                    this.cursorInfo.count2D++;
                    break;

                case 2:

                    this.cursorInfo.count2D++;
                    break;

                case 3:

                    this.cursorInfo.count2D++;
                    this.changeCursorMode("orbit");

                    break;

            }

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
                if (this.cursorInfo.mode == "orbit") {
                    this.changeClickMode("construction")
                } else if (this.cursorInfo.mode == "construction") {
                    this.changeClickMode("edit")
                } else if (this.cursorInfo.mode == "edit") {
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

    

    addDraggablePoint(mousePos, count2D) {

        const draggablePoint = new DraggablePoint(mousePos.x, mousePos.y, count2D);
        this.draggablePoint[count2D] = draggablePoint;
        draggablePoint.operationManager = this;
        draggablePoint.modelingManager = this.modelingManager;
        draggablePoint.add()

        return draggablePoint;

    }

    disable2DFix() {
        this.is2DfixEnabled = false;
        this.modelingManager.castle.removeAllLine();
        this.draggablePoint.map((p) => { 
            p.remove();
            p = null 
        })
        this.sceneManager.orbit.removeEventListener('change', this.createAllLineFrom2D)
    }
}


/**
 * 2Dfixモードでクリックしたときに、基準点（P1～P4）の画素座標を保持する
 */ 
export class DraggablePoint {

    constructor(x, y, clickCount) {

		this.mousePos = new THREE.Vector2(x, y);
        this.clickCount = clickCount ? clickCount : 0;
        this.isDragging = false;

    }

    add(name = "position2D") {

        this.modelingManager.set2DPosition(this.clickCount, this.mousePos)
        
        this.domElement = $("<div id='" + name + "-" + this.clickCount + "' class='" + name + "'></div>");
        $("body").append(this.domElement);
        this.changePosition(this.mousePos.x, this.mousePos.y)

        this.domElement.on('mousedown', e => { 
            console.log(this)
            this.isDragging = true;
        });

        $("body").on('mousemove', e => {

            if (this.isDragging === true) {
                
                this.mousePos.x = e.clientX;
                this.mousePos.y = e.clientY;
                this.changePosition(this.mousePos.x, this.mousePos.y)
                this.modelingManager.set2DPosition(this.clickCount, this.mousePos)
                this.modelingManager.createAllLineFrom2D(4);
            }

        });
          
        this.domElement.on('mouseup', e => {
            if (this.isDragging === true) {
                this.isDragging = false;
            }
        });

    }

    changePosition(x, y) {

        $(this.domElement).offset({ top: y, left: x });
        $(this.domElement).css( { transform: 'translate(-50%, -50%)' } );

    }

    remove() {

        this.domElement.remove();

    }
    
}