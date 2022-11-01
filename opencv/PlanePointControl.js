import * as THREE from '/build/three.module.js';

/**
 * ユーザー操作関連のモデルクラス
 */
export class PlanePointControl {

	constructor(sceneManager) {
		
		this.sceneManager = sceneManager;
		this.width = sceneManager.size.width;
		this.height = sceneManager.size.height;

		const points = [
			new DraggablePoint(this.width / 4 * 1, this.height / 4 * 3).add(this.sceneManager),
			new DraggablePoint(this.width / 4 * 3, this.height / 4 * 3).add(this.sceneManager),
			new DraggablePoint(this.width / 4 * 3, this.height / 4 * 2).add(this.sceneManager),
			new DraggablePoint(this.width / 4 * 1, this.height / 4 * 2).add(this.sceneManager),
		]

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

    add(sceneManager, name = "position2D") {
        
        this.domElement = $("<div id='" + name + "-" + this.clickCount + "' class='" + name + "'></div>");
        $(sceneManager.domParent).append(this.domElement);
        this.changePosition(this.mousePos.x, this.mousePos.y)

        this.domElement.on('mousedown', e => { 
            this.isDragging = true;
        });

        $(sceneManager.domParent).on('mousemove', e => {
            if (this.isDragging === true) {
				const targetRect = e.currentTarget.getBoundingClientRect();
				this.mousePos.x = e.clientX - targetRect.left;
				this.mousePos.y = e.clientY - targetRect.top;
                this.changePosition(this.mousePos.x, this.mousePos.y)
                // this.modelingManager.set2DPosition(this.clickCount, this.mousePos)
                // this.modelingManager.createAllLineFrom2D(4);
            }
        });
          
        $(sceneManager.domParent).on('mouseup', e => {
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