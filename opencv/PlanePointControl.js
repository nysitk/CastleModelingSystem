import * as THREE from '/build/three.module.js';

import { solvePnPFromJSON } from './coordinateSolvePnP.js';

/**
 * ユーザー操作関連のモデルクラス
 */
export class PlanePointControl {

	constructor(sceneManager) {
		
		this.sceneManager = sceneManager;
		this.width = sceneManager.size.width;
		this.height = sceneManager.size.height;

		this.vertices2D = [
			new DraggablePoint(this.width / 4 * 1, this.height / 4 * 3, 0).add(this),
			new DraggablePoint(this.width / 4 * 3, this.height / 4 * 3, 1).add(this),
			new DraggablePoint(this.width / 4 * 3, this.height / 4 * 2, 2).add(this),
			new DraggablePoint(this.width / 4 * 1, this.height / 4 * 2, 3).add(this),
		]

	}

    startSolvePnP() {

        if (this.vertices2D.length != 4) {
            console.error("Number of Draggable Point must be 4.");
            return;
        }

        const currentData = this.exportScene();
        const estimatedCV = solvePnPFromJSON(currentData);
        this.setFromEstimatedCV(estimatedCV);

    }

    exportScene() {
        
        const data = {};

        data.coordinateSystem = "Three.js";

        data.coordinates = this.exportCoordinatesSet();

        data.renderSize = {}
        data.renderSize.width = this.sceneManager.size.width;
        data.renderSize.height = this.sceneManager.size.height;
        
        return data;

    }

    exportCoordinatesSet() {

        this.ASPECT = 1.0 // aspect of rectangle. ( = width / height);
        this.width = 200;
        this.height = this.width / this.ASPECT;

        const coordinatesSet = [];

        this.vertices3D = [
            new THREE.Vector3(-this.width/2, 0, this.height/2),
            new THREE.Vector3(this.width/2, 0, this.height/2),
            new THREE.Vector3(this.width/2, 0, -this.height/2),
            new THREE.Vector3(-this.width/2, 0, -this.height/2),
        ]

        for (let i = 0; i < 4; i++) {

            const coordinate = {};

            coordinate.ID = i+1;

            const worldCoordinate = this.vertices3D[i];
            coordinate.worldCoordinate = [worldCoordinate.x, worldCoordinate.y, worldCoordinate.z];

            const screenCoordinate = this.vertices2D[i].mousePos;
            coordinate.screenCoordinate = [screenCoordinate.x, screenCoordinate.y];

            coordinatesSet.push(coordinate);
            
        }

        return coordinatesSet;

    }

    setFromEstimatedCV(estimatedCV) {
        this.sceneManager.orbit.enabled = false;
        this.sceneManager.orbit.target.set(0, 0, 0)

        const R3 = new THREE.Matrix3().fromArray(estimatedCV.camera.R.matrix).transpose();
        const R4 = setFromMatrix3(R3, new THREE.Matrix4())
        const cameraRotation = new THREE.Euler().setFromRotationMatrix(R4, 'XYZ');
        this.sceneManager.currentCamera.rotation.set(-1 * (Math.PI - cameraRotation.x), -cameraRotation.y, -cameraRotation.z)

        const camera_t = estimatedCV.camera.t;
        this.sceneManager.currentCamera.position.set(camera_t.matrix[0], camera_t.matrix[1], camera_t.matrix[2]);
        

        this.sceneManager.changeGUI();
        
        function setFromMatrix3( m3, m4 ) {

            const me = m3.elements;

            m4.set(

                me[ 0 ], me[ 3 ], me[ 6 ], 0,
                me[ 1 ], me[ 4 ], me[ 7 ], 0,
                me[ 2 ], me[ 5 ], me[ 8 ], 0,
                0, 0, 0, 1

            );

            return m4;

        }

    }

}

/**
 * 2Dfixモードでクリックしたときに、基準点（P1～P4）の画素座標を保持する
 */ 
 class DraggablePoint {

    constructor(x = 0, y = 0, clickCount = 0) {

		this.mousePos = new THREE.Vector2(x, y);
        this.clickCount = clickCount;
        this.isDragging = false;

		return this;

    }

    add(planePointControl, name = "position2D") {

        this.planePointControl = planePointControl;
        this.sceneManager = planePointControl.sceneManager
        
        this.domElement = $("<div id='" + name + "-" + this.clickCount + "' class='" + name + "'>" + this.clickCount + "</div>");
        $(this.sceneManager.domParent).append(this.domElement);
        this.changePosition(this.mousePos.x, this.mousePos.y)

        this.domElement.on('mousedown', e => { 
            this.isDragging = true;
        });

        $(this.sceneManager.domParent).on('mousemove', e => {
            if (this.isDragging === true) {
				const targetRect = e.currentTarget.getBoundingClientRect();
				this.mousePos.x = e.clientX - targetRect.left;
				this.mousePos.y = e.clientY - targetRect.top;
                this.changePosition(this.mousePos.x, this.mousePos.y)
                this.planePointControl.startSolvePnP(this.clickCount, this.mousePos)
                // this.modelingManager.createAllLineFrom2D(4);
            }
        });
          
        $(this.sceneManager.domParent).on('mouseup', e => {
            if (this.isDragging === true) {
                this.isDragging = false;
            }
        });

		return this;

    }

    changePosition(x, y) {

        $(this.domElement).css("top", y);
        $(this.domElement).css("left", x);
        $(this.domElement).css( { transform: 'translate(-50%, -50%)' } );

    }

    remove() {

        this.domElement.remove();

    }
    
}