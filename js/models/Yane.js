import * as THREE from '/build/three.module.js';

import { LINE, POLYGON } from '../managers/Params.js'

import { Yagura } from './Yagura.js'
import { YaneComponent } from './YaneComponent.js'
import { ChidoriHafu, IrimoyaHafu } from './Hafu.js'
import { HafuPresets } from './HafuPresets.js'

/**
 * 屋根モデル関連のモデルクラス
 */
// export class Yane extends Yagura {
export class YaneOld {
	constructor(R3, R4, R6, castleModelManager, parameters) {
		// super(R3, R4, R6, castleModelManager, parameters);

        this.calcParameters();

        this.allSurroundingYaneVertices = this.calcAllSurroundingYaneVertices();
        this.topYaneVertices = this.calcTopYaneVertices();

        this.allSurroundingYane = [];
        this.topYane;
	}

    calcParameters() {
        // 屋根の大きさの比率
        this.yaneSizeRatio = this.PARAMS.yane.sizeRatio;
        // 屋根の上側/下側の位置
        this.yaneUpperPosition = this.PARAMS.yane.upperPosition;
        this.yaneLowerPosition = this.PARAMS.yane.lowerPosition;
    }

    calcAllSurroundingYaneVertices() {
        const yaneVertices = []
		for (const vertices of this.allVertices) {

			var tmpA = new THREE.Vector3(
				vertices.A.x + this.changeLevel.x * this.yaneSizeRatio.x,
				vertices.A.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				vertices.A.z + this.changeLevel.z * this.yaneSizeRatio.z,
			)
			var tmpB = new THREE.Vector3(
				vertices.B.x - this.changeLevel.x * this.yaneSizeRatio.x,
				vertices.B.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				vertices.B.z - this.changeLevel.z * this.yaneSizeRatio.z,
			)
			var tmpC = new THREE.Vector3(
				vertices.A.x - this.changeLevel.x,
				vertices.A.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 3/6),
				vertices.A.z - this.changeLevel.z,
			)
			var tmpD = new THREE.Vector3(
				vertices.B.x + this.changeLevel.x,
				vertices.B.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 3/6),
				vertices.B.z + this.changeLevel.z,
			)

