import * as THREE from '/build/three.module.js';

import { DraggablePoint } from '../managers/planeControlTab.js';
import { FovEstimationPresets } from '../models/FovEstimationPresets.js'

export class FovEstimationTab {

    constructor(sidePanelManager) {

        this.sidePanelManager = sidePanelManager;
        this.sceneManager = sidePanelManager.sceneManager;
        this.planeControl = sidePanelManager.planeControlTab.content;
        this.modelingManager = sidePanelManager.modelingManager;

        this.verificationPoints = [];

        $('#setFovEstimation').on( 'click', (e) => {
            this.fovEstimation = this.init();    
        } );

        $('#startFovEstimation').on( 'click', (e) => {
            this.calc();    
        } );

        $('#clearFovEstimation').on( 'click', (e) => {
            this.clear();    
        } );

        $('#getPresetParameters').on( 'click', (e) => {
            console.log(this.getPresetParameters());
        } );

		$('#getModelData').on('click', (e) => {
			this.getModelData();
		})
        
        for (let name in FovEstimationPresets) {
            $("#selectFovEstimationPreset").append("<option value='" + name + "'>" + name + "</option>")
        }

        
    }

    init() {

        this.clear();
        
        this.planeEstimation = this.planeControl.enablePlaneEstimationMode(false);
        
        this.initFov = 30;     
        
        const name = $("#selectFovEstimationPreset").val()
        
        if (!FovEstimationPresets[name]) {
            
            console.error("Preset whose name is " + name + " doesn't exist.");
            return;
            
        }
        
        this.setPresetParameters(FovEstimationPresets[name]);
        
        this.verifyPoints();

    }

    clear() {
        
        this.planeControl.clear();

        if (this.planeEstimation) this.planeEstimation.clear();

        for (let i = 0; i < this.verificationPoints.length; i++) {

            if (this.verificationPoints[i]) this.verificationPoints[i].remove();
            
        }

        this.verificationPoints = [];

    }
    
    setPresetParameters(preset) {
        
        this.planeEstimation.rectAspect = preset["rectAspect"];
        this.planeEstimation.rectWidth = preset["rectWidth"];

        // preset["yaguraSteps"]

        const v = preset["planeEstimation"]
        this.planeEstimation.vertices2D[0].changePosition(v[0]["x"], v[0]["y"]);
        this.planeEstimation.vertices2D[1].changePosition(v[1]["x"], v[1]["y"]);
        this.planeEstimation.vertices2D[2].changePosition(v[2]["x"], v[2]["y"]);
        this.planeEstimation.vertices2D[3].changePosition(v[3]["x"], v[3]["y"]);
        
        if (preset["initFov"]) this.sceneManager.currentCamera.fov = preset["initFov"];
        
        this.sceneManager.updateScene();
        
        this.planeEstimation.combine2DFix(preset["2DFix"]);

        if (this.fovEstimationTargetPoint) this.fovEstimationTargetPoint.remove();
        
        const target = preset["target"][0]
        this.verificationPoints[0] = new VerificationPoint(target["x"], target["y"]).add(this).setIsTarget().setType(target["type"]);
        
    }

    verifyPoints(fov = this.sceneManager.currentCamera.fov, type = "yaneTop") {
    
        this.sceneManager.currentCamera.fov = fov;
        
        this.sceneManager.updateScene();


        const parameters = {
            "e": "yane",
            "layer": "top",
            "side": "lower",
            "direction": "B"
        }
        let info = this.modelingManager.getVerticesInfo(parameters)

        if (this.fovEstimationEstimatedPoint) this.fovEstimationEstimatedPoint.remove();
        this.fovEstimationEstimatedPoint = new VerificationPoint(info.screen.x, info.screen.y).add(this).setIsEstimated();

        const error = this.vertexMatchEstimation(this.verificationPoints[0], this.fovEstimationEstimatedPoint);

        this.displayStatus(
            [
                {
                    name: "fov:\t",
                    value: fov
                },
                {
                    name: "target:\t",
                    value: this.verificationPoints[0].positionInCanvas.x + "\t" + this.verificationPoints[0].positionInCanvas.y
                },
                {
                    name: "estimated:\t",
                    value: this.fovEstimationEstimatedPoint.positionInCanvas.x.toFixed(2) + "\t" + this.fovEstimationEstimatedPoint.positionInCanvas.y.toFixed(2)
                },
                {
                    name: "error:\t",
                    value: error
                }
            ]
        )

        return error;
    
    }

