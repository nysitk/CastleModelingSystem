import * as THREE from '/build/three.module.js';

import { ModelingSupporter } from '../managers/ModelingSupporter.js'

/**
 * 櫓モデル関連のモデルクラス
 */
export class Yagura extends THREE.Group {
	constructor(PARAMS, R3, R4, R6) {
		super();

		this.PARAMS = PARAMS;

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
        this.line = new Line(this.PARAMS, this.A, this.B, this.D).create()
        return this.line;
    }

    createPolygon(type = "whole") {
        this.polygon = new Polygon(this.PARAMS, this.A, this.B, this.D).create(type)
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
    constructor(PARAMS, R3, R4, R6) {
        super(PARAMS, R3, R4, R6);
    }
    
    create() {
		for (const vertices of this.allVertices) {
            const material = new THREE.LineBasicMaterial({color: 0xFD7E00})
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

	dispose() {
        this.children.forEach(child => {
            child.material.dispose();
            child.geometry.dispose();
        })
	}
}

class Polygon extends Yagura {
    constructor(PARAMS, R3, R4, R6) {
        super(PARAMS, R3, R4, R6);
    }
    
    create(type = "whole") {
		this.allVertices.forEach(function(vertices, i) {
            const eachLayerPolygon = new EachLayerPolygon(
				this.PARAMS,
                vertices.A,
                vertices.B,
                vertices.C,
                vertices.D,
				this.changeLevel,
            );

            eachLayerPolygon.generate(type);

            // 場所に応じて屋根を移動・回転
            eachLayerPolygon.position.set(vertices.A.x, vertices.A.y, vertices.A.z);
            eachLayerPolygon.name = "eachLayerPolygon";
            eachLayerPolygon.layerNum = i;
            this.add(eachLayerPolygon)
		}, this)
        return this;
    }

	setTexture(name) {
		let eachLayerPolygon = this.getEachLayerPolygon();
		eachLayerPolygon.forEach( function(surroundWall, layer) {
			surroundWall.getWall().forEach(function(wall) {
				wall.setTexture(name, layer)
			});
		})
	}

	removeTexture() {
		let eachLayerPolygon = this.getEachLayerPolygon();
		eachLayerPolygon.forEach( function(surroundWall) {
			surroundWall.getWall().forEach(function(wall) {
				wall.removeAllTexture()
			});
		})
	}

	getEachLayerPolygon() {
		return this.children.filter(
			function(e) {return e.name == "eachLayerPolygon"} 
		);
	}

	dispose() {
        this.children.forEach(child => {
			child.dispose();
        })
	}
}

class EachLayerPolygon extends THREE.Group {
	constructor(PARAMS, A, B, C, D, changeLevel) {
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

		this.wall = new Array(4);

		this.changeLevel = changeLevel;
	}

	generate(type = "whole") {

		// 4方向分壁を生成
		for (let direction=0; direction<4; direction++) {
            this.wall[direction] = this.generateWall(direction, type);
			this.add(this.wall[direction]);
		}

		const topFloorPolygon = new FloorPolygon(this.upper).generate(type);
		topFloorPolygon.position.set(this.lower[0].x, this.lower[0].y, this.lower[0].z)
		this.add(topFloorPolygon);

		const bottomFloorPolygon = new FloorPolygon(this.lower).generate(type);
		bottomFloorPolygon.position.set(this.upper[0].x, this.upper[0].y, this.upper[0].z)
		this.add(bottomFloorPolygon);
	}

    generateWall(direction, type="whole") {
        const dd = (direction+1)%4;

        const wallPolygon = new WallPolygon(
			this.PARAMS,
			this.lower[direction],
			this.lower[dd],
			this.upper[direction],
			this.upper[dd],
			direction,
			this.changeLevel
		);
        wallPolygon.generate(type);

        wallPolygon.rotation.y = Math.PI / 2 * direction;
        wallPolygon.position.set(this.lower[direction].x, this.lower[direction].y, this.lower[direction].z)
        wallPolygon.name = "WallPolygon"

        return wallPolygon;
    }

	getWall() {
		return this.children.filter(
			function(e) {return e.name == "WallPolygon"} 
		);
	}

	dispose() {
        this.children.forEach(child => {
			child.dispose();
        })
	}
}

class WallPolygon extends THREE.Group {
	constructor(PARAMS, A, B, C, D, d, changeLevel) {
		super();
		// 入力は4点と方向
		//   C---D
		//  /     \   
		// A-------B  --> x-axis

		// ^ z      2
		// |--> x  3 1 d:direction
		//          0

		this.PARAMS = PARAMS;

		var axis = new THREE.Vector3( 0, 1, 0 );
		var angle = Math.PI / 2 * -d;

		// Aを原点とする
		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A).applyAxisAngle( axis, angle );
		this.C = new THREE.Vector3().subVectors(C, A).applyAxisAngle( axis, angle );
		this.D = new THREE.Vector3().subVectors(D, A).applyAxisAngle( axis, angle );

		this.dir = d;
		this.changeLevel = changeLevel;
	}

	generate(type = "whole") {

		let material;

		if (type == "whole") {
			material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
		} else if (type == "black") {
			material = new THREE.MeshBasicMaterial( { color: 0x000000 } )
		}

		const geometry = new ModelingSupporter().generateRectangleGeometry(this.A, this.B, this.C, this.D);
		// const geometry = new THREE.PlaneGeometry(this.A.distanceTo(this.B), this.A.distanceTo(this.C))
		this.body = new THREE.Mesh(geometry, material);
		        
        this.body.receiveShadow = true;
        // mesh.castShadow = true;

		this.add(this.body);

        return this;
	}

	generateShitamiitabari() {
        const material1 = new THREE.MeshLambertMaterial({color: 0x252529, side: THREE.DoubleSide});
        const material2 = new THREE.MeshLambertMaterial({color: 0x222227, side: THREE.DoubleSide});

		const height = (this.C.y - this.A.y) / 3 * 2
		const thick = height / 8;
		const width = this.B.x - this.A.x + thick / 5
		const originPos = new THREE.Vector3(-thick / 10, 0, 0);

		const verticalInterval = Math.abs(this.changeLevel.x / 2);
		const verticalNum = Math.ceil(width / verticalInterval)

		this.shitamiitabari = new THREE.Group();

		this.shitamiitabari.add(generateFoundation());	// 土台
		this.shitamiitabari.add(generateMainHorizontalBar("top"));	// 上にある横棒
		this.shitamiitabari.add(generateMainHorizontalBar("bottom"));	// 下にある横棒
		this.shitamiitabari.add(generateThinVerticalBar());	// 細い縦棒群
		this.shitamiitabari.add(generateThinHorizontalBar());	// 細い横棒群

		this.add(this.shitamiitabari);


		function generateFoundation() {

			const geometry = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
				width, thick / 10, height
			)

			const foundation = new THREE.Mesh(geometry, material1);
			foundation.position.set(originPos.x, originPos.y, originPos.z)

			return foundation;

		}

		function generateMainHorizontalBar(pos) {

			const horizontalGeometry1 = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
				width, thick/10, thick
			)

			const horizontal = new THREE.Mesh(horizontalGeometry1, material2);
			const offset = (pos == "bottom") ? height - thick : 0; 
			horizontal.position.set(originPos.x, originPos.y + offset, originPos.z + thick/10)

			return horizontal;

		}

		function generateThinVerticalBar() {

			const verticalGeometry = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
				thick / 4, thick / 20, height
			)

			const verticalBars = new THREE.Group();

			for (let i = 0; i < verticalNum; i++) {

				let vertical = new THREE.Mesh(verticalGeometry, material2);
				let x = originPos.x + width * i / verticalNum;
				vertical.position.set(x, originPos.y, originPos.z + thick/10);

				verticalBars.add(vertical);

			}

			return verticalBars;

		}