			yaneVertices.push({A: tmpA.clone(), B: tmpB.clone(), C: tmpC.clone(), D: tmpD.clone()});
		}
        return yaneVertices;
    }

    calcTopYaneVertices() {
		const topVertices = this.allVertices[this.allVertices.length - 1];
		var tmpA = new THREE.Vector3(
			topVertices.A.x + this.changeLevel.x * this.yaneSizeRatio.x,
			topVertices.A.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
			topVertices.A.z + this.changeLevel.z * this.yaneSizeRatio.z,
		)
		var tmpB = new THREE.Vector3(
			topVertices.B.x - this.changeLevel.x * this.yaneSizeRatio.x,
			topVertices.B.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
			topVertices.B.z - this.changeLevel.z * this.yaneSizeRatio.z,
		)
		var tmpC = new THREE.Vector3(
			topVertices.A.x,
			topVertices.A.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
			topVertices.A.z,
		)
		var tmpD = new THREE.Vector3(
			topVertices.B.x,
			topVertices.B.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
			topVertices.B.z,
		)

		return {A: tmpA.clone(), B: tmpB.clone(), C: tmpC.clone(), D: tmpD.clone()};
    }

    createLine() {
        this.line = this.createAll(LINE)
        return this.line;
    }

    createPolygon(type = "whole") {
        this.polygon = this.createAll(POLYGON, type)
        return this.polygon;
    }
    
    createAll(MODE, type = "whole") {
        this.allSurroundingYaneVertices.forEach(function (surroundingYaneVertices, i){
            if (i+1 == this.allSurroundingYaneVertices.length) return false;
			this.createSurroundingYane(i, MODE, type)
		},this)

        this.createTopYane(MODE, type)

        return this;
    }

    createSurroundingYane(layer, MODE, type = "whole") {
        const surroundingYane = new SurroundingYane(
			this.PARAMS,
            this.allSurroundingYaneVertices[layer].A,
            this.allSurroundingYaneVertices[layer].B,
            this.allSurroundingYaneVertices[layer].C,
            this.allSurroundingYaneVertices[layer].D
        );

        surroundingYane.create(MODE, type);

        // 場所に応じて屋根を移動・回転
        surroundingYane.position.set(this.allSurroundingYaneVertices[layer].A.x, this.allSurroundingYaneVertices[layer].A.y, this.allSurroundingYaneVertices[layer].A.z);
        surroundingYane.name = "surroundingYane";
        surroundingYane.yagura_layer = layer;
        this.add(surroundingYane)

        this.allSurroundingYane.push(surroundingYane)

        return surroundingYane;
    }

    createHafuPreset(MODE, name) {
		if (HafuPresets[name]) {
			for (const param of HafuPresets[name]) {
				this.createSimpleChidoriHafu(param, MODE)
			}
		}
    }

	setAllColor(color) {
		this.setBodyColor(color);
		this.setChidoriHafuColor(color);
		this.setIrimoyaHafuColor(color);
	}

	setBodyColor(color) {
		this.getAllSurroundingYane().forEach(function(surroundingYane, layer) {
			surroundingYane.setBodyColor(color);
		})
	}

	setChidoriHafuColor(color) {
		this.getAllSurroundingYane().forEach(function(surroundingYane, layer) {
			surroundingYane.setHafuColor(color);
		})
	}

	setIrimoyaHafuColor(color) {
		this.getIrimoyaHafu().forEach(function(irimoyaHafu) {
			irimoyaHafu.setColor(color);
		})
	}

	getIrimoyaHafu() {
		return this.children.filter( function (child) {
			return child.name == "irimoyaHafu"
		})
	}

    getAllSurroundingYane() {
        return this.allSurroundingYane;
    }

    getSurroundingYane(layer) {
        return this.allSurroundingYane[layer];
    }

    createSimpleChidoriHafu(param, MODE) {
        this.getSurroundingYane(param.layer).createSimpleChidoriHafu(param, MODE)
    }

	getYaneVertices(layer) {
        const vertices = this.getSurroundingYane(param.layer)
		return {
			lower: [
				vertices.A.clone(),
				new THREE.Vector3(vertices.B.x, vertices.A.y, vertices.A.z),
				vertices.B.clone(),
				new THREE.Vector3(vertices.A.x, vertices.A.y, vertices.B.z)
			],

			upper: [
				vertices.C.clone(),
				new THREE.Vector3(vertices.D.x, vertices.C.y, vertices.C.z),
				vertices.D.clone(),
				new THREE.Vector3(vertices.C.x, vertices.C.y, vertices.D.z)
			]
		}
	}

    createTopYane(MODE, type = "whole") {
		this.topYane = new IrimoyaHafu(
			this.PARAMS,
			this.topYaneVertices.A,
			this.topYaneVertices.B,
			this.topYaneVertices.C,
			this.topYaneVertices.D
		);
		this.topYane.generate(MODE, type);
		this.topYane.position.set(this.topYaneVertices.A.x, this.topYaneVertices.A.y, this.topYaneVertices.A.z);
		this.topYane.name = "irimoyaHafu"
		this.add(this.topYane);
    }

	getScene() {
		return this.parent;
	}
}

export class Yane extends THREE.Group {

    constructor(eachLayer) {

        super();

        this.eachLayer = eachLayer;
        this.worldVertices = eachLayer.worldVertices;
		this.origin = eachLayer.origin;

        this.changeLevel = this.eachLayer.yagura.changeLevel;

		this.PARAMS = this.eachLayer.yagura.PARAMS

		// 屋根の大きさの比率
        this.yaneSizeRatio = this.PARAMS.yane.sizeRatio;

        // 屋根の上側/下側の位置
        this.yaneUpperPosition = this.PARAMS.yane.upperPosition;
        this.yaneLowerPosition = this.PARAMS.yane.lowerPosition;

        this.yaneVertices = this.calcYaneVertices();

		
		this.line = new THREE.Group();
		this.add(this.line);

		this.polygon = new THREE.Group();
		this.add(this.polygon);

    }

