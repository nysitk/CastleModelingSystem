import * as THREE from '/build/three.module.js';

import { PlaneEstimation } from './PlaneEstimation.js'
import { GUI } from '../controls/dat.gui.module.js';

export class PlaneControlTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager
        this.operationManager = sidePanelManager.operationManager;
        this.modelingManager = this.operationManager.modelingManager;
        this.sceneManager = this.operationManager.sceneManager;

        this.is2DfixEnabled = false;
        this.clickCount2DFix = 0;
        this.draggablePoint = new Array(4);
        
        $("#start2DFix").on('click', (e) => {
            this.operationManager.changeCursorMode("2Dfix");
        })
        
        $("#startPlaneEstimation").on('click', (e) => {
            this.operationManager.changeCursorMode("planeEstimation");
        })

    }

    onMove2DFixEvent() {

        if (this.is2DfixEnabled) {

            // this.modelingManager.createAllLineFrom2D(this.clickCount2DFix);

        }

    }

    onClick2DFixEvent(mousePos, clickCount2DFix = this.clickCount2DFix) {

        if (this.clickCount2DFix < 4)
        this.addDraggablePoint(mousePos, this.clickCount2DFix);

        switch (this.clickCount2DFix) {

            case 0:

                this.clickCount2DFix++;

                let createAllFrom2D = () => {
                    this.modelingManager.createAllFrom2D(this.clickCount2DFix);
                }

                this.createAllFrom2Dbind = createAllFrom2D.bind(this);
                this.sceneManager.orbit.addEventListener('change', this.createAllFrom2Dbind)
                
                break;

            case 1:

                this.clickCount2DFix++;
                break;

            case 2:

                this.clickCount2DFix++;
                break;

            case 3:

                this.clickCount2DFix++;

                if (this.sidePanelManager.PlaneControlTab?.content?.planeEstimation) {
                    this.operationManager.changeCursorMode("orbit");
                }

                this.modelingManager.createAllFrom2D(this.clickCount2DFix);
                
                this.enableConvertTo3DMode();

                break;

        }

    }

    addDraggablePoint(mousePos, count2D) {

        const draggablePoint = new DraggablePoint2DFix(mousePos.x, mousePos.y, count2D).add(this);

        this.draggablePoint[count2D] = draggablePoint;


        return draggablePoint;

    }

    enableConvertTo3DMode() {

        $("#convertTo3D").attr("disabled", false);
        $('#convertTo3D').on('click', (e) => { this.convertTo3D(e) });

    }

    disableConvertTo3DMode() {

        $("#convertTo3D").attr("disabled", true);

    }

    convertTo3D() {

        this.modelingManager.createAllModel();
        this.operationManager.controlPanel.castleEditTab.content.completeAutoModel();
        this.finish2DFixMode();

    }

    enable2DFixMode() {

        this.is2DfixEnabled = true;
        $("#start2DFix").attr("disabled", true); 

    }

    disable2DFixMode() {

        this.is2DfixEnabled = false;
        $("#start2DFix").attr("disabled", false); 

    }

    finish2DFixMode() {
        
        this.disable2DFixMode();

        // this.modelingManager.castle.removeLine();
        this.draggablePoint.map((p) => { 
            p.remove();
            p = null 
        });

        this.sceneManager.orbit.removeEventListener('change', this.createAllFrom2Dbind);

    }

    enablePlaneEstimationMode( isStartSolvePnP = true ) {
        
        $("#startPlaneEstimation").attr("disabled", true); 
        
        this.planeEstimation = new PlaneEstimation(this);
        this.addGUIRectangle();

        if (isStartSolvePnP) {
    
            this.planeEstimation.startSolvePnP();

        }
        
        return this.planeEstimation;

    }

    disablePlaneEstimationMode() {

        $("#startPlaneEstimation").attr("disabled", false); 

    }

    updatePlaneEstimation() {

    }
    
    addGUIRectangle() {

		this.gui = new GUI( { autoPlace: false} );
		this.gui.domElement.id = "PlaneControlGUI"
		$("#PlaneControlGUIWrapper").append($(this.gui.domElement))

        const planeEstimationFolder = this.gui.addFolder('Plane Estimation');
        planeEstimationFolder.add(this.planeEstimation, "rectAspect", 0.2, 2, 0.01).name("Rectangle Aspect").listen().onChange( () => this.sceneManager.updateScene() );
        planeEstimationFolder.add(this.sceneManager.currentCamera, "fov", 1, 90, 1).name("Camera fov").listen().onChange( () => this.sceneManager.updateScene() );
        planeEstimationFolder.open();

    }

}

