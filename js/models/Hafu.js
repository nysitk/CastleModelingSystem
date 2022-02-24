import * as THREE from '/build/three.module.js';

import { LINE, POLYGON, PARAMS } from '../managers/Params.js'

import { ModelingSupporter } from '../managers/ModelingSupporter.js'
import { TransformControls } from '../controls/TransformControls.js';
import { Yane, SurroundingYane } from './Yane.js'

export class ChidoriHafu extends THREE.Group {
	constructor(width, height, depth) {
		super();


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

		this.origin_curve_vertices = [];

		for (let i = 0; i <= this.steps*2; i++) {
			var step = i <= this.steps ? i : this.steps*2 - i;
			var tmpy = step * this.L / this.steps * (Math.sin(this.theta) - this.alpha * (this.steps - step) / this.steps * Math.cos(this.theta));
			var tmpx = this.C.x / this.steps * i;
			this.origin_curve_vertices.push(new THREE.Vector3(tmpx, tmpy, 0))
		}
	}

	create(MODE) {
		if (MODE==LINE) {
			this.lineA = this.generate_side(MODE);
			this.lineA.position.set(-1 * (this.width) / 2, 0, 0);
			this.add(this.lineA);
			this.lineB = this.generate_side(MODE);
			this.lineB.position.set(-this.width/2, 0, this.B.z);
			this.add(this.lineB);

			this.lineTop = this.generate_top(MODE);
			this.lineTop.position.set(-this.width/2, 0, 0);
			this.add(this.lineTop)
		} else if (MODE==POLYGON) {
			this.sideA = this.generate_side(MODE);
			this.sideA.position.set(-1 * (this.width) / 2, 0, 0 + this.B.z/50);
			this.add(this.sideA);

			for (let i = 0; i < 3; i++) {
				const sideA2 = this.generate_side_inner(i);
				sideA2.position.set(-1 * (this.width) / 2, 0, 0 + this.B.z/50 * i / 3);
				this.add(sideA2);
			}

			this.sideB = this.generate_side(MODE);
			this.sideB.position.set(-this.width/2, 0, this.B.z - this.B.z/50);
			this.add(this.sideB);

			for (let i = 0; i < 3; i++) {
				const sideA2 = this.generate_side_inner(i);
				sideA2.position.set(-1 * (this.width) / 2, 0, this.B.z - this.B.z/50 * i / 3);
				this.add(sideA2);
			}

			this.top = this.generate_top(MODE);
			this.top.position.set(-this.width/2, 0, 0);
			this.add(this.top)
		}

	}

	generate_side(MODE) {
		if (MODE==LINE) {
			const material = new THREE.LineBasicMaterial({color: 0xCCFFCC});

			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.origin_curve_vertices.length; i++) {
				geometry.vertices.push(this.origin_curve_vertices[i]);
			}
			return new THREE.Line(geometry, material);
		} else if (MODE==POLYGON) {
			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.origin_curve_vertices.length; i++) {
				geometry.vertices.push(new THREE.Vector3(this.origin_curve_vertices[i].x, 0, 0));
				geometry.vertices.push(this.origin_curve_vertices[i]);
			}

			for (let i=0; i<this.steps*2; i++) {
				geometry.faces.push(new THREE.Face3(i*2, i*2+1, i*2+2));
				geometry.faces.push(new THREE.Face3(i*2+1, i*2+3, i*2+2));
			}
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			const material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});

			const mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			return mesh
		}
	}

	generate_side_inner(step) {
			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.origin_curve_vertices.length; i++) {
				let tmp = this.origin_curve_vertices[i].y - this.height * (step+1) / 15;
				let lower = tmp > 0 ? tmp : 0;
				geometry.vertices.push(new THREE.Vector3(this.origin_curve_vertices[i].x, lower, 0));
				geometry.vertices.push(this.origin_curve_vertices[i]);
			}

			for (let i=0; i<this.steps*2; i++) {
				geometry.faces.push(new THREE.Face3(i*2, i*2+1, i*2+2));
				geometry.faces.push(new THREE.Face3(i*2+1, i*2+3, i*2+2));
			}
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			const material = new THREE.MeshLambertMaterial({color: 0xDBD9E4, side: THREE.DoubleSide});

			const mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			return mesh;
	}

	generate_top(MODE) {
		if (MODE==LINE) {
			const material = new THREE.LineBasicMaterial({color: 0xCCFFCC});

			const geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(this.width/2, this.height, 0));
			geometry.vertices.push(new THREE.Vector3(this.width/2, this.height, -this.depth));

			return new THREE.Line(geometry, material);
		} else if (MODE==POLYGON) {
			const geometry = new THREE.Geometry();

			for (let i = 0; i < this.origin_curve_vertices.length; i++) {
				geometry.vertices.push(new THREE.Vector3(this.origin_curve_vertices[i].x, this.origin_curve_vertices[i].y, 0));
				geometry.vertices.push(new THREE.Vector3(this.origin_curve_vertices[i].x, this.origin_curve_vertices[i].y, this.B.z));
			}

			for (let i=0; i<this.steps*2; i++) {
				geometry.faces.push(new THREE.Face3(i*2, i*2+1, i*2+2));
				geometry.faces.push(new THREE.Face3(i*2+1, i*2+3, i*2+2));
			}
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			const material = new THREE.MeshLambertMaterial({color: 0x222227, side: THREE.DoubleSide});

			return new THREE.Mesh(geometry, material);

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
		}
        this.chidoriHafuGUIFolder = sceneManager.gui.addFolder('ChidoriHafu' + PARAMS.hafu.length);
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
		this.create(POLYGON);

		sceneManager.render();
	}
}

export class IrimoyaHafu extends THREE.Group {
	constructor(A, B, C, D) {
		super();

		//     E----F    ^ y
		//    /     /\   |
		//   C--------D  --> x
		//  /       |  \
		// A------------B
		this.steps = 5;

		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A);
		this.C = new THREE.Vector3().subVectors(C, A);
		this.D = new THREE.Vector3().subVectors(D, A);
		this.E = new THREE.Vector3(0, this.C.y * 3, (this.C.z + this.D.z) / 2);
		this.F = new THREE.Vector3(B.x, this.C.y * 3, (this.C.z + this.D.z) / 2)


	}

	generate(MODE) {

		this.lower = new SurroundingYane(this.A, this.B, this.C, this.D);
		this.lower.create(MODE)
		this.add(this.lower)
		this.upper = new ChidoriHafu(
			this.C.z - this.D.z,
			this.E.y - this.C.y,
			this.C.x - this.D.x
		);
		this.upper.create(MODE)
		this.upper.rotation.y = Math.PI / 2;
		this.upper.position.set(this.C.x, this.C.y, (this.C.z + this.D.z)/2)
		this.add(this.upper)
	}
}