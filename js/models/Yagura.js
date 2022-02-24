import * as THREE from '/build/three.module.js';

import { PARAMS } from '../managers/Params.js';

import { ModelingSupporter } from '../managers/ModelingSupporter.js'

/**
 * 櫓モデル関連のモデルクラス
 */
export class Yagura extends THREE.Group {
	constructor(R3, R4, R6) {
		super();

		this.A = R3.clone();
		this.B = R4.clone();
		this.D = R6.clone();

        this.yaguraSteps = PARAMS.yaguraSteps;

        this.allVertices = this.calcAllVertices();

        this.line;
        this.polygon;
	}

    calcAllVertices() {
		this.changeLevel = new THREE.Vector3(
			(this.D.x - this.B.x) / (this.yaguraSteps - 1),
			(this.D.y - this.B.y) / this.yaguraSteps,
			(this.D.z - this.B.z) / (this.yaguraSteps - 1)
		)

		const tmpA = this.A.clone();
		const tmpB = this.B.clone();
		const tmpC = new THREE.Vector3(
			this.A.x,
			this.A.y + this.changeLevel.y,
			this.A.z,
		)
		const tmpD = new THREE.Vector3(
			this.B.x,
			this.B.y + this.changeLevel.y,
			this.B.z,
		)

		const vertices = [];

		for (let i = 0; i < this.yaguraSteps; i++) {
			vertices.push({A: tmpA.clone(), B: tmpB.clone(), C: tmpC.clone(), D: tmpD.clone()});

			tmpA.x -= this.changeLevel.x;
			tmpA.y += this.changeLevel.y;
			tmpA.z -= this.changeLevel.z;
			tmpB.x += this.changeLevel.x;
			tmpB.y += this.changeLevel.y;
			tmpB.z += this.changeLevel.z;
			tmpC.x -= this.changeLevel.x;
			tmpC.y += this.changeLevel.y;
			tmpC.z -= this.changeLevel.z;
			tmpD.x += this.changeLevel.x;
			tmpD.y += this.changeLevel.y;
			tmpD.z += this.changeLevel.z;
		}

		return vertices;
    }

    createLine() {
        this.line = new Line(this.A, this.B, this.D).create()
        return this.line;
    }

    createPolygon() {
        this.polygon = new Polygon(this.A, this.B, this.D).create()
        return this.polygon;
    }

	getYaguraVertices(layer) {
		return {
			lower: [
				this.allVertices[layer].A.clone(),
				new THREE.Vector3(this.allVertices[layer].B.x, this.allVertices[layer].A.y, this.allVertices[layer].A.z),
				this.allVertices[layer].B.clone(),
				new THREE.Vector3(this.allVertices[layer].A.x, this.allVertices[layer].A.y, this.allVertices[layer].B.z)
			],

			upper: [
				this.allVertices[layer].C.clone(),
				new THREE.Vector3(this.allVertices[layer].D.x, this.allVertices[layer].C.y, this.allVertices[layer].C.z),
				this.allVertices[layer].D.clone(),
				new THREE.Vector3(this.allVertices[layer].C.x, this.allVertices[layer].C.y, this.allVertices[layer].D.z)
			]
		}
	}
}

class Line extends Yagura {
    constructor(R3, R4, R6) {
        super(R3, R4, R6);
    }
    
    create() {
		for (const vertices of this.allVertices) {
            const material = new THREE.LineBasicMaterial({color: 0xFFFFFF})
            const geometry = new ModelingSupporter().generateBoxLineGeometry(
                vertices.A,
                vertices.B,
                vertices.C,
                vertices.D
            );

            const mesh = new THREE.Line(geometry, material);

            this.add(mesh);
		}
        return this;
    }
}

class Polygon extends Yagura {
    constructor(R3, R4, R6) {
        super(R3, R4, R6);
    }
    
