import * as THREE from '/build/three.module.js';

import { DraggablePoint } from '../managers/planeControlTab.js';

export class FovEstimation {

    constructor(testTab) {

        this.testTab = testTab;
        this.sceneManager = testTab.sceneManager;
        this.sidePanelManager = testTab.sidePanelManager;
        this.planeControl = this.sidePanelManager.planeControlTab.content

        
        this.planeEstimation = this.planeControl.enablePlaneEstimationMode(false);        

        this.planeEstimation.startSolvePnP();

        
        this.calcShimabaraPresetParameters();

        this.modelingManager = this.sidePanelManager.modelingManager;

        this.animateFov()
        // this.gradientDescent();
        
    }
    
    calcShimabaraPresetParameters() {
        
        this.planeEstimation.rectAspect = 1.0;
        this.planeEstimation.rectWidth = 85 * 2;
        
        this.planeEstimation.vertices2D[0].changePosition( 89, 569);
        this.planeEstimation.vertices2D[1].changePosition(489, 621);
        this.planeEstimation.vertices2D[2].changePosition(671, 548);
        this.planeEstimation.vertices2D[3].changePosition(335, 513);
        
        this.sceneManager.currentCamera.fov = 60;
        
        this.sceneManager.updateScene();
        
        this.planeEstimation.combine2DFix();
        
        // this.planeControl.onClick2DFixEvent(new THREE.Vector2( 89, 569), 0);
        // this.planeControl.onClick2DFixEvent(new THREE.Vector2(671, 548), 1);
        // this.planeControl.onClick2DFixEvent(new THREE.Vector2(626, 461), 2);
        // this.planeControl.onClick2DFixEvent(new THREE.Vector2(466, 127), 3);

        // this.sceneManager.updateScene();
        
    }

    yaguraTopEstimation(fov) {
        
        this.sceneManager.currentCamera.fov = fov;
        
        this.sceneManager.updateScene();


        const info = this.modelingManager.displayYaguraTopInfo()

        if (this.fovEstimationTargetPoint) this.fovEstimationTargetPoint.remove();
        this.fovEstimationTargetPoint = new FovEstimationPoint(415, 106).add(this).setIsTarget();

        if (this.fovEstimationEstimatedPoint) this.fovEstimationEstimatedPoint.remove();
        this.fovEstimationEstimatedPoint = new FovEstimationPoint(info.screen.x, info.screen.y).add(this).setIsEstimated();

        const error = this.vertexMatchEstimation(this.fovEstimationTargetPoint, this.fovEstimationEstimatedPoint);

        this.testTab.displayStatus(
            [
                {
                    name: "fov:\t",
                    value: fov
                },
                {
                    name: "target:\t",
                    value: this.fovEstimationTargetPoint.positionInCanvas.x + "\t" + this.fovEstimationTargetPoint.positionInCanvas.y
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

                    console.log(i, arg.yaguraTopEstimation(i));
                    
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

    gradientDescent() {
        
        const alpha = 0.01;
        const initX = 60;
        const th = 0.0000000001;
        const dx = 0.01;

        const loopMax = 1000;
        let i = 0;

        const arg = this;
        
        // const a = 1.00;
        // const b = 2.00;
        // const c = 3.00;

        function f(x) {
            return arg.yaguraTopEstimation(x);
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
            // console.log(x, f(x));

            i++;
            if (i > loopMax) break;
        }

        console.log("x: " + x + " extremum: " + f(x));

    }
    
}

class FovEstimationPoint extends DraggablePoint {

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

}