// canvas上で2次元的に動かせる点
export class DraggablePoint {

    constructor(x = 0, y = 0, clickCount = 0, params) {

        this.view = $("#mainView");
        this.canvas = $("#mainCanvas");
        this.name = "draggablePoint"

        this.positionInCanvas = new THREE.Vector2(x, y);
        
        this.clickCount = clickCount;
        this.isDragging = false;

    }

    add(inner = this.clickCount) {

        this.inner = inner;
        this.domElement = $("<div id='" + this.name + "-" + this.clickCount + "' class='" + this.name + "'>" + this.inner + "</div>");
        this.view.append(this.domElement);

        this.changePosition(this.positionInCanvas.x, this.positionInCanvas.y);

        return this;

    }

    mousedown(e, arg) {

        arg.isDragging = true;

        arg.positionInCanvas.x = e.pageX - arg.canvas.offset().left;
        arg.positionInCanvas.y = e.pageY - arg.canvas.offset().top;

    }

    viewMousemove(e, arg) {

        if (!arg.isDragging) return;

        arg.positionInCanvas.x = e.pageX - arg.canvas.offset().left;
        arg.positionInCanvas.y = e.pageY - arg.canvas.offset().top;
        arg.changePosition(arg.positionInCanvas.x, arg.positionInCanvas.y)

    }

    mouseup(e, arg) {

        if (arg.isDragging) arg.isDragging = false;

    }

    setMouseEvent(params) {

        if (params[ "mousedown" ]) {

            this.domElement.on('mousedown', e => {
                params[ "mousedown" ](e, this);
            })
            
        }

        if (params[ "viewMousemove" ]) {

            this.view.on('mousemove', e => {
                params[ "viewMousemove" ](e, this);
            })
            
        }

        if (params[ "mouseup" ]) {

            this.domElement.on('mouseup', e => {
                params[ "mouseup" ](e, this);
            })
            
        }
    }

    changePosition(x, y) {

        if (x.isVector2) {
            
            x = x.x;
            y = x.y;
        
        }

        const canvasPos = this.canvas.offset()

        this.positionInCanvas.x = x;
        this.positionInCanvas.y = y;

        $(this.domElement).offset({ top: canvasPos.top + y, left: canvasPos.left + x });
        $(this.domElement).css( { transform: 'translate(-150%, -100%)' } );

    }

    remove() {

        this.domElement.remove();

    }

}

/**
 * 2Dfixモードでクリックしたときに、基準点（P1～P4）の画素座標を保持する
 */ 
class DraggablePoint2DFix extends DraggablePoint {

    constructor(x = 0, y = 0, clickCount = 0) {
        
        super(x, y, clickCount);

        this.name = "draggablePoint2DFix"

        this.isDraggablePoint2DFix = true;

        return this;

    }

    add(planeControl) {

        super.add();

        super.setMouseEvent({
            "mousedown": this.mousedown,
            "viewMousemove": this.viewMousemove,
            "mouseup": this.mouseup
        })

        this.planeControl = planeControl
        this.operationManager = this.planeControl.operationManager;
        this.modelingManager = this.planeControl.modelingManager;

        
        this.modelingManager.set2DPosition(this.clickCount, this.positionInCanvas)

        return this;

    }

    mousedown(e, arg) {

        super.mousedown(e, arg);

    }

    viewMousemove(e, arg) {

        if (!arg.isDragging) return;

        super.viewMousemove(e, arg);

        arg.modelingManager.set2DPosition(arg.clickCount, arg.positionInCanvas)

        arg.modelingManager.sceneManager.updateScene()
        
    }

    mouseup(e, arg) {

        super.mouseup(e, arg);

    }
    
}