    animateFov() {

        const arg = this;

        for (let i = 2; i <= 90; i++) {
            
            (function(i) { //追加

                setTimeout((e) => {

                    let error = arg.verifyPoints(i);

                    console.log(i, arg.verifyPoints(i));

                    $("#coverInfo").html("fov: " + i + "<br>" + "error: " + error.toFixed(4))
                    
                }, (i-2) * 50);

            })(i)

        }

    }

    vertexMatchEstimation(target, estimated) {

        return this.calcError(target.positionInCanvas, estimated.positionInCanvas);

    }

    calcError(targetPosition, estimatedPosition) {

        const xError = Math.pow((targetPosition.x - estimatedPosition.x), 2);
        const yError = Math.pow((targetPosition.y - estimatedPosition.y), 2);

        
        return xError + yError;

    }

    calc(initFov) {

        this.gradientDescent(initFov);
		// this.animateFov();

    }

    gradientDescent(initX = this.sceneManager.currentCamera.fov) {
        
        const alpha = 0.01;
        const th = 0.000001;
        const dx = 1;

        const loopMax = 1000;
        let i = 0;

        const arg = this;
        
        // const a = 1.00;
        // const b = 2.00;
        // const c = 3.00;

        function f(x) {
            return arg.verifyPoints(x);
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
            x += alpha * difference;
            if ( -th < difference && difference < th) loopFlag = false;
            console.log(x, f(x));

            i++;
            if (i > loopMax) break;
        }

        console.log("x: " + x + " extremum: " + f(x));

    }

    displayStatus(parameters = {}) {

        document.getElementById('fovEstimationStatus').innerHTML = ""

        for (const parameter of parameters) {

            this.addStatusRow(parameter.name, parameter.value);
        
        }

    }
    
    addStatusRow(name, param) {

        const dom = document.createElement( 'div' );
        dom.classList.add( 'statusRow' );

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('name')
        nameSpan.innerHTML = name

        const paramSpan = document.createElement('span');
        paramSpan.innerHTML = param;

        dom.appendChild(nameSpan)
        dom.appendChild(paramSpan)

        document.getElementById('fovEstimationStatus').appendChild(dom);

    }
    
    getPresetParameters() {

        const preset = {}

        preset["rectAspect"] = this.planeEstimation.rectAspect;
        preset["rectWidth"] = this.planeEstimation.rectWidth;
        
        if (preset["initFov"]) this.sceneManager.currentCamera.fov = preset["initFov"];

        // preset["yaguraSteps"]

        const v = this.planeEstimation.vertices2D;
        preset["planeEstimation"] = [
            { "x": v[0].positionInCanvas.x, "y": v[0].positionInCanvas.y },
            { "x": v[1].positionInCanvas.x, "y": v[1].positionInCanvas.y },
            { "x": v[2].positionInCanvas.x, "y": v[2].positionInCanvas.y },
            { "x": v[3].positionInCanvas.x, "y": v[3].positionInCanvas.y },
        ]


        preset["2DFix"] = []
        if (v[0].isDraggablePoint2DFix && v[1].isDraggablePoint2DFix) {
            
            preset["2DFix"][0] = null;
            preset["2DFix"][1] = null;
            preset["combine"] = true;
       
        }

        const d = this.planeControl.draggablePoint;
        for (let i = 0; i < d.length; i++) {
            
            if (d[i]?.isDraggablePoint2DFix) {
                
                preset["2DFix"][i] = { "x": d[i].positionInCanvas.x, "y": d[i].positionInCanvas.y }
                
            }
        
        }
        
        preset["target"] = []
        for (let i = 0; i < this.verificationPoints.length; i++) {

            preset["target"].push(

                {
                    "type": this.verificationPoints[i].verificationType,
                    "x": this.verificationPoints[i].positionInCanvas.x,
                    "y": this.verificationPoints[i].positionInCanvas.y
                }

            )            

        }

        return preset;
    
    }

