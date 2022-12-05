import * as THREE from '/build/three.module.js';

import { LINE, POLYGON } from '../managers/Params.js'

import { ModelingSupporter } from '../managers/ModelingSupporter.js'
import { TransformControls } from '../controls/TransformControls.js';

import { SurroundingYane } from './Yane.js'


export class ChidoriHafu extends THREE.Group {

	constructor(PARAMS, width, height, depth) {

		super();

		this.isChidoriHafu = true;

		this.PARAMS = PARAMS;


		//       /\
		//      C  \
		//     / \  B    ^ y
		//    /   \/     |
		//   A-----      --> x
		//              /
		//             z

		this.width = width;
		this.height = height;
		this.depth = depth;
		this.alpha = 1/5;

		this.calcParameter();

	}

	calcParameter() {

		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3(this.width, 0, -1 * this.depth);
		this.C = new THREE.Vector3(this.width / 2, this.height, 0);

		this.steps = 5;
		this.L = Math.sqrt(Math.pow(this.C.x - this.A.x, 2) + Math.pow(this.C.y - this.A.y, 2));
		this.theta = Math.atan((this.C.y - this.A.y) / (this.C.x - this.A.x));

		this.originCurveVertices = this.calcOriginCurveVertices();
		
	}
	
	calcOriginCurveVertices () {

		const originCurveVertices = []

		for (let i = 0; i <= this.steps*2; i++) {
		
			const step = (i <= this.steps) ? i : (this.steps*2 - i);

			const tmpy = step * this.L / this.steps * (Math.sin(this.theta) - this.alpha * (this.steps - step) / this.steps * Math.cos(this.theta));
			const tmpx = this.C.x / this.steps * i;

			originCurveVertices.push( new THREE.Vector3(tmpx, tmpy, 0) );

		}

		return originCurveVertices;
		
	}

	create(parameters = {}) {

		if (!parameters.type) parameters.type = "polygon"
		if (!parameters.polygonType) parameters.polygonType = "whole"


		switch (parameters.type) {

			case "line":
				
				this.sideLineA = this.generateSide(parameters);
				
				this.sideLineA.position.set(
					-1 * (this.width) / 2,
					0,
					0
				);
				
				this.add(this.sideLineA);

				
				this.sideLineB = this.generateSide(parameters);
				
				this.sideLineB.position.set(
					-this.width/2,
					0,
					this.B.z
					
				);

				this.add(this.sideLineB);
		
				

				this.topLine = this.generateTop(parameters);
				
				this.topLine.position.set(
					-this.width/2,
					0,
					0
				);
				
				this.add(this.topLine)
				
				
				break;
		
			case "polygon":
				
				this.sidePolygonA = this.generateSide(parameters);

				this.sidePolygonA.position.set(
					-1 * (this.width) / 2,
					0,
					this.B.z / 50
				);
				
				this.add(this.sidePolygonA);
		

				this.sidePolygonB = this.generateSide(parameters);
				
				this.sidePolygonB.position.set(
					-this.width/2,
					0,
					this.B.z - this.B.z / 50
				);
				
				this.add(this.sidePolygonB);
		


				this.topPolygon = this.generateTop(parameters);

				this.topPolygon.position.set(
					-this.width / 2,
					0,
					0
				);

				this.add(this.topPolygon)
		

				if (parameters.type == "whole") {
				
					for (let i = 0; i < 3; i++) {

						const sideInnerPolygonA = this.generateSideInner(i);
						
						sideInnerPolygonA.position.set(
							-1 * (this.width) / 2,
							0,
							0 + this.B.z / 50 * i / 3
						);

						this.add(sideInnerPolygonA);
					
					}
		
					for (let i = 0; i < 3; i++) {
					
						const sideInnerPolygonB = this.generateSideInner(i);

						sideInnerPolygonB.position.set(
							-1 * (this.width) / 2,
							0,
							this.B.z - this.B.z / 50 * i / 3
						);

						this.add(sideInnerPolygonB);
					
					}

				}


				break;

		}

	}

	generateSide(parameters = {}) {

		if (!parameters.type) parameters.type = "polygon"
		if (!parameters.polygonType) parameters.polygonType = "whole";


		if (parameters.type == "line") {

			const material = new THREE.LineBasicMaterial({color: 0xFD7E00});
			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.originCurveVertices.length; i++) {

				geometry.vertices.push(this.originCurveVertices[i]);

			}

			
			return new THREE.Line(geometry, material);

		} else {

			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.originCurveVertices.length; i++) {
				
				geometry.vertices.push(new THREE.Vector3(this.originCurveVertices[i].x, 0, 0));	
				geometry.vertices.push(this.originCurveVertices[i]);
			
			}