    calcYaneVertices() {

        const origin = this.origin;

        return {

            A: new THREE.Vector3(
                origin.A.x + this.changeLevel.x * this.yaneSizeRatio.x,
                origin.A.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
                origin.A.z + this.changeLevel.z * this.yaneSizeRatio.z,
            ),

            B: new THREE.Vector3(
                origin.B.x - this.changeLevel.x * this.yaneSizeRatio.x,
                origin.B.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
                origin.B.z - this.changeLevel.z * this.yaneSizeRatio.z,
            ),

            C: new THREE.Vector3(
                origin.A.x - this.changeLevel.x,
                origin.A.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 3/6),
                origin.A.z - this.changeLevel.z,
            ),

            D: new THREE.Vector3(
                origin.B.x + this.changeLevel.x,
                origin.B.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 3/6),
                origin.B.z + this.changeLevel.z,
            )

        }

    }
	
	createSurroundingYane(parameters) {
		
		const layer = this.layer;
		
        const surroundingYane = new SurroundingYane(

			this.PARAMS,
            this.yaneVertices.A,
            this.yaneVertices.B,
            this.yaneVertices.C,
            this.yaneVertices.D,

        );

        surroundingYane.create(parameters);

        // 場所に応じて屋根を移動・回転
        surroundingYane.position.set(this.yaneVertices.A.x, this.yaneVertices.A.y, this.yaneVertices.A.z);
        surroundingYane.name = "surroundingYane";
        surroundingYane.yaguraLayer = layer;

        return surroundingYane;

	}

	createLine(parameters = {}) {

		if (!parameters.type) parameters.type = "line"
		
		this.surroundingYane = this.createSurroundingYane(parameters)
		this.line.add(this.surroundingYane);
		
		return this;
		
	}
	
	createPolygon(parameters = {}) {

		if (!parameters.type) parameters.type = "polygon"
		if (!parameters.polygonType) parameters.polygonType = "whole"
		
		this.surroundingYane = this.createSurroundingYane(parameters)
		this.polygon.add(this.surroundingYane);
		
		return this;
		
	}
	
	calcTopYaneVertices() {
		
		return {
			A: new THREE.Vector3(
				this.origin.A.x + this.changeLevel.x * this.yaneSizeRatio.x,
				this.origin.A.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				this.origin.A.z + this.changeLevel.z * this.yaneSizeRatio.z,
			),
			
			B: new THREE.Vector3(
				this.origin.B.x - this.changeLevel.x * this.yaneSizeRatio.x,
				this.origin.B.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				this.origin.B.z - this.changeLevel.z * this.yaneSizeRatio.z,
			),
				
			C: new THREE.Vector3(
				this.origin.A.x,
				this.origin.A.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
				this.origin.A.z,
			),
					
			D: new THREE.Vector3(
				this.origin.B.x,
				this.origin.B.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
				this.origin.B.z,
			)
			
		}

	}
	
	createTopLine(parameters = {}) {

		if (!parameters.type) parameters.type = "line"
		
		this.createTop(parameters)
		
		return this;
		
	}
	
	createTopPolygon(parameters = {}) {
		
		if (!parameters.type) parameters.type = "polygon"
		if (!parameters.polygonType) parameters.polygonType = "whole"

		this.createTop(parameters)

		return this;

	}

    createTop(parameters = {}) {

		this.topYaneVertices = this.calcTopYaneVertices();
		
		this.top = new IrimoyaHafu(
			
			this.PARAMS,
			this.topYaneVertices.A,
			this.topYaneVertices.B,
			this.topYaneVertices.C,
			this.topYaneVertices.D
			
		).generate(parameters);
		
		this.top.position.set(this.topYaneVertices.A.x, this.topYaneVertices.A.y, this.topYaneVertices.A.z);

		if (parameters.type == "line") {
	
			this.line.add(this.top);

		} else {

			this.polygon.add(this.top);

		}
		

		return top;

	}
	
	createSimpleChidoriHafu(parameters) {

		if (!this.surroundingYane) {

			console.info("this yane is not have surrounding yane.")
			console.info("this function is uncompleted. Hafu line is not supported.")
			
			return;

		}

		this.surroundingYane.createSimpleChidoriHafu(parameters)

	}
	
	dispose() {
		
	}

	setColor(parameters) {

		this.setBodyColor(parameters);
		this.setTopColor(parameters);
		this.setHafuColor(parameters);
	
	}

	setBodyColor(parameters) {
		
		if (!this.surroundingYane?.isSurroundingYane) {

			console.info("this yane is not have surrounding yane.");
			
			return;

		}

		this.surroundingYane.setBodyColor(parameters)
		
	}
	
	setTopColor(parameters) {
		
		if (!this.top?.isIrimoyaHafu) {
		
			console.info("this yane is not have top irimoya hafu.");
			
			return;
			
		}
		
		this.top.setColor(parameters)
		
	}
	
	setHafuColor(parameters) {
		
		if (!this.surroundingYane?.isSurroundingYane) {
	
			console.info("this yane is not have surrounding yane.");
			
			return;
	
		}
	
		this.surroundingYane.setHafuColor(parameters)
			
	}
	
	getAllBodyMesh() {
		
		if (!this.surroundingYane?.isSurroundingYane) {
	
			console.info("this yane is not have surrounding yane.");
			
			return;
	
		}
	
		return this.surroundingYane.getAllBodyMesh();
			
	}

}

