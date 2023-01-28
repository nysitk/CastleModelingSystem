import * as THREE from '/build/three.module.js';

import { ModelingSupporter } from '../managers/ModelingSupporter.js'

import { Yane } from './Yane.js';
import { HafuPresets } from './HafuPresets.js'

/**
 * 櫓モデル関連のモデルクラス
 */
export class Yagura extends THREE.Group {

	constructor(R3, R4, R6, castleModelManager, parameters = {}) {

		super();

		this.castleModelManager = castleModelManager;
		this.PARAMS = castleModelManager.PARAMS;
        this.yaguraSteps = this.PARAMS.yagura.steps;
		
		this.parameters = parameters;
        this.type = (parameters.type) ? parameters.type : "whole";
        this.topFloor = (parameters.topFloor) ? parameters.topFloor : false;

		this.A = R3.clone();
		this.B = R4.clone();
		this.D = this.calc_D(R6.clone(), this.topFloor);

        this.allVertices = this.calcAllVertices();

	}

	calc_D(R6, topFloor) {

		if (topFloor) {

			const changeLevel = new THREE.Vector3(

				(R6.x - this.B.x) / (this.yaguraSteps - 2),
				(R6.y - this.B.y) / (this.yaguraSteps - 1),
				(R6.z - this.B.z) / (this.yaguraSteps - 2)

			)

			R6.add(changeLevel);

		}

		return R6;

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

	getYaguraVertices(layer) {

		if (layer == "top") {
			layer = this.PARAMS.yagura.steps - 1;
		}

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

	getYaguraVertex(parameters = {}) {

		return this.getYaguraVertices(parameters.layer)[parameters.side][parameters.direction]

	}

	getYaneVertex(parameters = {}) {
		
		if (parameters.layer == "top") {
			parameters.layer = this.PARAMS.yagura.steps - 1;
		}

		const eachLayer = this.getEachLayer(parameters.layer);
		let yane = eachLayer?.yane?.line?.children[0];

		if (!yane) {

			console.error("polygon is not determined.")
			return;

		}

		if (yane.top) {

			yane = yane.top;

		}

		const position = new THREE.Vector3().addVectors(yane.position, eachLayer.position)
		position.add(yane.lower[parameters.side][parameters.direction])

		return position;


	}
    
    create(parameters) {

		for (let i = 0; i < this.allVertices.length; i++) {

			const isTop = (i == this.allVertices.length - 1);

			const eachLayer = new EachLayer(this, i).create(isTop, parameters);

            this.add(eachLayer);

		}

        return this;

    }

	disposeLine() {

        this.line.group.children.forEach(child => {

			child.disposeLine();

        })

	}

	setTexture(parameters) {

		this.getEachLayers().forEach( function( eachLayer ) {

			eachLayer.setTexture(parameters)

		})

	}

	removeTexture() {
		
		this.getEachLayers().forEach( function( eachLayer ) {

			eachLayer.removeTexture();

		})

	}

	getEachLayers() {

		return this.children.filter(
		
			function(e) {return e.isEachLayer} 
		
		);

	}

	getEachLayer(layer) {

		return this.getEachLayers()[layer];

	}

	getPolygon() {

	}

	dispose() {

        this.getEachLayers().forEach(eachLayer => {
		
			eachLayer.dispose();
        
		})
	
	}
	
	setYaneColor(parameters = {}) {
		
		const eachLayers = this.getEachLayers()

		for (const eachLayer of eachLayers) {
		
			if (!eachLayer.yane) continue;
			
			eachLayer.yane.setColor(parameters)
			
		}
		
	}
	
	createHafuPreset(parameters) {
		
		if (HafuPresets[parameters.name]) {
			
			for (const hafu of HafuPresets[parameters.name]) {

				parameters.hafu = hafu
				this.createSimpleChidoriHafu(parameters)
				
			}
			
		}

	}
	
	createSimpleChidoriHafu(parameters) {

		if (!this.getEachLayer(parameters.hafu.layer)?.yane) {
			console.warn("this layer has no roofs.")
			return;
		}
		
		this.getEachLayer(parameters.hafu.layer).yane.createSimpleChidoriHafu(parameters)
		
	}
	
	getAllYaneBodyMesh() {
		
		const allBodyMesh = [];
		
		const eachLayers = this.getEachLayers()

	
		for (const eachLayer of eachLayers) {
		
			if (!eachLayer.yane) continue;
			
			const bodyMesh = eachLayer.yane.getAllBodyMesh()

			allBodyMesh.push(bodyMesh);
			
		}


        return allBodyMesh.flat().filter(

			function (e) { return e?.isMesh }

		);

	}

}

class EachLayer extends THREE.Group {

    constructor(yagura, layer) {

        super();

		this.isEachLayer = true;

        this.yagura = yagura;
        this.layer = layer;

        this.worldVertices = yagura.allVertices[layer];


		// 点Aを原点として考える
		this.worldPosition = this.worldVertices.A;
		this.position.set(this.worldPosition.x, this.worldPosition.y, this.worldPosition.z);


		this.origin = {

			A: new THREE.Vector3(0, 0, 0),
			B: new THREE.Vector3().subVectors(this.worldVertices.B, this.worldVertices.A),
			C: new THREE.Vector3().subVectors(this.worldVertices.C, this.worldVertices.A),
			D: new THREE.Vector3().subVectors(this.worldVertices.D, this.worldVertices.A)
		
		}


		this.lower = [

			this.origin.A.clone(),
			new THREE.Vector3(this.origin.B.x, this.origin.A.y, this.origin.A.z),
			this.origin.B.clone(),
			new THREE.Vector3(this.origin.A.x, this.origin.A.y, this.origin.B.z)
		
		]

		this.upper = [

			this.origin.C.clone(),
			new THREE.Vector3(this.origin.D.x, this.origin.C.y, this.origin.C.z),
			this.origin.D.clone(),
			new THREE.Vector3(this.origin.C.x, this.origin.C.y, this.origin.D.z)
		
		]

    }

	create(isTop, parameters = {}) {

		if (parameters.type == "line") {

			this.createLine(isTop, parameters);
		
		} else {

			this.createPolygon(isTop, parameters);
			
		}


		return this;
	}

    createLine( isTop = false, parameters ) {

        this.room = new Room(this).createLine(parameters);
        this.add(this.room);

        this.yane = new Yane(this);
		
		if (isTop) {
			
			this.yane.createTop(parameters);
			
		} else {

			this.yane.createLine(parameters);

		}
		
		this.add(this.yane);
        
		
		return this;

    }

    dispose() {
		
		this.room.dispose();
		this.yane.dispose();

    }

    createPolygon( top = false, parameters = {} ) {

        this.room = new Room(this).createPolygon(parameters);
        this.add(this.room);

        this.yane = new Yane(this);
        
		if (top) {
			
			this.yane.createTop(parameters);
			
		} else {

			this.yane.createPolygon(parameters);

		}
		
		this.add(this.yane);

        return this;

    }

    disposePolygon() {

    }

    disposeAll() {

        this.disposeLine();
        this.disposePolygon();

    }

	getVertices() {

		return {
		
			upper: this.upper,
			lower: this.lower
		
		}

	}

	getWalls() {
		
		if (!this.room?.polygon?.walls?.children) return [];

		return this.room.polygon.walls.children.filter(
		
			function(e) {return e.isWall}
		
		);

	}

	setTexture(parameters) {

		this.getWalls().forEach( function( wall ) {

			wall.setTexture(parameters)

		});

	}

	removeTexture() {
		
		this.getWalls().forEach( function( wall ) {

			wall.removeTexture();

		});
	
	}

	getSurroundingYanes() {

		if (!this.yane?.polygon?.children) return [];


		return this.yane.polygon.children.filter(
		
			function(e) {return e.isSurroundingYane}
		
		);

	}

}

class Room extends THREE.Group {

    constructor(eachLayer) {

        super();

		this.isRoom = true;

        this.eachLayer = eachLayer;
        this.worldVertices = eachLayer.worldVertices;
		this.origin = eachLayer.origin;


		this.line = new THREE.Group();
		this.add(this.line);

		this.polygon = new THREE.Group();
		this.add(this.polygon)

    }

    createLine() {

        const points = new ModelingSupporter().generateBoxLinePoints(

            this.origin.A,
            this.origin.B,
            this.origin.C,
            this.origin.D

        );
		
		const material = new MeshLineMaterial({color: 0x37A76F, lineWidth: 1})
		const mesh = new ModelingSupporter().generateLineMesh(points, material);

        this.line.add(mesh);


        return this;

    }

	createPolygon(parameters) {
		
		this.polygon.walls = this.generateWalls(parameters);
		this.polygon.add(this.polygon.walls);

		this.polygon.topFloor = this.generateFloor(this.eachLayer.upper, parameters)
		this.polygon.add(this.polygon.topFloor);

		this.polygon.bottomFloor = this.generateFloor(this.eachLayer.lower, parameters)
		this.polygon.add(this.polygon.bottomFloor);
		

		return this;
		
	}

	dispose() {

		this.line.children.forEach(child => {
			if (child.geometry) child.geometry.dispose();
			if (child.material) child.material.dispose();
		});
	
	}
	
    generateWalls(parameters) {
		
		const walls = new THREE.Group();
		
		// 4方向分壁を生成
		for (let dir = 0; dir < 4; dir++) {
			
			const dd = (dir + 1) % 4;
			
			const wall = new Wall(
				
				this.eachLayer.lower[ dir ],
				this.eachLayer.lower[ dd ],
				this.eachLayer.upper[ dir ],
				this.eachLayer.upper[ dd ],
				dir,
				this
				
			).generate(parameters);
			
			wall.rotation.y = Math.PI / 2 * dir;
			wall.position.set(this.eachLayer.lower[dir].x, this.eachLayer.lower[dir].y, this.eachLayer.lower[dir].z)
			

			walls.add(wall)
			
		}
		
		
		return walls;
		
	}
	
	generateFloor(vertices, parameters) {

		const floorPolygon = new FloorPolygon(vertices).generate(parameters);
		
		floorPolygon.position.set(vertices[0].x, vertices[0].y, vertices[0].z)

		
		return floorPolygon;

	}

}

class Wall extends THREE.Group {

	constructor(A, B, C, D, dir, room) {

		super();

		// 入力は4点と方向
		//   C---D
		//  /     \   
		// A-------B  --> x-axis

		// ^ z      2
		// |--> x  3 1 d:direction
		//          0

		this.isWall = true;

		this.dir = dir;
		
		this.room = room;
		this.PARAMS = room.eachLayer.yagura.PARAMS;
		this.changeLevel = room.eachLayer.yagura.changeLevel;

		const axis = new THREE.Vector3( 0, 1, 0 );
		const angle = Math.PI / 2 * -dir;

		// Aを原点とする
		this.A = new THREE.Vector3( 0, 0, 0 );
		this.B = new THREE.Vector3().subVectors( B, A ).applyAxisAngle( axis, angle );
		this.C = new THREE.Vector3().subVectors( C, A ).applyAxisAngle( axis, angle );
		this.D = new THREE.Vector3().subVectors( D, A ).applyAxisAngle( axis, angle );

	}

	generate(parameters) {
		
		if (!parameters.polygonType) parameters.polygonType = "whole";


		let material;

		if (parameters.polygonType == "whole") {

			material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
		
		} else if (parameters.polygonType == "black") {

			material = new THREE.MeshBasicMaterial( { color: 0x000000 } )

		}


		const geometry = new ModelingSupporter().generateRectangleGeometry(this.A, this.B, this.C, this.D);
		
		this.body = new THREE.Mesh(geometry, material);
		        
        this.body.receiveShadow = true;

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

		const chang = this.changeLevel.x * 1.5 / this.PARAMS.yagura.windowNum;

		const start = this.room.eachLayer.getVertices().lower[this.dir];
		const end = this.room.eachLayer.getVertices().lower[(this.dir+1)%4];
		
		let windowNum = Math.abs(
			Math.ceil( start.distanceTo( end ) / chang )
		);
		if (windowNum > 50) windowNum = 50;

		const num = windowNum;
		const type = 2;
		const width = chang / 3 * this.PARAMS.yagura.windowWidth;
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

	setTexture(parameters) {

		this.removeAllTexture();

		if (!parameters.modelPreset) parameters.modelPreset = {};
		if (!parameters.modelPreset.wallTexture) parameters.modelPreset.wallTexture = "window";

		switch (parameters.modelPreset.wallTexture) {

			case "shitamiitabari":
				this.generateShitamiitabari();
				break;

			case "window":
				this.generateMultipleWindow();
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

		const A = vertices[0].clone();
		const B = vertices[1].clone();
		const C = vertices[3].clone();
		const D = vertices[2].clone();

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