import * as THREE from '/build/three.module.js';

import { LINE, POLYGON } from '../managers/Params.js'

import { Yagura } from './Yagura.js'
import { YaneComponent } from './YaneComponent.js'
import { ChidoriHafu, IrimoyaHafu } from './Hafu.js'
import { HafuPresets } from './HafuPresets.js'

/**
 * 屋根モデル関連のモデルクラス
 */
export class Yane extends Yagura {
	constructor(PARAMS, R3, R4, R6) {
		super(PARAMS, R3, R4, R6);

		this.PARAMS = PARAMS;

        this.calcParameters();

        this.allSurroundingYaneVertices = this.calcAllSurroundingYaneVertices();
        this.topYaneVertices = this.calcTopYaneVertices();

        this.allSurroundingYane = [];
        this.topYane;
	}

    calcParameters() {
        // 屋根の大きさの比率
        this.yaneSizeRatio = this.PARAMS.yaneSizeRatio;
        // 屋根の上側/下側の位置
        this.yaneUpperPosition = this.PARAMS.yaneUpperPosition;
        this.yaneLowerPosition = this.PARAMS.yaneLowerPosition;
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

export class SurroundingYane extends THREE.Group {
	constructor(PARAMS, A, B, C, D) {
		// 入力は4点
		//    -------B
		//   /    D /
		//  / C    /
		// A-------
		super();

		this.PARAMS = PARAMS;

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

        this.allYaneComponent = [];
	}

	calcParameters() {
		this.tarukiInterval = (this.C.x - this.A.x) / 10;
		if (this.tarukiInterval == 0.0) this.tarukiInterval = 0.1;
	}

	create(MODE, type = "whole") {
		// 4方向分の屋根を生成
		for (let direction=0; direction<4; direction++) {
			var dd = direction == 3 ? 0 : direction + 1;
			// if (d != 2) continue;

			const eachYaneComponent = new YaneComponent(
				this.PARAMS,
				this.lower[direction],
				this.lower[dd],
				this.upper[direction],
				this.upper[dd],
				direction,
				this.tarukiInterval
			);

			eachYaneComponent.generateBody(MODE, type);
			// eachYaneComponent.generateKawara(MODE);

			if (type == "whole")
				eachYaneComponent.generateKayaoi(MODE);

			eachYaneComponent.rotation.y = Math.PI / 2 * direction;
			eachYaneComponent.position.set(this.lower[direction].x, this.lower[direction].y, this.lower[direction].z)
			eachYaneComponent.name = "eachYaneComponent"
			this.add(eachYaneComponent);

            this.allYaneComponent.push(eachYaneComponent)
		}
	}

    createLine() {
        this.create(LINE)
    }

    createPolygon() {
        this.create(POLYGON)
    }

    getAllYaneComponent() {
        return this.allYaneComponent;
    }

    getYaneComponent(direction) {
        return this.allYaneComponent[direction]
    }

	getYane() {
		return this.parent;
	}

    createSimpleChidoriHafu(param, MODE) {
        this.getYaneComponent(param.dir).createSimpleChidoriHafu(param, MODE);

		if (param.symmetric) {
			let symmetricDir = (param.dir + 2) % 4;
			this.getYaneComponent(symmetricDir).createSimpleChidoriHafu(param, MODE);
		}
    }

	setBodyColor(color) {
		this.getAllYaneComponent().forEach(function(yaneComponent, dir) {
			yaneComponent.setBodyColor(color);
		})
	}

	setHafuColor(color) {
		this.getAllYaneComponent().forEach(function(yaneComponent, dir) {
			yaneComponent.setHafuColor(color);
		})
	}
}