import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

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
                this.content = new planeControlTab(this.sidePanelManager);
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

    constructor() {
        
        return this;

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
            $("#addHafu").attr("disabled", false);
        
        }

    }

    updateCastleOutline() {

        this.castleOutliner.innerHTML = ""

        const model = this.modelingManager.castle.model;

        if (model.ishigaki.line) this.addCastleOutlineOption("stonewallLine", "Stone Wall")
        if (model.ishigaki.polygon) this.addCastleOutlineOption("stonewallPolygon", "Stone Wall")
        if (model.yagura.line) this.addCastleOutlineOption("yaguraLine", "Turret")
        if (model.yagura.polygon) this.addCastleOutlineOption("yaguraLine", "Turret")
        if (model.yane.line) this.addCastleOutlineOption("yaneLine", "Roof")
        if (model.yane.polygon) this.addCastleOutlineOption("yanePolygon", "Roof")

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

}

class planeControlTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager
        this.operationManager = sidePanelManager.operationManager;
        this.modelingManager = this.operationManager.modelingManager;
        this.sceneManager = this.operationManager.sceneManager;

        this.is2DfixEnabled = true;
        this.clickCount2DFix = 0;
        this.draggablePoint = new Array(4);
        
        $("#start2DFix").on('click', (e) => {
            this.operationManager.changeCursorMode("2Dfix");
        })

    }

    onMoveEvent() {

        if (this.is2DfixEnabled) {

            this.modelingManager.createAllLineFrom2D(this.clickCount2DFix);

        }

    }

    onClickEvent(mousePos) {

        if (this.clickCount2DFix < 4)
        this.addDraggablePoint(mousePos, this.clickCount2DFix);

        switch (this.clickCount2DFix) {

            case 0:

                this.clickCount2DFix++;

                let createAllLineFrom2D = () => {
                    this.modelingManager.createAllLineFrom2D(4);
                }

                this.createAllLineFrom2Dbind = createAllLineFrom2D.bind(this);
                this.sceneManager.orbit.addEventListener('change', this.createAllLineFrom2Dbind)
                
                break;

            case 1:

                this.clickCount2DFix++;
                break;

            case 2:

                this.clickCount2DFix++;
                break;

            case 3:

                this.clickCount2DFix++;
                this.operationManager.changeCursorMode("orbit");
                this.modelingManager.createAllLineFrom2D(this.clickCount2DFix);
                
                this.enableConvertTo3DMode();

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

    enableConvertTo3DMode() {

        $("#convertTo3D").attr("disabled", false);
        $('#convertTo3D').on('click', (e) => { this.convertTo3D(e) });

    }

    disableConvertTo3DMode() {

    }

    convertTo3D() {

        this.modelingManager.createAllModel();
        this.finish2DFixMode();

    }

    enable2DFixMode() {

        $("#start2DFix").attr("disabled", true); 

    }

    disable2DFixMode() {

        this.is2DfixEnabled = false;
        $("#start2DFix").attr("disabled", false); 

    }

    finish2DFixMode() {
        
        this.disable2DFixMode();

        this.modelingManager.castle.removeAllLine();
        this.draggablePoint.map((p) => { 
            p.remove();
            p = null 
        });

        this.sceneManager.orbit.removeEventListener('change', this.createAllLineFrom2Dbind);

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
        $("#mainView").append(this.domElement);
        
        this.changePosition(this.mousePos.x, this.mousePos.y)

        this.domElement.on('mousedown', e => { 

            this.isDragging = true;
                
            this.mousePos.x = e.pageX - $("#mainCanvas").offset().left;
            this.mousePos.y = e.pageY - $("#mainCanvas").offset().top;
            
        });

        $("#mainView").on('mousemove', e => {

            if (this.isDragging) {
                
                this.mousePos.x = e.pageX - $("#mainCanvas").offset().left;
                this.mousePos.y = e.pageY - $("#mainCanvas").offset().top;
                this.changePosition(this.mousePos.x, this.mousePos.y)
                
                this.modelingManager.set2DPosition(this.clickCount, this.mousePos)
                this.modelingManager.createAllLineFrom2D(4);

            }

        });
          
        this.domElement.on('mouseup', e => {
            if (this.isDragging) {
                this.isDragging = false;
            }
        });

    }

    changePosition(x, y) {

        const viewPos = $("#mainCanvas").offset()

        $(this.domElement).offset({ top: viewPos.top + y, left: viewPos.left + x });
        $(this.domElement).css( { transform: 'translate(-50%, -50%)' } );

    }

    remove() {

        this.domElement.remove();

    }
    
}