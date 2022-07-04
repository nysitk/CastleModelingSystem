import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';
import { ControlPanelManager } from './ControlPanelManager.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

/**
 * ユーザー操作関連のモデルクラス
 */
 export class OperationManager {
    constructor(sceneManager) {

        this.sceneManager = sceneManager;
        this.modelingManager = new ModelingManager(sceneManager);

        this.cursorInfo = {
            count: 0,
            count2D: 0,
            mode: "orbit"
        }

        this.controlPanel = new ControlPanelManager(this);
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
            (e.clientX / width) * 2 - 1,
            -(e.clientY / height) * 2 + 1
        )
    }

    changeCursorMode(mode) {
        this.controlPanel.changeCursorModeButtonColor(mode);
        this.cursorInfo.mode = mode;

        switch (mode) {
            case "orbit":
                this.sceneManager.orbit.enabled = true;
                $('html,body').css('cursor', 'grab');
                break;

            case "construction":
                this.sceneManager.orbit.enabled = false;
                $('html,body').css('cursor', 'crosshair');
                break;

            case "edit":
                this.sceneManager.orbit.enabled = false;
                $('html,body').css('cursor', 'default');
                break;

            case "2Dfix":
                this.sceneManager.orbit.enabled = false;
                $('html,body').css('cursor', 'crosshair');
                break;
        }
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
                // this.modelingManager.createYaguraPolygon(mousePos);
                this.modelingManager.createYaguraLine(mousePos);
                this.modelingManager.createYaneLine(mousePos);
                break;
        }

        if (this.cursorInfo.mode == "2Dfix") {

            if (this.is2DfixEnabled) this.modelingManager.createAllLineFrom2D(this.cursorInfo.count2D);

        }

        if (this.cursorInfo.mode == "edit") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.selectYaneComponent(raycasterMousePos);

        }

        this.sceneManager.render();
    }

    onClickEvent(e) {

        if (this.cursorInfo.mode == "construction") {

            this.modelingManager.determineClickPosition(e, this.cursorInfo.count);
            
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
                    this.modelingManager.displayClickPosition();
                    break;
            }

        } else if (this.cursorInfo.mode == "edit") {

            const raycasterMousePos = this.generateRaycasterMousePos(e)
            this.modelingManager.determineYaneComponent(raycasterMousePos);
        
        } else if (this.cursorInfo.mode == "2Dfix") {

            if (this.cursorInfo.count2D < 4)
            this.addDraggablePoint(e, this.cursorInfo.count2D);

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
                    this.changeCursorMode("orbit")
                    break;
            }

        }

        this.sceneManager.render();
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

            case 'KeyJ':

                const rawData = this.generateAllJsonData();
                console.log(rawData)
                
                const canvas = document.getElementById("backgroundCanvas");
                const context = canvas.getContext("2d");

                const editorArray = new Array();
                const imageArray = new Array();
                const errorArray = new Array();

                for (let y = 0; y < rawData.height; y++) {

                    for (let x = 0; x < rawData.width; x++) {
        
                        let editorData = rawData.array[x + y * rawData.width];
                        let imageData = context.getImageData(x, y, 1, 1);

                        let editorR = (editorData.r > 255) ? 255 : editorData.r;
                        let editorG = (editorData.g > 255) ? 255 : editorData.g;
                        let editorB = (editorData.b > 255) ? 255 : editorData.b;
                        let editorA = (editorData.a > 255) ? 255 : editorData.a;

                        editorArray.push({r:editorR,g:editorG,b:editorG,a:editorA})
                        imageArray.push({r:imageData.data[0],g:imageData.data[1],b:imageData.data[2],a:imageData.data[3]})

                        let errorR = editorR != imageData.data[0]
                        let errorG = editorG != imageData.data[1]
                        let errorB = editorB != imageData.data[2]
                        let errorA = editorA != imageData.data[3]
                        
                        let error = (errorR | errorG | errorB | errorA);

                        let pix = (error) ? {r:255,g:0,b:0,a:255} : {r:255,g:255,b:255,a:255}

                        errorArray.push(pix)

                    }
        
                }

                console.log(editorArray)
                console.log(imageArray)
                
                const errorRawData = {
                    width: rawData.width,
                    height: rawData.height,
                    array: errorArray
                }

                this.downloadFile(errorRawData, "errorData.json")

                break;

            case 'KeyK':

                const rawData2 = this.generateAllJsonData();
                this.downloadFile(rawData2, "imageData.json")

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
                this.modelingManager.removeWallTexture();
        }

    }

    getPixelBuffer(renderTarget, width, height) {

        const pixelBuffer = new Float32Array( width * height * 4 );
        this.sceneManager.renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, pixelBuffer );

        return pixelBuffer;
    }

    changeBufferToJson(pixelBuffer, width, height) {
        const imageArray = new Array();

        for (let y = height - 1; y >= 0; y--) {

            for (let x = 0; x < width; x++) {

                let p = getPixel(pixelBuffer, x, y, width, height);
                imageArray.push(p);

            }

        }

        return imageArray;

        function getPixel(pixels, x, y, width, height) {
            const pos = x + y * width;
            const head = pos * 4;

            const r = pixels[head] * 255;
            const g = pixels[head+1] * 255;
            const b = pixels[head+2] * 255;
            const a = pixels[head+3] * 255;

            return {r, g, b, a}

        }
    }

    generateAllJsonData() {
        const renderTarget = this.sceneManager.renderTarget
        this.sceneManager.renderer.setRenderTarget( renderTarget );
        this.sceneManager.renderer.render( this.sceneManager.scene, this.sceneManager.currentCamera );

        let width = renderTarget.width;
        let height = renderTarget.height;

        const pixelBuffer = this.getPixelBuffer(renderTarget, width, height)
        const imageArray = this.changeBufferToJson(pixelBuffer, width, height);
        
        return {
            width: width,
            height: height,
            array: imageArray
        }

    }

    downloadFile(rawData, fileName) {
        const data = JSON.stringify(rawData);
        const link = document.createElement("a");
        link.href = "data:text/plain," + encodeURIComponent(data);
        link.download = fileName;
        link.click();
    }

    addDraggablePoint(e, count2D) {
        const draggablePoint = new DraggablePoint(e, count2D);
        this.draggablePoint[count2D] = draggablePoint;
        draggablePoint.operationManager = this;
        draggablePoint.modelingManager = this.modelingManager;
        draggablePoint.add()

        return draggablePoint;
    }

    disable2DFix() {
        console.log("1")
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
class DraggablePoint {
    constructor(e, clickCount) {
		this.mousePos = new THREE.Vector2(e.clientX, e.clientY)
        this.clickCount = clickCount
        this.isDragging = false;
    }

    add() {
        this.modelingManager.set2DPosition(this.clickCount, this.mousePos)
        
        this.domElement = $("<div id='position2D-" + this.clickCount + "' class='position2D'></div>");
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