    create() {
		this.allVertices.forEach(function(vertices, i) {
            const eachLayerPolygon = new EachLayerPolygon(
                vertices.A,
                vertices.B,
                vertices.C,
                vertices.D
            );

            eachLayerPolygon.generate();

            for (let direction = 0; direction < 4; direction++) {
                const chang = this.changeLevel.x * 1.5;
                // var chang = (d%2==0) ? this.changeLevel.x : this.changeLevel.z
                const windowNum = Math.abs(Math.ceil(this.getYaguraVertices(i).lower[direction].distanceTo(this.getYaguraVertices(i).lower[(direction+1)%4])/chang));
                eachLayerPolygon.wall[direction].generateMultipleWindow(windowNum, 2, chang/3, this.changeLevel.y/4);
				// eachLayerPolygon.wall[direction].generateShitamiitabari(this.changeLevel.x);
            }

            // 場所に応じて屋根を移動・回転
            eachLayerPolygon.position.set(vertices.A.x, vertices.A.y, vertices.A.z);
            eachLayerPolygon.name = "eachLayerPolygon";
            eachLayerPolygon.layerNum = i;
            this.add(eachLayerPolygon)
		}, this)
        return this;
    }
}

class EachLayerPolygon extends THREE.Group {
	constructor(A, B, C, D) {
		super();

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

		this.wall = new Array(4);
	}

	generate() {
		// 4方向分壁を生成
		for (let direction=0; direction<4; direction++) {
            this.wall[direction] = this.generateWall(direction);
			this.add(this.wall[direction]);
		}

		const topFloorPolygon = new FloorPolygon(this.upper).generate();
		topFloorPolygon.position.set(this.lower[0].x, this.lower[0].y, this.lower[0].z)
		this.add(topFloorPolygon);

		const bottomFloorPolygon = new FloorPolygon(this.lower).generate();
		bottomFloorPolygon.position.set(this.upper[0].x, this.upper[0].y, this.upper[0].z)
		this.add(bottomFloorPolygon);
	}

    generateWall(direction) {
        const dd = (direction+1)%4;

        const wallPolygon = new WallPolygon(this.lower[direction], this.lower[dd], this.upper[direction], this.upper[dd], direction);
        wallPolygon.generate();

        wallPolygon.rotation.y = Math.PI / 2 * direction;
        wallPolygon.position.set(this.lower[direction].x, this.lower[direction].y, this.lower[direction].z)
        wallPolygon.name = "WallPolygon"

        return wallPolygon;
    }
}