	getModelData() {
		// lineモデルのみ対応
		
		const C1 = this.modelingManager.getVerticesInfo({
			"e": "ishigaki",
			"side": "lower",
			"direction": "A"
		})
		
		const C2 = this.modelingManager.getVerticesInfo({
			"e": "ishigaki",
			"side": "lower",
			"direction": "B"
		})
		
		const C3 = this.modelingManager.getVerticesInfo({
			"e": "ishigaki",
			"side": "lower",
			"direction": "C"
		})
		
		const ishigakiBackSide = this.modelingManager.getVerticesInfo({
			"e": "ishigaki",
			"side": "lower",
			"direction": "D"
		})
		
		const C4 = this.modelingManager.getVerticesInfo({
			"e": "ishigaki",
			"side": "upper",
			"direction": "C"
		})
	
		const C5 = this.modelingManager.getVerticesInfo({
			"e": "yagura",
			"layer": "top",
			"side": "upper",
			"direction": "C"
		})

		const yaguraTop = this.modelingManager.getVerticesInfo({
			"e": "yagura",
			"layer": "top",
			"side": "upper",
			"direction": "B"
		})

		const yaneTop = this.modelingManager.getVerticesInfo({
			"e": "yane",
			"layer": "top",
			"side": "lower",
			"direction": "B"
		})

		console.log("C1", C1)
		console.log("C2", C2)
		console.log("C3", C3)
		console.log("C4", C4)
		console.log("C5", C5)
		console.log("ishigakiBackSide", ishigakiBackSide)
		console.log("yaguraTop", yaguraTop)
		console.log("yaneTop", yaneTop)

		const preset = {}

		preset["planeEstimation"] = [
			{"x": C1.screen.x, "y": C1.screen.y},
			{"x": C2.screen.x, "y": C2.screen.y},
			{"x": C3.screen.x, "y": C3.screen.y},
			{"x": ishigakiBackSide.screen.x, "y": ishigakiBackSide.screen.y},
		]

		preset["2DFix"] = [
			null,
			null,
			{"x": C4.screen.x, "y": C4.screen.y},
			{"x": C5.screen.x, "y": C5.screen.y},
		]

		preset["target"] = [
			{"type": "yaguraTop", "x": yaguraTop.screen.x, "y": yaguraTop.screen.y},
			{"type": "yaneTop", "x": yaneTop.screen.x, "y": yaneTop.screen.y},
		]

		console.log(preset)
		
	}

}

class VerificationPoint extends DraggablePoint {

    constructor(x = 0, y = 0, clickCount = 0) {

        super(x, y, clickCount);

        this.name = "draggablePointFovEstimation";

        this.isDragggablePointFovEstimation = true;

    }

    add(fovEstimation) {

        super.add();
        
        super.setMouseEvent({
            "mousedown": this.mousedown,
            "viewMousemove": this.viewMousemove,
            "mouseup": this.mouseup
        })
        
        this.fovEstimation = fovEstimation;
        this.sceneManager = fovEstimation.sceneManager;


        return this;

    }

    mousedown(e, arg) {

        super.mousedown(e, arg);

    }

    viewMousemove(e, arg) {

        if (!arg.isDragging) return;
		
        super.viewMousemove(e, arg);
        
    }

    mouseup(e, arg) {
        
        super.mouseup(e, arg);
        
    }

    setIsTarget() {

        this.isTarget = true;


        return this;

    }

    setIsEstimated() {

        this.isEstimated = true;


        return this;

    }

    setType(type) {

        this.verificationType = type;

        return this;

    }

}
