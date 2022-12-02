import * as THREE from '/build/three.module.js';

import { ModelingSupporter } from '../managers/ModelingSupporter.js'

/**
 * 石垣モデル関連のモデルクラス
 */
export class Ishigaki extends THREE.Group {

    constructor(PARAMS, P1, P2, P3) {

        super(); 

        this.isIshigaki = true;

        this.PARAMS = PARAMS;
        this.steps = PARAMS.ishigaki.steps;

		this.A = P1.clone();
		this.B = P2.clone();
		this.D = P3.clone();
		this.C = new THREE.Vector3(
			this.B.x - (this.D.x - this.A.x),
			this.D.y,
			this.B.z - (this.D.z - this.A.z)
		);

        this.calcParameters();


        this.line = new THREE.Group();
		this.add(this.line);

		this.polygon = new THREE.Group();
		this.add(this.polygon)


        return this;

    }

    calcParameters() {

		this.h = this.C.y - this.A.y;
        
        
        const bRate = 50 / 44;

		this.b_x = (this.A.x - this.C.x) * bRate;
		this.b_z = (this.A.z - this.C.z) * bRate;
		this.d_x = (this.A.x - this.C.x) * (bRate - 1);
		this.d_z = (this.A.z - this.C.z) * (bRate - 1);

		this.delta_x = this.steps / (this.steps - 1) * this.d_x / this.h;
		this.delta_z = this.steps / (this.steps - 1) * this.d_z / this.h;
    
    }

    createLine(parameters) {

        new Line(this).create(parameters)
        
        return this;
    
    }

    createPolygon(parameters) {
        
        new Polygon(this).create(parameters)
        
        return this;
    
    }

	calc_r(axis, sub) {
		
        let n = this.steps;

		let r = (axis == 'x') ? (this.b_x / this.h) : (this.b_z / this.h);
		let delta = (axis == 'x') ? this.delta_x : this.delta_z;

		if (sub != n - 1) {

			for (let i = (n-1); i > sub; i--) {
			
                if (i != 0) {
                    
                    r -= delta / i;
                
                }
			
            }
		
        }
		
        
        return r;
	
    }

	changeLevel(axis, sub) {

		// y軸方向であればそのまま等分した量だけ増加
		// x、z軸方向であればrを計算し、適用して返す
		if (axis == 'y') {

            return this.h / this.steps;

        }
		

        const r = this.calc_r(axis, sub);

        return r * this.h / this.steps;
	
	}

    dispose() {

    }

}

class Line {
    constructor(ishigaki) {

        this.ishigaki = ishigaki;

    }

    create(parameters) {

		let tmpA = this.ishigaki.A.clone();
        let tmpB = this.ishigaki.B.clone();
        let tmpC = this.ishigaki.A.clone();
        let tmpD = this.ishigaki.B.clone();


		for (let i = 0; i < this.ishigaki.steps; i++) {
		
            tmpA = tmpC.clone();
			tmpB = tmpD.clone();
		
            // changeLevel(axis, sub) は軸方向axis、i段目を指すsubを引数として、各段ごとの差分を算出する。
			tmpC.x -= this.ishigaki.changeLevel('x', (this.ishigaki.steps - 1) - i);
			tmpC.y += this.ishigaki.changeLevel('y', (this.ishigaki.steps - 1) - i);
			tmpC.z -= this.ishigaki.changeLevel('z', (this.ishigaki.steps - 1) - i);
		
            tmpD.x += this.ishigaki.changeLevel('x', (this.ishigaki.steps - 1) - i);
			tmpD.y += this.ishigaki.changeLevel('y', (this.ishigaki.steps - 1) - i);
			tmpD.z += this.ishigaki.changeLevel('z', (this.ishigaki.steps - 1) - i);

        
            const material = new THREE.LineBasicMaterial({color: 0xFD7E00, linewidth: 20})
            const geometry = new ModelingSupporter().generateBoxLineGeometry(tmpA, tmpB, tmpC, tmpD);

        
            this.ishigaki.line.add(new THREE.Line(geometry, material));
        }

        
        return this;

    }

    dispose() {

        this.ishigaki.line.children.forEach(child => {

            child.material.dispose();
            child.geometry.dispose();

        })
    
    }

}

class Polygon {

    constructor(ishigaki) {

        this.ishigaki = ishigaki;
    
    }

    create(parameters = {}) {

        if (!parameters.polygonType) parameters.polygonType = "whole";


		let tmpA = this.ishigaki.A.clone()
        let tmpB = this.ishigaki.B.clone()
        let tmpC = this.ishigaki.A.clone()
        let tmpD = this.ishigaki.B.clone();

		
        for (let i = 0; i < this.ishigaki.steps; i++) {
		
            tmpA = tmpC.clone();
			tmpB = tmpD.clone();
		
            // changeLevel(axis, sub) は軸方向axis、i段目を指すsubを引数として、各段ごとの差分を算出する。
			tmpC.x -= this.ishigaki.changeLevel('x', (this.ishigaki.steps - 1) - i);
			tmpC.y += this.ishigaki.changeLevel('y', (this.ishigaki.steps - 1) - i);
			tmpC.z -= this.ishigaki.changeLevel('z', (this.ishigaki.steps - 1) - i);
		
            tmpD.x += this.ishigaki.changeLevel('x', (this.ishigaki.steps - 1) - i);
			tmpD.y += this.ishigaki.changeLevel('y', (this.ishigaki.steps - 1) - i);
			tmpD.z += this.ishigaki.changeLevel('z', (this.ishigaki.steps - 1) - i);


            const geometry = new ModelingSupporter().generateBoxPolygonGeometry(tmpA, tmpB, tmpC, tmpD);

            
            let material;
            
            if (parameters.polygonType == "whole") {
            
                material = this.addTexture(geometry, i);
            
            } else if (parameters.polygonType == "black") {
            
                material = new THREE.MeshBasicMaterial({color: 0x000000})
            
            }
            
            // var material = new THREE.MeshLambertMaterial({color: 0xb4a294})

            
            const mesh = new THREE.Mesh(geometry, material);
            
            if (parameters.polygonType == "whole") mesh.receiveShadow = true;

            this.ishigaki.polygon.add(mesh);
       
        }


        return this;

    }

    addTexture(geometry, index) {
        for (let j = 0; j < geometry.faces.length; j++) {
            // if (j == 0 || j == 1 || j == geometry.faces.length - 2 || j == geometry.faces.length - 1) continue;
            
            const down = 1/this.ishigaki.steps*index;
            const up = 1/this.ishigaki.steps*(index+1);
            if (j % 2 == 0) {
                geometry.faceVertexUvs[0].push([
                    new THREE.Vector2(0.0, down),
                    new THREE.Vector2(1.0, down),
                    new THREE.Vector2(0.0, up)
                ])
            } else {
                geometry.faceVertexUvs[0].push([
                    new THREE.Vector2(1.0, down),
                    new THREE.Vector2(1.0, up),
                    new THREE.Vector2(0.0, up)
                ])
            }
        }

        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load('texture/ishigaki.png');

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        return new THREE.MeshLambertMaterial({map:texture})
    }

}