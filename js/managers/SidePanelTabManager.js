import * as THREE from '/build/three.module.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

import { ModelPresets } from '../models/ModelPresets.js'
import { PlaneControlTab } from './PlaneControlTab.js'

import * as gradientDescent from '../tests/gradientDescent.js'

export class Tab {

    constructor( sidePanelManager, name = "Object" ) {

        this.sidePanelManager = sidePanelManager;
        this.name = name;

        this.tabDom = document.getElementById(name + "Tab")
        this.contentDom = document.getElementById(name + "Content")

        this.tabDom.addEventListener( 'click', (e) => { 
            this.sidePanelManager.openTab(this);
        })
        this.operateContent(name);

        this.close();

        return this;

    }

    operateContent(name = "Object") {

        switch (name) {
            case "Scene":
                this.content = new SceneTab(this.sidePanelManager);
                break;

            case "CastleEdit":
                this.content = new CastleEditTab(this.sidePanelManager);
                break;

            case "PlaneControl":
                this.content = new PlaneControlTab(this.sidePanelManager);
                break;

            case "Test":
                this.content = new TestTab(this.sidePanelManager);
                break;
        
            default:
                break;
        }
        

    }

    open() {

        this.tabDom.classList.add("selected")
        this.contentDom.style["display"] = "block"

    }

    close() {

        this.tabDom.classList.remove("selected")
        this.contentDom.style["display"] = "none"

    }

}

class SceneTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager
        this.operationManager = sidePanelManager.operationManager;
        this.modelingManager = this.operationManager.modelingManager;
        this.sceneManager = this.operationManager.sceneManager;
        
        $("#logStatus").on('click', (e) => {
            this.logStatus();
        })

        $("#exportObj").on('click', (e) => {
            this.exportObj();
        })

    }

    displayStatus() {

        document.getElementById('sceneStatus').innerHTML = ""
        this.addStatusRow("camera info", this.sceneManager.currentCamera.position.x)

    }

    addStatusRow(name, param) {

        const dom = document.createElement( 'div' );
        dom.classList.add( 'row' );

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('name')
        nameSpan.innerHTML = name

        const paramSpan = document.createElement('span');
        paramSpan.innerHTML = param;

        dom.appendChild(nameSpan)
        dom.appendChild(paramSpan)

        document.getElementById('sceneStatus').appendChild(dom);

    }

    logStatus() {

        console.log("camera info:", this.sceneManager.currentCamera);
        console.log("camera pos:", this.sceneManager.currentCamera.position);
        console.log("camera rot:", this.sceneManager.currentCamera.rotation);
        console.log("focal length:", this.sceneManager.currentCamera.getFocalLength());
        console.log("display size:", this.sceneManager.renderer.getSize(new THREE.Vector2()));
        console.log("target:", this.sceneManager.orbit.target);
        
        console.log("click position:", this.modelingManager.clickPosition);

    }

    exportObj() {

        const sceneManager = this.sceneManager;
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

            const objLink = document.getElementById("objExport");
            objLink.href = window.URL.createObjectURL(objblob);
            objLink.click();

            const mtlLink = document.getElementById("mtlExport");
            mtlLink.href = window.URL.createObjectURL(mtlblob);
            mtlLink.click();

        }

    }

}

class CastleEditTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager
        this.operationManager = sidePanelManager.operationManager;
        this.modelingManager = this.operationManager.modelingManager;

        this.clickCount = 0;

        this.castleOutliner = document.getElementById("castleOutliner");
        
        $("#startConstruction").on('click', (e) => {
            this.operationManager.changeCursorMode("construction");
        })

        $("#addHafu").on('click', (e) => {
            this.operationManager.changeCursorMode("addHafu");
        })

        $("#changeRoofColor").on('click', (e) => {
            this.changeRoofColor();
        })

        $("#removeWallTexture").on('click', (e) => {
            this.modelingManager.removeWallTexture();
        })

        for (let name in ModelPresets) {
            $("#selectModelPreset").append("<option value='" + name + "'>" + name + "</option>")
        }

        $("#generatePresetModel").on('click', (e) => {
            this.generatePresetModel();
        })

    }

    enableConstructionMode() {

        this.changeSelectedRefPointClass(this.clickCount+1)
        $("#startConstruction").html("UNDER CONSTRUCTION");
        $("#startConstruction").attr("disabled", true);

    }

    disableConstructionMode() {

        this.removeAllSelectedRefPointClass();

        if (this.clickCount < 4) {
            
            $("#startConstruction").html("RESTART CONSTRUCTION");
            $("#startConstruction").attr("disabled", false);

        } else {

            $("#startConstruction").html("CONSTRUCTION COMPLETED");
            $("#startConstruction").attr("disabled", true);

        }

    }

    finishConstructionMode() {

        $("#addHafu").attr("disabled", false);
        $("#changeRoofColor").attr("disabled", false);
        $("#removeWallTexture").attr("disabled", false);

    }

    setDecidedRefPointClass(number) {

        $("#refPoint" + number).addClass("decided")

    }

    changeSelectedRefPointClass(number) {

        this.removeAllSelectedRefPointClass();

        $("#refPoint" + number).addClass("selected");

    }

    removeAllSelectedRefPointClass() {

        $(".refPoint").each(function(i, refPoint) {
            refPoint.classList.remove("selected")
        }.bind(this));

    }

    enableAddHafuMode() {
        $("#addHafu").attr("disabled", true); 
    }

    disableAddHafuMode() {
        $("#addHafu").attr("disabled", false);
    }

    onMoveEvent(mousePos) {
        
        switch (this.clickCount) {

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

    }

    onClickEvent(mousePos) {

        this.modelingManager.determineClickPosition(mousePos, this.clickCount);
            
        switch (this.clickCount) {

            case 0:

                this.clickCount++;

                break;

            case 1:

                this.clickCount++;

                break;

            case 2:
                
                this.modelingManager.removeBottomRectangleLine();
                this.modelingManager.removeIshigakiLine();

                this.modelingManager.createIshigakiPolygon();

                this.clickCount++;

                break;

            case 3:

                this.modelingManager.removeYaguraLine();
                this.modelingManager.removeYaneLine();

                this.modelingManager.createYaguraPolygon();
                this.modelingManager.createYanePolygon();

                this.clickCount++;

                break;

        }

        this.setRefPointButton(this.clickCount, this.clickCount+1)

        this.updateCastleOutline();
        this.displayClickPosition(this.clickCount);
            
    }

    setRefPointButton(decided, selected) {
        
        this.setDecidedRefPointClass(decided)

        if (selected <= 4) {

            this.changeSelectedRefPointClass(selected)
        
        } else {
        
            this.operationManager.changeCursorMode("orbit");
            this.finishConstructionMode();
        
        }

    }

    updateCastleOutline() {

        this.castleOutliner.innerHTML = ""

        const model = this.modelingManager.castle.model;

        if (model.ishigaki.line) this.addCastleOutlineOption("stonewallLine", "Stone Wall")
        if (model.ishigaki.polygon) this.addCastleOutlineOption("stonewallPolygon", "Stone Wall")
        if (model.yagura) this.addCastleOutlineOption("yagura", "Turret")

    }

    addCastleOutlineOption(type, text) {

        const option = document.createElement('div');
        option.classList.add('option')

        const typeSpan = document.createElement('span');
        typeSpan.classList.add('type')
        typeSpan.classList.add(type)
        typeSpan.innerHTML = "●"

        const textSpan = document.createElement('span');
        textSpan.innerHTML = text;

        option.appendChild(typeSpan)
        option.appendChild(textSpan)

        this.castleOutliner.appendChild(option)

    }

    displayClickPosition(clickCount) {

        $("#P" + clickCount + "x").val(this.modelingManager.clickPosition[clickCount-1].x)
        $("#P" + clickCount + "y").val(this.modelingManager.clickPosition[clickCount-1].y)
        $("#P" + clickCount + "z").val(this.modelingManager.clickPosition[clickCount-1].z)

    }

    changeRoofColor() {

        const val = $("#inputRoofColor").val();
        const color = (val) ? val :"0x638A72";
        
        this.modelingManager.castle.setYaneColor({ modelPreset: {yaneColor: color} });

    }

    generatePresetModel() {

        const name = $("#selectModelPreset").val()
        const type = $("#selectModelType").val()

        this.modelingManager.createPresetModel(name, type);

        this.completeAutoModel();

    }

    completeAutoModel() {

        for (let i = 1; i <= 4; i++) {
            
            this.setRefPointButton(i, i+1)

            this.displayClickPosition(i);

        }

        this.updateCastleOutline();

        this.clickCount = 5;
        this.disableConstructionMode();

    }

}

class TestTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager
        this.operationManager = sidePanelManager.operationManager;
        this.modelingManager = this.operationManager.modelingManager;
        this.sceneManager = this.operationManager.sceneManager;
        
        // it doesnt work.
        $("#gradientDescentCameraParameter").on('click', (e) => {
            gradientDescent.gradientDescentCameraParameter(this.sceneManager);
        })

        $("#outputError").on('click', (e) => {
            let calcError = () => {
                let errorRate = gradientDescent.calcError("rate");
                console.log(errorRate)
            }
            gradientDescent.calcErrorbind = calcError.bind(this);
            this.sceneManager.orbit.addEventListener('change', this.calcErrorbind)

            const errorRawData = gradientDescent.calcError(this.sceneManager)

            gradientDescent.downloadFile(errorRawData, "errorData.json")
        })

        $("#generatePixelData").on('click', (e) => {
            const sceneData = gradientDescent.generatePixelData(this.sceneManager);
            gradientDescent.downloadFile(sceneData, "sceneData.json")
        })

        $("#gradientDescentPrototype2").on('click', (e) => {
            gradientDescent.gradientDescentPrototype2();
        })

        $("#generatePixelPNG").on('click', (e) => {
            gradientDescent.generatePixelPNG(this.sceneManager);
        })

        $("#raycasterPlane").on('click', (e) => {
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2(0, 0); // 画面の中心

            const rectangle = generateRectangle(10000, 10000)
            this.sceneManager.scene.add(rectangle)
            this.sceneManager.render();

            raycaster.setFromCamera( pointer, this.sceneManager.currentCamera );
            const intersects = raycaster.intersectObjects(this.sceneManager.raycasterObjects.children);

            const p = intersects[0].point;

            this.sceneManager.orbit.target.set(p.x, p.y, p.z)
            this.sceneManager.orbit.update();


            function generateRectangle(width, height) {
                
                const geometry = new THREE.PlaneGeometry( width, height );
                const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

                const mesh = new THREE.Mesh(geometry, material);

                mesh.rotation.x = Math.PI / 2;

                return mesh
            }

        })

    }

}