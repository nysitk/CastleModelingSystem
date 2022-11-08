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
            this.enableConstruction();
        })

    }

    enableConstruction() {
        this.changeSelectedRefPointClass(this.clickCount+1)
        $("#startConstruction").html("UNDER CONSTRUCTION");
        $("#startConstruction").attr("disabled", true);
        this.operationManager.changeCursorMode("construction");
    }

    interruptConstruction() {
        this.removeAllSelectedRefPointClass();
        $("#startConstruction").html("INTERRUPT CONSTRUCTION");
        $("#startConstruction").attr("disabled", false);
    }

    endConstruction() {
        this.removeAllSelectedRefPointClass();
        $("#startConstruction").html("CONSTRUCTION COMPLETED");
        $("#startConstruction").attr("disabled", true);
        this.operationManager.changeCursorMode("orbit");
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
        
            this.endConstruction()
        
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

    constructor() {

    }

}