class WallPolygon extends THREE.Group {
	constructor(A, B, C, D, d) {
		super();
		// 入力は4点と方向
		//   C---D
		//  /     \   
		// A-------B  --> x-axis

		// ^ z      2
		// |--> x  3 1 d:direction
		//          0

		var axis = new THREE.Vector3( 0, 1, 0 );
		var angle = Math.PI / 2 * -d;

		// Aを原点とする
		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A).applyAxisAngle( axis, angle );
		this.C = new THREE.Vector3().subVectors(C, A).applyAxisAngle( axis, angle );
		this.D = new THREE.Vector3().subVectors(D, A).applyAxisAngle( axis, angle );
	}

	generate() {
		const material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
		const geometry = new ModelingSupporter().generateRectangleGeometry(this.A, this.B, this.C, this.D);
		// const geometry = new THREE.PlaneGeometry(this.A.distanceTo(this.B), this.A.distanceTo(this.C))
		const mesh = new THREE.Mesh(geometry, material);
		        
        mesh.receiveShadow = true;
        // mesh.castShadow = true;

		this.add(mesh);

        return this;
	}

	generateShitamiitabari(changeLevel) {
        const material1 = new THREE.MeshLambertMaterial({color: 0x252529, side: THREE.DoubleSide});
        const material2 = new THREE.MeshLambertMaterial({color: 0x222227, side: THREE.DoubleSide});

		const height = (this.C.y - this.A.y) / 3 * 2
		const thick = height / 8;
		const width = this.B.x - this.A.x + thick / 5
		const origin_pos = new THREE.Vector3(-thick / 10, 0, 0);

		const verticalInterval = Math.abs(changeLevel / 2);
		const verticalNum = Math.ceil(width / verticalInterval)
		// 土台
		const geometry = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
			width, thick / 10, height
		)
		const back = new THREE.Mesh(geometry, material1);
		back.position.set(origin_pos.x, origin_pos.y, origin_pos.z)
		this.add(back);
		
		// 上下の横に長い棒を生成
		const horizontalGeometry1 = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
			width, thick/10, thick
		)
		const horizontal11 = new THREE.Mesh(horizontalGeometry1, material2);
		horizontal11.position.set(origin_pos.x, origin_pos.y, origin_pos.z + thick/10)
		this.add(horizontal11);
		const horizontal12 = new THREE.Mesh(horizontalGeometry1, material2);
		horizontal12.position.set(origin_pos.x, origin_pos.y + height - thick ,  origin_pos.z + thick/10)
		this.add(horizontal12);

		// 縦棒を生成
		const verticalGeometry = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
			thick / 4, thick / 20, height
		)
		// const verticalNum = 15
		for (let i = 0; i < verticalNum; i++) {
			let vertical = new THREE.Mesh(verticalGeometry, material2);
			let x = origin_pos.x + width * i / verticalNum;
			vertical.position.set(x, origin_pos.y, origin_pos.z + thick/10);
			this.add(vertical)
		}

		// 横棒を生成
		const horizontalGeometry2 = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
			width, thick / 20, thick / 6
		)
		const horizontalNum = 5
		for (let i = 0; i < horizontalNum; i++) {
			if (i == 0 || i == horizontalNum - 1) continue; 
			let horizontal = new THREE.Mesh(horizontalGeometry2, material2);
			let y = height * i / horizontalNum + thick / 2;
			horizontal.position.set(origin_pos.x, y, origin_pos.z + thick/10);
			this.add(horizontal)
		}
	}

	generateMultipleWindow(num, type, width, height) {
		const windowInterval = this.B.x / (num+1);
		const wallCenter = new THREE.Vector3().addVectors(this.A, this.D).multiplyScalar(0.5);

		for (let i = 0; i < num; i++) {
			const center = new THREE.Vector3(windowInterval*(i+1), wallCenter.y, wallCenter.z);
			const material = new THREE.MeshLambertMaterial({color: 0x333333, side: THREE.DoubleSide});
			
			if (type == 1) {

				const geometry = new ModelingSupporter().generateBoxPolygonGeometry(
					new THREE.Vector3(center.x - width/2, center.y - height/2, center.z + 0.1),
					new THREE.Vector3(center.x + width/2, center.y - height/2, center.z),
					new THREE.Vector3(center.x - width/2, center.y + height/2, center.z + 0.1),
					new THREE.Vector3(center.x + width/2, center.y + height/2, center.z)
				);
				const mesh = new THREE.Mesh(geometry, material);
				this.add(mesh);

			} else if (type == 2) {

				const geometryLeft = new ModelingSupporter().generateBoxPolygonGeometry(
					new THREE.Vector3(center.x - width/2, center.y - height/2, center.z + 1),
					new THREE.Vector3(center.x - width/10, center.y - height/2, center.z),
					new THREE.Vector3(center.x - width/2, center.y + height/2, center.z + 1),
					new THREE.Vector3(center.x - width/10, center.y + height/2, center.z)
				);
				const meshLeft = new THREE.Mesh(geometryLeft, material);
				this.add(meshLeft);

				const geometryRight = new ModelingSupporter().generateBoxPolygonGeometry(
					new THREE.Vector3(center.x + width/10, center.y - height/2, center.z + 1),
					new THREE.Vector3(center.x + width/2, center.y - height/2, center.z),
					new THREE.Vector3(center.x + width/10, center.y + height/2, center.z + 1),
					new THREE.Vector3(center.x + width/2, center.y + height/2, center.z)
				);
				const meshRight = new THREE.Mesh(geometryRight, material);
				this.add(meshRight);

			}
		}
	}
}

class FloorPolygon extends THREE.Group {
	constructor(vertices) {
		super();
		// 入力は4点と方向
		//   C---D
		//  /     \   
		// A-------B  --> x-axis

		// ^ z      2
		// |--> x  3 1 d:direction
		//          0

		var A = vertices[0].clone();
		var B = vertices[1].clone();
		var C = vertices[3].clone();
		var D = vertices[2].clone();

		// Aを原点とする
		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A);
		this.C = new THREE.Vector3().subVectors(C, A);
		this.D = new THREE.Vector3().subVectors(D, A);
	}

	generate() {
		const material = new THREE.MeshBasicMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
		const geometry = new ModelingSupporter().generateRectangleGeometry(this.A, this.B, this.C, this.D);

		const mesh = new THREE.Mesh(geometry, material);

		this.add(mesh);

        return this;
	}
}