import * as THREE from '/build/three.module.js';

import { LINE, POLYGON } from '../managers/Params.js'

import { Yagura } from './Yagura.js'
import { YaneComponent } from './YaneComponent.js'
import { ChidoriHafu, IrimoyaHafu } from './Hafu.js'
import { HafuPresets } from './HafuPresets.js'
import { ModelingSupporter } from '../managers/ModelingSupporter.js';

// 各層の屋根
export class Yane extends THREE.Group {

	constructor(eachLayer) {

		super();

		this.eachLayer = eachLayer;
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

		const verticalRatio = 5 / 6;

		return {

			A: new THREE.Vector3(
				origin.A.x + this.changeLevel.x * this.yaneSizeRatio.x,
				origin.A.y + this.changeLevel.y * verticalRatio * this.yaneLowerPosition,
				origin.A.z + this.changeLevel.z * this.yaneSizeRatio.z,
			),

			B: new THREE.Vector3(
				origin.B.x - this.changeLevel.x * this.yaneSizeRatio.x,
				origin.B.y + this.changeLevel.y * verticalRatio * this.yaneLowerPosition,
				origin.B.z - this.changeLevel.z * this.yaneSizeRatio.z,
			),

			C: new THREE.Vector3(
				origin.A.x - this.changeLevel.x,
				origin.A.y + this.changeLevel.y * (verticalRatio * this.yaneUpperPosition + 3/6),
				origin.A.z - this.changeLevel.z,
			),

			D: new THREE.Vector3(
				origin.B.x + this.changeLevel.x,
				origin.B.y + this.changeLevel.y * (verticalRatio * this.yaneUpperPosition + 3/6),
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
		
		let A = this.origin.A;
		let B = this.origin.B;

		let changeLevelX = this.changeLevel.x;
		let changeLevelZ = this.changeLevel.z;
		let yaneSizeRatioX = this.yaneSizeRatio.x;
		let yaneSizeRatioZ = this.yaneSizeRatio.z;

		if (this.PARAMS.hiraTsumaReverse) {

			const vertices = new ModelingSupporter().getCornerPoints(A, B);

			this.newOrigin = vertices[1].clone();

			A = vertices[1].sub(this.newOrigin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
			B = vertices[3].sub(this.newOrigin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

			changeLevelX = -this.changeLevel.z;
			changeLevelZ = -this.changeLevel.x;
			yaneSizeRatioX = this.yaneSizeRatio.z;
			yaneSizeRatioZ = this.yaneSizeRatio.x;

		}

		return {
			A: new THREE.Vector3(
				A.x + changeLevelX * yaneSizeRatioX,
				A.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				A.z + changeLevelZ * yaneSizeRatioZ,
			),
			
			B: new THREE.Vector3(
				B.x - changeLevelX * yaneSizeRatioX,
				B.y + this.changeLevel.y * 5 / 6 * this.yaneLowerPosition,
				B.z - changeLevelZ * yaneSizeRatioZ,
			),
				
			C: new THREE.Vector3(
				A.x,
				A.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
				A.z,
			),
					
			D: new THREE.Vector3(
				B.x,
				B.y + this.changeLevel.y * (5/6 * this.yaneUpperPosition + 2/6),
				B.z,
			)
			
		}

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
		
		this.top.position.set(0, 0, 0);

		if (this.PARAMS.hiraTsumaReverse) {

			this.top.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2)
			this.top.position.add(this.newOrigin)
			this.top.position.add(this.topYaneVertices.A.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2))
		
		} else {
		
			this.top.position.add(this.topYaneVertices.A);

		}

		if (parameters.type == "line") {
	
			this.line.add(this.top);

		} else {

			this.polygon.add(this.top);

		}
		

		return top;

	}
	
	createSimpleChidoriHafu(parameters) {

		if (!this.surroundingYane) {

			console.info("this yane does not have surrounding yane.")
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
		
		if (!(this.surroundingYane?.isSurroundingYane)) {
	
			// console.info("this yane is not have surrounding yane.");
			
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