export class SurroundingYane extends THREE.Group {
	
	constructor(PARAMS, A, B, C, D, parameters = {}) {

		// 入力は4点
		//    -------B
		//   /    D /
		//  / C    /
		// A-------

		super();
		
		this.isSurroundingYane = true;
		
		this.PARAMS = PARAMS;
		this.parameters = parameters;
		
		// 点Aを原点として考える
		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A);
		this.C = new THREE.Vector3().subVectors(C, A);
		this.D = new THREE.Vector3().subVectors(D, A);

		this.lower = [

			this.A.clone(),
			new THREE.Vector3(this.B.x, this.A.y, this.A.z),
			this.B.clone(),
			new THREE.Vector3(this.A.x, this.A.y, this.B.z)

		]

		this.upper = [
		
			this.C.clone(),
			new THREE.Vector3(this.D.x, this.C.y, this.C.z),
			this.D.clone(),
			new THREE.Vector3(this.C.x, this.C.y, this.D.z)
		
		]

		this.calcParameters();

	}

	calcParameters() {

		this.tarukiInterval = (this.C.x - this.A.x) / 10;

		if (this.tarukiInterval < 0.1) this.tarukiInterval = 0.1;

	}

	create(parameters = {}) {

		if (!parameters.type) parameters.type = "polygon";
		if (!parameters.polygonType) parameters.polygonType = "whole"

		// 4方向分の屋根を生成
		for (let dir = 0; dir < 4; dir++) {

			var dd = (dir == 3) ? 0 : (dir + 1);
			// if (d != 2) continue;

			const yaneComponent = new YaneComponent(

				this.PARAMS,
				this.lower[ dir ],
				this.lower[ dd ],
				this.upper[ dir ],
				this.upper[ dd ],
				dir,
				this.tarukiInterval

			);

			yaneComponent.generateBody(parameters);
			// yaneComponent.generateKawara(parameters);

			if (parameters.type == "polygon" && parameters.polygonType == "whole") {

				yaneComponent.generateKayaoi(parameters);

			}

			yaneComponent.rotation.y = Math.PI / 2 * dir;
			yaneComponent.position.set(this.lower[dir].x, this.lower[dir].y, this.lower[dir].z)
			
			this.add(yaneComponent);

		}

		return this;
		
	}

    getYaneComponents() {

		return this.children.filter(

			function(e) {return e.isYaneComponent}

		)

	}

    getYaneComponent(direction) {

		const yaneComponents =  this.getYaneComponents().filter(

			function(e) {return e.direction == direction}
	
		)

		if (yaneComponents.length == 1) {

			return yaneComponents[0];
		
		}

		return null;

    }

	getAllBodyMesh() {

		const allBodyMesh = [];

		for (const yaneComponent of this.getYaneComponents()) {

			allBodyMesh.push( yaneComponent.getBodyMesh() )

		}

		return allBodyMesh;

	}

	getYane() {
		return this.parent;
	}

    createSimpleChidoriHafu(parameters) {

		const dir = parameters.hafu.dir;
		const symmetricDir = (dir + 2) % 4;

        this.getYaneComponent(dir).createSimpleChidoriHafu(parameters);

		if (parameters.hafu.symmetric) {

			this.getYaneComponent(symmetricDir).createSimpleChidoriHafu(parameters);
		
		}

	}

	setBodyColor(parameters) {

		this.getYaneComponents().forEach( function( yaneComponent ) {
		
			yaneComponent.setBodyColor(parameters);
		
		})
	
	}

	setHafuColor(parameters) {
		this.getYaneComponents().forEach(function( yaneComponent ) {

			yaneComponent.setHafuColor(parameters);
		
		})
	
	}

}