		function generateThinHorizontalBar() {

			const horizontalGeometry2 = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
				width, thick / 20, thick / 6
			)

			const horizontalNum = 5
			const horizontalBars = new THREE.Group();

			for (let i = 0; i < horizontalNum; i++) {

				if (i == 0 || i == horizontalNum - 1) continue;

				let horizontal = new THREE.Mesh(horizontalGeometry2, material2);
				let y = height * i / horizontalNum + thick / 2;
				horizontal.position.set(originPos.x, y, originPos.z + thick/10);

				horizontalBars.add(horizontal);

			}

			return horizontalBars;
		}
	}

	generateMultipleWindow(i) {

		const chang = this.changeLevel.x * 1.5 / this.PARAMS.windowNum;
		// var chang = (d%2==0) ? this.changeLevel.x : this.changeLevel.z

		const windowNum = Math.abs(
			Math.ceil(
				this.getYaguraVertices(i).lower[this.dir].distanceTo(
					this.getYaguraVertices(i).lower[(this.dir+1)%4]
				) / chang
			)
		);

		const num = windowNum;
		const type = 2;
		const width = chang / 3 * this.PARAMS.windowWidth;
		const height = this.changeLevel.y / 4;

		const windowInterval = this.B.x / (num+1);
		const wallCenter = new THREE.Vector3().addVectors(this.A, this.D).multiplyScalar(0.5);

		this.windows = new THREE.Group();
		this.add(this.windows);


		for (let i = 0; i < num; i++) {

			const center = new THREE.Vector3(windowInterval*(i+1), wallCenter.y, wallCenter.z);
			const material = new THREE.MeshLambertMaterial({color: 0x333333, side: THREE.DoubleSide});
			
			if (type == 1) {

				const geometry = generateSingleWindowGeometry(center, width, height)

				const window = new THREE.Mesh(geometry, material);
				this.windows.add(window);

			} else if (type == 2) {

				const geometryLeft = generateTwinWindowGeometry(center, width, height, "left")

				const windowLeft = new THREE.Mesh(geometryLeft, material);
				this.windows.add(windowLeft);
				

				const geometryRight = generateTwinWindowGeometry(center, width, height, "right");

				const windowRight = new THREE.Mesh(geometryRight, material);
				this.windows.add(windowRight);

			}
		}

		function generateSingleWindowGeometry(center, width, height) {

			return new ModelingSupporter().generateBoxPolygonGeometry(
				new THREE.Vector3(center.x - width/2, center.y - height/2, center.z + 0.1),
				new THREE.Vector3(center.x + width/2, center.y - height/2, center.z),
				new THREE.Vector3(center.x - width/2, center.y + height/2, center.z + 0.1),
				new THREE.Vector3(center.x + width/2, center.y + height/2, center.z)
			);

		}

		function generateTwinWindowGeometry(center, width, height, side) {

			if (side == "left") {

				return new ModelingSupporter().generateBoxPolygonGeometry(
					new THREE.Vector3(center.x - width/2, center.y - height/2, center.z + 1),
					new THREE.Vector3(center.x - width/10, center.y - height/2, center.z),
					new THREE.Vector3(center.x - width/2, center.y + height/2, center.z + 1),
					new THREE.Vector3(center.x - width/10, center.y + height/2, center.z)
				);

			} else if (side == "right") {

				return new ModelingSupporter().generateBoxPolygonGeometry(
					new THREE.Vector3(center.x + width/10, center.y - height/2, center.z + 1),
					new THREE.Vector3(center.x + width/2, center.y - height/2, center.z),
					new THREE.Vector3(center.x + width/10, center.y + height/2, center.z + 1),
					new THREE.Vector3(center.x + width/2, center.y + height/2, center.z)
				);

			}

		}
	}

	getYaguraVertices(layer) {
		return this.parent.parent.getYaguraVertices(layer);
	}

	setTexture(name, layer) {

		switch (name) {

			case "shitamiitabari":
				this.generateShitamiitabari();
				break;

			case "window":
				this.generateMultipleWindow(layer);
				break;

			case "none":
				this.removeAllTexture();
				break;

		}

	}

	removeTexture(name) {

        this.getTexture(name).forEach(mesh => {

			this.remove(mesh)
			mesh.material.dispose();
			mesh.geometry.dispose();

        })

	}

	removeAllTexture() {
		this.removeTexture("shitamiitabari");
		this.removeTexture("window");
	}

	getTexture(name) {
		return this.children.filter(
			function(e) {return e.name == name} 
		);
	}

	dispose() {
        this.children.forEach(child => {
			if (child.isMesh) {
				child.material.dispose();
				child.geometry.dispose();
			}
        })
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

	dispose() {
        this.children.forEach(child => {
			child.material.dispose();
			child.geometry.dispose();
        })
	}
}