			for (let i = 0; i < this.steps * 2; i++) {

				geometry.faces.push(new THREE.Face3(i*2 + 0, i*2 + 1, i*2 + 2));
				geometry.faces.push(new THREE.Face3(i*2 + 1, i*2 + 3, i*2 + 2));
			
			}


			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			let material;

			if (parameters.polygonType == "whole") {
			
				material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
			
			} else if (parameters.polygonType == "black") {
			
				material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide } );
			
			}

			const mesh = new THREE.Mesh(geometry, material);
			
			if (parameters.polygonType == "whole") {
			
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			
			}

			mesh.name = "side"
			
			
			return mesh
		
		}
	
	}

	generateSideInner(step) {
			
		const geometry = new THREE.Geometry();

		for (let i = 0; i < this.originCurveVertices.length; i++) {

			const tmp = this.originCurveVertices[i].y - (this.height * (step + 1) / 15);
			const lower = (tmp > 0) ? tmp : 0;

			geometry.vertices.push(new THREE.Vector3(this.originCurveVertices[i].x, lower, 0));
			geometry.vertices.push(this.originCurveVertices[i]);
		
		}

		for (let i = 0; i < this.steps * 2; i++) {

			geometry.faces.push(new THREE.Face3(i*2 + 0, i*2 + 1, i*2 + 2));
			geometry.faces.push(new THREE.Face3(i*2 + 1, i*2 + 3, i*2 + 2));

		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		const material = new THREE.MeshLambertMaterial({color: 0xDBD9E4, side: THREE.DoubleSide});

		const mesh = new THREE.Mesh(geometry, material);
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;


		return mesh;
	
	}

	generateTop(parameters = {}) {

		if (!parameters.type) parameters.type = "polygon"
		if (!parameters.polygonType) parameters.polygonType = "whole";


		if (parameters.type == "line") {

			const material = new THREE.LineBasicMaterial({color: 0xFD7E00});

			const geometry = new THREE.Geometry();

			geometry.vertices.push(new THREE.Vector3(this.width / 2, this.height, 0));
			geometry.vertices.push(new THREE.Vector3(this.width / 2, this.height, -this.depth));


			return new THREE.Line(geometry, material);
		
		
		} else {
			
			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.originCurveVertices.length; i++) {
			
				geometry.vertices.push(new THREE.Vector3(this.originCurveVertices[i].x, this.originCurveVertices[i].y, 0));
				geometry.vertices.push(new THREE.Vector3(this.originCurveVertices[i].x, this.originCurveVertices[i].y, this.B.z));
			
			}

			for (let i = 0; i < this.steps * 2; i++) {

				geometry.faces.push(new THREE.Face3(i*2 + 0, i*2 + 1, i*2 + 2));
				geometry.faces.push(new THREE.Face3(i*2 + 1, i*2 + 3, i*2 + 2));

			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			
			let material;

			if (parameters.polygonType == "whole") {
			
				material = new THREE.MeshLambertMaterial({color: 0x222227, side: THREE.DoubleSide});
			
			} else if (parameters.polygonType == "black") {
			
				material = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide})
			
			}

			const mesh = new THREE.Mesh(geometry, material);
			
			mesh.name = "top";
			
			
			return mesh;

		}

	}

	addController(sceneManager) {

        this.control = new TransformControls( sceneManager.currentCamera, sceneManager.renderer.domElement );
		
		this.control.showY = false;
        this.control.showZ = false;
        // control.setSpace("local")
        // this.control.addEventListener( 'change', () => { sceneManager.render } );

        // this.control.addEventListener( 'dragging-changed', function ( event ) {
        //     // sceneManager.orbit.enabled = ! event.value;
        // } );

        this.control.position.z -= this.depth;
        
		this.control.attach( this );
        
		sceneManager.scene.add( this.control );

	
		return this.control;
	
	}

	removeChildren() {
	
		this.children.forEach(object => this.remove(object));
	
	}

	getYaneComponent() {
	
		return this.parent;
	
	}

	addGUI(sceneManager) {
	
		this.params = {
	
			alpha: this.alpha,
			centerrate: 1/2,
			widthrate: this.width / this.getYaneComponent().getYaneSize().width,
			heightrate: this.height / this.getYaneComponent().getYaneSize().height,
			depthrate: this.depth / this.getYaneComponent().getYaneSize().depth,
			symmetric: true,
	
		}
    
	
		this.chidoriHafuGUIFolder = sceneManager.gui.addFolder('ChidoriHafu-' + this.PARAMS.hafu.length);
    
		this.chidoriHafuGUIFolder.add(this.params, 'alpha', 0, 1).onChange(() => {this.changeGUI(sceneManager)});
        this.chidoriHafuGUIFolder.add(this.params, 'centerrate', 0, 1).step(0.05).onChange(() => {this.changeGUI(sceneManager)});
        this.chidoriHafuGUIFolder.add(this.params, 'widthrate', 0, 1).step(0.05).onChange(() => {this.changeGUI(sceneManager)});
        this.chidoriHafuGUIFolder.add(this.params, 'heightrate', 0, 4).step(0.05).onChange(() => {this.changeGUI(sceneManager)});
        this.chidoriHafuGUIFolder.add(this.params, 'depthrate', 0, 1).step(0.05).onChange(() => {this.changeGUI(sceneManager)});
	
	}

	changeGUI(sceneManager) {
	
		this.alpha = this.params.alpha;

		this.center = new ModelingSupporter().calcInternalEquinox(this.getYaneComponent().A, this.getYaneComponent().B, this.params.centerrate);
		this.position.set(this.center.x, this.center.y, this.center.z + this.getYaneComponent().getYaneSize().depth)

		this.width = this.getYaneComponent().getYaneSize().width * this.params.widthrate
		this.height = this.getYaneComponent().getYaneSize().height * this.params.heightrate
		this.depth = this.getYaneComponent().getYaneSize().depth * this.params.depthrate
		
	
		this.removeChildren();
		this.calcParameter();
		// this.create(POLYGON);
	
		this.symmetricParams = {
	 
			layer: this.layer,
			dir: (this.dir + 2) % 4,
			alpha: this.params.alpha,
			centerrate: this.params.centerrate,
			widthrate: this.params.widthrate,
			heightrate: this.params.heightrate,
			depthrate: this.params.depthrate,
		
		}
		
		console.log(this.symmetricParams)
		
		this.getYaneComponent().createSimpleChidoriHafu(this.symmetricParams).create(POLYGON)

		
		sceneManager.render();
	
	}

	getTop() {
	
		return this.children.filter(function(child) {
	
			return child.name == "top"
	
		})
	
	}

	setColor(parameters = {}) {

        if (!parameters.modelPreset?.yaneColor) {

            console.info("color is not signed.");
            
            return;

        }

		this.getTop().forEach( function (mesh) {
	
			mesh.material.color.setHex(parameters.modelPreset.yaneColor);
	
		})
	
	}

}

