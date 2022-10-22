import * as THREE from '/build/three.module.js';

import { ModelingSupporter } from '../managers/ModelingSupporter.js'

/**
 * 石垣モデル関連のモデルクラス
 */
export class Ishigaki extends THREE.Group {
    constructor(PARAMS, P1, P2, P3) {
        super(); 

        this.PARAMS = PARAMS;
        this.ishigakiSteps = PARAMS.ishigakiSteps;

		this.A = P1.clone();
		this.B = P2.clone();
		this.D = P3.clone();
		this.C = new THREE.Vector3(
			this.B.x - (this.D.x - this.A.x),
			this.D.y,
			this.B.z - (this.D.z - this.A.z)
		);

        this.calcParameters();

        this.line;
        this.polygon;
    }

    calcParameters() {
		this.h = this.C.y - this.A.y;
        const b_rate = 50/44;
		this.b_x = (this.A.x - this.C.x) * b_rate;
		this.b_z = (this.A.z - this.C.z) * b_rate;
		this.d_x = (this.A.x - this.C.x) * (b_rate - 1);
		this.d_z = (this.A.z - this.C.z) * (b_rate - 1);

		this.delta_x = this.ishigakiSteps / (this.ishigakiSteps - 1) * this.d_x / this.h;
		this.delta_z = this.ishigakiSteps / (this.ishigakiSteps - 1) * this.d_z / this.h;
    }

    createLine() {
        this.line = new Line(this.PARAMS, this.A, this.B, this.D).create()
        return this.line;
    }

    createPolygon(type = "whole") {
        this.polygon = new Polygon(this.PARAMS, this.A, this.B, this.D).create(type)
        return this.polygon;
    }

	r(axis, sub) {
		let n = this.ishigakiSteps;

		let r = (axis == 'x') ? this.b_x / this.h : this.b_z / this.h;
		let delta = (axis == 'x') ? this.delta_x : this.delta_z;

		if (sub != n - 1) {
			for (let i = (n-1); i > sub; i--) {
				if (i != 0) r -= delta / i;
			}
		}
		return r;
	}

	changeLevel(axis, sub) {
		// y軸方向であればそのまま等分した量だけ増加
		// x、z軸方向であればrを計算し、適用して返す
		if (axis == 'y') {
			return this.h / this.ishigakiSteps;
		} else {
			return this.r(axis, sub) * this.h / this.ishigakiSteps;
		}
	}
}

class Line extends Ishigaki {
    constructor(PARAMS, P1, P2, P3) {
        super(PARAMS, P1, P2, P3);
    }

    create() {
		var tmpA = this.A.clone(), tmpB = this.B.clone(), tmpC = this.A.clone(), tmpD = this.B.clone();

		for (let i = 0; i < this.ishigakiSteps; i++) {
			tmpA = tmpC.clone();
			tmpB = tmpD.clone();
			// changeLevel(axis, sub) は軸方向axis、i段目を指すsubを引数として、各段ごとの差分を算出する。
			tmpC.x -= this.changeLevel('x', (this.ishigakiSteps-1)-i);
			tmpC.y += this.changeLevel('y', (this.ishigakiSteps-1)-i);
			tmpC.z -= this.changeLevel('z', (this.ishigakiSteps-1)-i);
			tmpD.x += this.changeLevel('x', (this.ishigakiSteps-1)-i);
			tmpD.y += this.changeLevel('y', (this.ishigakiSteps-1)-i);
			tmpD.z += this.changeLevel('z', (this.ishigakiSteps-1)-i);

            const material = new LineBasicMaterial({color: 0xFD7E00, linewidth: 20})
            const geometry = new ModelingSupporter().generateBoxLineGeometry(tmpA, tmpB, tmpC, tmpD);

            this.add(new THREE.Line(geometry, material));
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

class Polygon extends Ishigaki {
    constructor(PARAMS, P1, P2, P3) {
        super(PARAMS, P1, P2, P3);
    }

    create(type = "whole") {
		var tmpA = this.A.clone(), tmpB = this.B.clone(), tmpC = this.A.clone(), tmpD = this.B.clone();

		for (let i = 0; i < this.ishigakiSteps; i++) {
			tmpA = tmpC.clone();
			tmpB = tmpD.clone();
			// changeLevel(axis, sub) は軸方向axis、i段目を指すsubを引数として、各段ごとの差分を算出する。
			tmpC.x -= this.changeLevel('x', (this.ishigakiSteps-1)-i);
			tmpC.y += this.changeLevel('y', (this.ishigakiSteps-1)-i);
			tmpC.z -= this.changeLevel('z', (this.ishigakiSteps-1)-i);
			tmpD.x += this.changeLevel('x', (this.ishigakiSteps-1)-i);
			tmpD.y += this.changeLevel('y', (this.ishigakiSteps-1)-i);
			tmpD.z += this.changeLevel('z', (this.ishigakiSteps-1)-i);

            const geometry = new ModelingSupporter().generateBoxPolygonGeometry(tmpA, tmpB, tmpC, tmpD);

            let material;
            if (type == "whole") {
                material = this.addTexture(geometry, i);
            } else if (type == "black") {
                material = new THREE.MeshBasicMaterial({color: 0x000000})
            }
            // var material = new THREE.MeshLambertMaterial({color: 0xb4a294})

            const mesh = new THREE.Mesh(geometry, material);
            if (type == "whole") mesh.receiveShadow = true;

            this.add(mesh);
        }
        return this
    }

    addTexture(geometry, index) {
        for (let j = 0; j < geometry.faces.length; j++) {
            // if (j == 0 || j == 1 || j == geometry.faces.length - 2 || j == geometry.faces.length - 1) continue;
            
            const down = 1/this.ishigakiSteps*index;
            const up = 1/this.ishigakiSteps*(index+1);
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