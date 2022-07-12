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
                this.modelingManager.createYaguraPolygon(mousePos);
                // this.modelingManager.createYaguraLine(mousePos);
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

            case 'KeyI':
                
                this.gradientDescentCameraParameter();

                break;

            case 'KeyJ':

                let calcError = () => {
                    let errorRate = this.calcError("rate");
                    console.log(errorRate)
                }
                this.calcErrorbind = calcError.bind(this);
                this.sceneManager.orbit.addEventListener('change', this.calcErrorbind)

                const errorRawData = this.calcError()

                this.downloadFile(errorRawData, "errorData.json")

                break;

            case 'KeyK':

                const sceneData = this.generatePixelData();
                this.downloadFile(sceneData, "sceneData.json")

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
                this.gradientDescentPrototype2();
                break;

            case 'KeyW':
                this.modelingManager.removeWallTexture();
                break;
        }

    }

    gradientDescentCameraParameter() {

        // shimabara
        // const cameraPos = {
        //     "x": 400, //ans:241.72459748046273,
        //     "y": 0, //ans:72.8499912883189,
        //     "z": 390, //ans:387.9337030430132
        // }

        // const orbitTarget = {
        //     "x": 0.92,
        //     "y": 104.4,
        //     "z": 1.0
        // }

        const cameraPersp = this.sceneManager.cameraPersp
        const orbit = this.sceneManager.orbit

        const cameraPos = cameraPersp.position
        const orbitTarget = orbit.target

        const calcError = () => this.calcError("num")

        const alpha = 0.0001;
        const th = 300;

        let i = 0;
        let loopFlag = true;
        let prevError, nowError;
        const prevPos = new THREE.Vector3();
        const prevTarget = new THREE.Vector3();
        const difference = new THREE.Vector3();
        let min = Infinity

        const fn = function () {

            // カメラ位置の変更
            cameraPersp.position.set(
                cameraPos.x,
                cameraPos.y,
                cameraPos.z
            );
    
            // orbitの注視点の変更
            orbit.target.set(
                orbitTarget.x,
                orbitTarget.y,
                orbitTarget.z
            );
        
            cameraPersp.updateProjectionMatrix();
            orbit.update();

            // console.log(cameraPos.x, prevPos.x, nowError, prevError)
            nowError = calcError()

            if (i == 0) {
                prevError = nowError;

                prevPos.x = cameraPos.x;
                cameraPos.x += 0.001;

                prevPos.y = cameraPos.y;
                cameraPos.y += 0.001;

                prevPos.z = cameraPos.z;
                cameraPos.z += 0.001;

                prevTarget.x = orbitTarget.x;
                orbitTarget.x += 0.001;

                prevTarget.y = orbitTarget.y;
                orbitTarget.y += 0.001;

                prevTarget.z = orbitTarget.z;
                orbitTarget.z += 0.001;

                // カメラ位置の変更
                cameraPersp.position.set(
                    cameraPos.x,
                    cameraPos.y,
                    cameraPos.z
                );
        
                // orbitの注視点の変更
                orbit.target.set(
                    orbitTarget.x,
                    orbitTarget.y,
                    orbitTarget.z
                );
        
                cameraPersp.updateProjectionMatrix();
                orbit.update();

                nowError = calcError();
                
                i++;
                return;
            }

            if ( -th < difference && difference < th) loopFlag = false;
            if (nowError < th) loopFlag = false;

            if (nowError < min) min = nowError;

            console.log("cameraPos.x: " + cameraPos.x + " cameraPos.y: " + cameraPos.y + " cameraPos.z: " + cameraPos.z + ", ErrorNum: " + nowError)
            console.log("orbitTarget.x: " + orbitTarget.x + " orbitTarget.y: " + orbitTarget.y + " orbitTarget.z: " + orbitTarget.z + ", ErrorNum: " + nowError)

            difference.x = (nowError - prevError) / (cameraPos.x - prevPos.x);
            prevPos.x = cameraPos.x;
            cameraPos.x -= alpha * difference.x;
            if (cameraPos.x == prevPos.x) cameraPos.x += 0.1;

            difference.y = (nowError - prevError) / (cameraPos.y - prevPos.y);
            prevPos.y = cameraPos.y;
            cameraPos.y -= alpha * difference.y;
            if (cameraPos.y == prevPos.y) cameraPos.y += 0.1;

            difference.z = (nowError - prevError) / (cameraPos.z - prevPos.z);
            prevPos.z = cameraPos.z;
            cameraPos.z -= alpha * difference.z;
            if (cameraPos.z == prevPos.z) cameraPos.z += 0.1;

            difference.x = (nowError - prevError) / (orbitTarget.x - prevTarget.x);
            prevTarget.x = orbitTarget.x;
            orbitTarget.x -= alpha * difference.x;
            if (orbitTarget.x == prevTarget.x) orbitTarget.x += 0.1;

            difference.y = (nowError - prevError) / (orbitTarget.y - prevTarget.y);
            prevTarget.y = orbitTarget.y;
            orbitTarget.y -= alpha * difference.y;
            if (orbitTarget.y == prevTarget.y) orbitTarget.y += 0.1;

            difference.z = (nowError - prevError) / (orbitTarget.z - prevTarget.z);
            prevTarget.z = orbitTarget.z;
            orbitTarget.z -= alpha * difference.z;
            if (orbitTarget.z == prevTarget.z) orbitTarget.z += 0.1;

            // console.log(cameraPos, orbitTarget, nowError, min)

            prevError = nowError;

            if (i > 1000 || !loopFlag) clearInterval(id)
            i++;

        }

        const id = setInterval(fn, 0)

    }

    gradientDescentPrototype() {
        const alpha = 0.0001;
        const initX = 100;
        const th = 0.0000000001;
        const dx = 0.0001;
        const a = 1.00;
        const b = 2.00;
        const c = 3.00;

        function f(x) {
            return a*x*x + b*x + c;
        }

        function diff(x) {
            return ( f(x+dx) - f(x-dx) ) / (2.0*dx);
        }

        let x = initX;
        let loopFlag = true;
        let difference;

        console.log(x, f(x));

        while(loopFlag) {
            difference = diff(x);
            x -= alpha * difference;
            if ( -th < difference && difference < th) loopFlag = false;
            console.log(x, f(x));
        }

        console.log("x: " + x + " extremum: " + f(x));
    }

    gradientDescentPrototype2() {
        const alpha = 0.0001;
        const initX = 10;
        const th = 0.0000000001;
        const dx = 0.0001;
        const a = 1.00;
        const b = 2.00;
        const c = 3.00;

        function f(x) {
            return a*x*x + b*x + c;
        }

        function diff(x) {
            return ( f(x+dx) - f(x-dx) ) / (2.0*dx);
        }

        let x = initX;
        let loopFlag = true;
        let difference;

        let now, prev, prevX;
        let i = 0;

        console.log(x, f(x));

        while(loopFlag) {
            now = f(x)

            if (i == 0) {
                prev = now;
                prevX = x;
                x += 0.1;
                now = f(x);
                i++;
                continue;
            }

            difference = (now - prev) / (x - prevX);
            prevX = x;
            x -= difference* alpha;
            if ( -th < difference && difference < th) loopFlag = false;
            console.log(x, f(x));
            prev = now;

            i++
        }

        console.log("x: " + x + " extremum: " + f(x));
    }

    getPixelBuffer(renderTarget, width, height) {

        const pixelBuffer = new Uint8Array( width * height * 4 );
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

    adjustArrayDirection(pixelBuffer, width, height) {
        const imageArray = new Array();

        for (let y = height - 1; y >= 0; y--) {

            for (let x = 0; x < width; x++) {

                const pos = x + y * width;
                const head = pos * 4;

                imageArray.push(pixelBuffer[head]);
                imageArray.push(pixelBuffer[head+1]);
                imageArray.push(pixelBuffer[head+2]);
                imageArray.push(pixelBuffer[head+3]);

            }

        }

        return imageArray;

    }

    generatePixelData(type = "buffer") {

        const renderTarget = this.sceneManager.renderTarget
        this.sceneManager.renderer.setRenderTarget( renderTarget );
        this.sceneManager.renderer.render( this.sceneManager.scene, this.sceneManager.currentCamera );

        let width = renderTarget.width;
        let height = renderTarget.height;

        const pixelBuffer = this.getPixelBuffer(renderTarget, width, height)
        const adjustPixelBuffer = this.adjustArrayDirection(pixelBuffer, width, height);
        let buffer = Array.from(adjustPixelBuffer);

        if (type == "buffer")
            return {
                width: width,
                height: height,
                buffer: buffer
            }

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

    calcError(type = "json") {

        const rawData = this.generatePixelData("buffer");
        
        const canvas = document.getElementById("backgroundCanvas");
        const context = canvas.getContext("2d");

        const editorBuffer = rawData.buffer;
        const imageBuffer = context.getImageData(0, 0, canvas.width, canvas.height).data

        const errorBuffer = new Array();
        let errorNum = 0;

        if (editorBuffer.length != imageBuffer.length) {
            console.error("These canvases are not the same size.")
            return;
        }

        for (let i = 0; i < editorBuffer.length; i++) {
            let error = (editorBuffer[i] != imageBuffer[i]);

            if (type == "json") {
                let pix = (editorBuffer[i] - imageBuffer[i] + 255) / 2
                errorBuffer.push(pix)
            }

            if (error) errorNum++;
        }

        const errorRate = errorNum / editorBuffer.length;
        
        if (type == "json") {
            return {
                width: rawData.width,
                height: rawData.height,
                errorRate: errorRate,
                buffer: errorBuffer
            }
        } else if (type == "num") {
            return errorNum
        } else {
            return errorRate
        }

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