export class IrimoyaHafu extends THREE.Group {

	constructor(PARAMS, A, B, C, D) {

		super();

		//     E----F    ^ y
		//    /     /\   |
		//   C--------D  --> x
		//  /       |  \
		// A------------B
	
		this.isIrimoyaHafu = true;


		this.PARAMS = PARAMS;
		this.steps = 5;

		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A);
		this.C = new THREE.Vector3().subVectors(C, A);
		this.D = new THREE.Vector3().subVectors(D, A);
		this.E = new THREE.Vector3(0, this.C.y * 3, (this.C.z + this.D.z) / 2);
		this.F = new THREE.Vector3(B.x, this.C.y * 3, (this.C.z + this.D.z) / 2)

	}

	generate(parameters) {

		this.lower = new SurroundingYane(this.PARAMS, this.A, this.B, this.C, this.D);
		this.lower.create(parameters)

		this.add(this.lower)


		this.upper = new ChidoriHafu(
			this.PARAMS,
			this.C.z - this.D.z,
			this.E.y - this.C.y,
			this.C.x - this.D.x
		);

		this.upper.create(parameters)
		
		this.upper.rotation.y = Math.PI / 2;
		this.upper.position.set(this.C.x, this.C.y, (this.C.z + this.D.z)/2)
		
		this.add(this.upper)


		return this;
	
	}

	setColor(parameters) {

		this.lower.setBodyColor(parameters)
		this.upper.setColor(parameters)

	}

}