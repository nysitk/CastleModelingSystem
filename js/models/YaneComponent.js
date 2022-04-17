import * as THREE from '/build/three.module.js';

import { LINE, POLYGON, PARAMS } from '../managers/Params.js'

import { ModelingSupporter } from '../managers/ModelingSupporter.js'
import { ChidoriHafu, IrimoyaHafu } from './Hafu.js'

export class YaneComponent extends THREE.Group {
	constructor(A, B, C, D, direction, tarukiInterval) {
		super();
		// 入力は4点と方向
		//   C---D
		//  /     \   
		// A-------B  --> x-axis

		// ^ z      2
		// |--> x  3 1 d:direction
		//          0

		this.direction = direction;
		const axis = new THREE.Vector3( 0, 1, 0 );
		const angle = Math.PI / 2 * -(this.direction);

        this.originVertices = {A:A.clone(), B:B.clone(), C:C.clone(), D:D.clone()};

		// Aを原点とする
		this.A = new THREE.Vector3(0, 0, 0);
		this.B = new THREE.Vector3().subVectors(B, A).applyAxisAngle( axis, angle );
		this.C = new THREE.Vector3().subVectors(C, A).applyAxisAngle( axis, angle );
		this.D = new THREE.Vector3().subVectors(D, A).applyAxisAngle( axis, angle );

        this.tarukiInterval = tarukiInterval;
        this.calcParameters();

        this.vertices = this.calcVertices();
	}

    calcParameters() {
		this.tarukiNum = Math.ceil(this.getYaneSize().width / this.tarukiInterval)+1;
		if (this.tarukiNum > 100) this.tarukiNum = 100;

		this.sei = this.tarukiInterval * PARAMS.seiRatio;

        this.kayaoiThick = this.tarukiInterval / 2.0;
        this.kawarabohThick = this.tarukiInterval / 8.0;
    }

    calcVertices() {
        const vertices = {
            lower: [],
            upper: []
        }

		const bottom = new THREE.Vector3(0, 0, 0);

		for (let i = 0; i <= this.tarukiNum; i++) {

            vertices.lower.push(this.calcLowerVertex(i, bottom))
            vertices.upper.push(this.calcUpperVertex(bottom))

			bottom.x += (this.B.x - this.A.x) / this.tarukiNum;
		}

        return vertices
    }

    calcLowerVertex(i, bottom) {
        const lowerVertex = bottom.clone();

		let count = 0;

        if (i < 8) {
            count = 7 - i;
        } else if (i > this.tarukiNum - 8) {
            count = i - (this.tarukiNum - 7);
        } else {
            count = 0;
        }

        lowerVertex.y = this.sei * count * (count+1) / 8 / 7;
        return lowerVertex.clone();

    }

    calcUpperVertex(bottom) {
        const lowerVertex = bottom.clone();

        let grad = this.C.z / this.C.x;
        const changeLevel = this.C.z;
        // 向かって左側。
        let changeZ = (changeLevel < grad * (lowerVertex.x)) ? grad * (lowerVertex.x) : changeLevel;
        
        if (changeZ == changeLevel) {
            grad = this.C.z / -(this.D.x - this.B.x);
            // 向かって右側。
            changeZ = (changeLevel < grad * (this.B.x - lowerVertex.x)) ? grad * (this.B.x - lowerVertex.x) : changeLevel;
        }
        
        const Ycoordinate = this.sei + (this.C.y - this.sei) * Math.pow(changeZ / changeLevel, 2);
        return new THREE.Vector3(lowerVertex.x, Ycoordinate, lowerVertex.z + changeZ);

    }

    generateBody(MODE) {
        switch(MODE) {
            case LINE:
                this.body = new YaneBody(this.vertices)
                this.add(this.body.generateLine());
                break;
            case POLYGON:
                this.body = new YaneBody(this.vertices)
                this.add(this.body.generatePolygon());
                break;
        }
    }

    generateKawaraboh(MODE) {
        switch(MODE) {
            case LINE:
                break;
            case POLYGON:
                this.kawarabohGroup = new KawarabohGroup(this.vertices, this.kawarabohThick)
                this.add(this.kawarabohGroup.generatePolygon());
                break;
        }
    }

    generateKawara(MODE) {
        switch(MODE) {
            case LINE:
                break;
            case POLYGON:
                this.kawaraGroup = new KawaraGroup(this.vertices);
                this.add(this.kawaraGroup.generatePolygon())
                break;
        }
    }

    generateKayaoi(MODE) {
        switch(MODE) {
            case LINE:
                break;
            case POLYGON:
                this.kayaoi = new Kayaoi(this.vertices, this.kayaoiThick)
                this.add(this.kayaoi.generatePolygon());
                break;
        }
    }

    getYaneSize() {
		return {
			center: new THREE.Vector3().addVectors(this.A, this.B).multiplyScalar(0.5),
            sumimuneWidth: this.B.x - this.D.x,
			width: this.A.distanceTo(this.B),
			height: this.C.y - this.A.y,
			depth: this.C.z - this.A.z
		}
    }

	addChidoriHafu(lowerCenter, width, height, depth, MODE) {
		const chidoriHafu = new ChidoriHafu(width, height, depth);
        
		chidoriHafu.create(MODE);
		chidoriHafu.position.set(lowerCenter.x, lowerCenter.y, lowerCenter.z + depth)

        chidoriHafu.name = "chidoriHafu";
		this.add(chidoriHafu)
        PARAMS.hafu.push(chidoriHafu)

        return chidoriHafu;
	}

	createSimpleChidoriHafu(params, MODE) {
		return this.addChidoriHafu(
			new ModelingSupporter().calcInternalEquinox(this.A, this.B, params.center),
			this.getYaneSize().width * params.widthrate,
			this.getYaneSize().height * params.heightrate,
			this.getYaneSize().depth * params.depthrate,
			MODE
		)
	}
    
    setBodyColor(color) {
        this.body.getMesh().material.color.setHex(color);
    }
    
    setHafuColor(color) {
        this.getChidoriHafu().forEach(function(chidoriHafu) {
            chidoriHafu.setColor(color);
        })
    }

    getSurroundingYane() {
        return this.parent;
    }

    getChidoriHafu() {
        return this.children.filter(function (child) {
            return child.name == "chidoriHafu"
        })
    }
}

class YaneBody extends THREE.Group {
    constructor(vertices) {
        super();

        this.vertices = vertices;

    }

	generateLine() {

        const material = new THREE.LineBasicMaterial({color: 0xFFFFFF});

        const upperGeometry = new THREE.Geometry();
        const lowerGeometry = new THREE.Geometry();

        for (let i = 0; i < this.vertices.upper.length; i++) {
            upperGeometry.vertices.push(this.vertices.upper[i]);
            lowerGeometry.vertices.push(this.vertices.lower[i]);
        }

        this.upperLine = new THREE.Line(upperGeometry, material);
        this.add(this.upperLine);

        this.lowerLine = new THREE.Line(lowerGeometry, material);
        this.add(this.lowerLine);

        return this

    }

    generatePolygon() {

        const geometry = new THREE.Geometry();

        for (let i = 0; i < this.vertices.upper.length; i++) {
        	geometry.vertices.push(this.vertices.upper[i]);
        	geometry.vertices.push(this.vertices.lower[i]);
        }

        for (let j = 0; j < geometry.vertices.length - 1; j=j+2) {

        	if (j+2 > geometry.vertices.length - 1) break;

        	// geometry.faces.push(new THREE.Face3(j, j+2, j+3));
        	// geometry.faces.push(new THREE.Face3(j, j+3, j+1));
        	geometry.faces.push(new THREE.Face3(j, j+3, j+2));
        	geometry.faces.push(new THREE.Face3(j, j+1, j+3));
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({color: 0x222227, emissive:0x0, side: THREE.DoubleSide, vertexColors: true});
        this.body = new THREE.Mesh(geometry, material);

        // this.body.receiveShadow = true;
        this.body.castShadow = true;

        this.add(this.body);
        
        const wire = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true});
        // const wireMesh = new THREE.Mesh(geometry, wire);
        // this.add(wireMesh);

        return this;
	}

    getMesh() {
        return this.body;
    }

    createInitialChidoriHafu(sceneManager) {
        const param = {
			center: 1/2,
			widthrate: 1/2,
			heightrate: 2,
			depthrate: 1
		}
        
        const chidoriHafu = this.parent.createSimpleChidoriHafu(param, POLYGON);
        // const control = chidoriHafu.addController(sceneManager);
        const chidoriHafuGUI = chidoriHafu.addGUI(sceneManager);

        return chidoriHafu
    }

    getYaneComponent() {
        return this.parent;
    }

    getSurroundingYane() {
        return this.getYaneComponent().getSurroundingYane();
    }

    getYane() {
        return this.getSurroundingYane().getYane();
    }
}

class KawaraGroup extends THREE.Group {
    constructor(vertices) {
        super();

        this.vertices = vertices;
        this.eachWidth = vertices.lower[1].x - vertices.lower[0].x;

        this.calcParameters();

        this.columns = [];
    }

    calcParameters() {
        this.hiragawaraWidth = this.eachWidth;
        this.hiragawaraThick = this.hiragawaraWidth / 10;
        this.sun = this.hiragawaraWidth / 9; // 九寸判の場合
        this.hiragawaraInclination = this.calcHiragawaraInclination();
        this.hiragawaraInterval = this.hiragawaraThick / Math.sin(this.hiragawaraInclination)
        
        this.marugawaraWidth = this.hiragawaraWidth / 8 * 3 / 2;

        this.hiragawaraGeometry = new ModelingSupporter().generateSimpleBoxPolygonGeometry(
            this.hiragawaraWidth,
            this.hiragawaraWidth,
            this.hiragawaraThick
        )
        this.hiragawaraMaterial = new THREE.MeshLambertMaterial({color: 0x222227, side: THREE.DoubleSide});

        this.marugawaraGeometry = new THREE.CylinderGeometry(
            this.marugawaraWidth,
            this.marugawaraWidth,
            this.hiragawaraWidth, 8, 1, false, 0, Math.PI);
        this.marugawaraMaterial = new THREE.MeshLambertMaterial({color: 0x252529, side: THREE.DoubleSide});
    }

    calcHiragawaraInclination() {
        this.fukiashi = (this.hiragawaraWidth - 1 * this.sun) / 2; // 葺き足
        return Math.atan(this.hiragawaraThick / (this.fukiashi - 1 * this.sun))
    }

    generatePolygon() {

        for (let i = 0; i < this.vertices.upper.length - 1; i++) {
            const upperVertex = this.vertices.upper[i];
            const lowerVertex = this.vertices.lower[i];
            const kawaraColumn = new KawaraColumn(upperVertex, lowerVertex, this.eachWidth);
            this.columns.push(kawaraColumn);
            this.add(kawaraColumn);

            kawaraColumn.generatePolygon();
            
            kawaraColumn.rotation.x = Math.PI - Math.atan((upperVertex.y - lowerVertex.y)/upperVertex.z);
            kawaraColumn.position.set(lowerVertex.x, lowerVertex.y + this.eachWidth / 10, lowerVertex.z)
        }

        return this;

    }
}

class KawaraColumn extends THREE.Group {
    constructor(upperVertex, lowerVertex, hiragawaraWidth) {
        super();

        this.upperVertex = upperVertex.clone();
        this.lowerVertex = lowerVertex.clone();

        this.hiragawaras = []
        this.marugawaras = []
    }

    generatePolygon() {
        
        const distance = this.upperVertex.distanceTo(this.lowerVertex);
        let num = 0;

        while ((this.parent.hiragawaraInterval) * num < distance) {
        // while ((this.parent.hiragawaraWidth) * num < distance) {
            const hiragawara = this.generateHiragawara(num);
            this.hiragawaras.push(hiragawara);
            this.add(hiragawara);

            const marugawara = this.generateMarugawara(num);
            this.marugawaras.push(marugawara);
            this.add(marugawara);

            num++;
        }

        this.kawaraNum = num;
        return this;
    }

    generateHiragawara(num) {
        const hiragawara = new THREE.Mesh(this.parent.hiragawaraGeometry, this.parent.hiragawaraMaterial);
        hiragawara.rotation.x = -1 * this.parent.hiragawaraInclination;
        hiragawara.position.set(0, 0, (this.parent.hiragawaraInterval) * num)
        // hiragawara.position.set(0, 0, (this.parent.hiragawaraWidth) * num)
        
        // hiragawara.receiveShadow = true;
        // hiragawara.castShadow = true;
        
        return hiragawara;
    }

    generateMarugawara(num) {
        const marugawara = new THREE.Mesh(this.parent.marugawaraGeometry, this.parent.marugawaraMaterial);
        marugawara.rotation.y = -1 * Math.PI / 2;
        marugawara.rotation.x = Math.PI / 2;
        marugawara.position.set(0, 0, (this.parent.hiragawaraInterval) * num + this.parent.hiragawaraWidth / 2)
        // marugawara.position.set(0, 0, (this.parent.hiragawaraWidth) * num + this.parent.hiragawaraWidth / 2)
        
        // marugawara.receiveShadow = true;
        // marugawara.castShadow = true;
        
        return marugawara;
    }
}

class KawarabohGroup extends THREE.Group {
    constructor(vertices, kawarabohThick) {
        super();

        this.vertices = vertices;
        this.thick = kawarabohThick;

        this.bodies = [];

    }

    generatePolygon() {

        for (let i = 0; i < this.vertices.upper.length; i++) {
            const upperVertex = this.vertices.upper[i];
            const lowerVertex = this.vertices.lower[i];
            const length = upperVertex.distanceTo(lowerVertex);

            const geometry = new ModelingSupporter().generateBoxPolygonGeometry(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(this.thick, 0, length),
                new THREE.Vector3(0, this.thick, 0),
                new THREE.Vector3(this.thick, this.thick, length)
            )
            const material = new THREE.MeshPhongMaterial({color: 0x555555, side: THREE.DoubleSide});

            const mesh = new THREE.Mesh(geometry, material);

            mesh.rotation.x = Math.PI - Math.atan((upperVertex.y - lowerVertex.y)/upperVertex.z);
            mesh.position.set(lowerVertex.x, lowerVertex.y + this.thick, lowerVertex.z)

            this.bodies.push(mesh);
            this.add(mesh);
        }

        return this;
    }
}

class Kayaoi extends THREE.Group {
    constructor(vertices, kayaoiThick) {
        super();

        this.vertices = vertices;
        this.thick = kayaoiThick;

        this.body;

    }

    generatePolygon() {
        const geometry = new THREE.Geometry();

        for (const l of this.vertices.lower) {
            geometry.vertices.push(l.clone());
            geometry.vertices.push(new THREE.Vector3(l.x, l.y, l.z - this.thick));
            geometry.vertices.push(new THREE.Vector3(l.x, l.y - this.thick, l.z - this.thick));
            geometry.vertices.push(new THREE.Vector3(l.x, l.y - this.thick, l.z));
        }

        geometry.faces.push(new THREE.Face3(0, 1, 3));
        geometry.faces.push(new THREE.Face3(1, 2, 3));

        for (let j=0; j+1 < geometry.vertices.length / 4; j++) {
            // if (j+8 > kayaoi_geometry.vertices.length - 1) break;
            for (let k=0; k<4; k++) {
                if (k==3) {
                    geometry.faces.push(new THREE.Face3(4*j+k, 4*j+k+4, 4*j+k+1));
                    geometry.faces.push(new THREE.Face3(4*j+k, 4*j+k+1, 4*j+k-3));
                } else {
                    geometry.faces.push(new THREE.Face3(4*j+k, 4*j+k+4, 4*j+k+5));
                    geometry.faces.push(new THREE.Face3(4*j+k, 4*j+k+5, 4*j+k+1));
                }
            }
        }

        const l = geometry.vertices.length - 4;
        // console.log(l+4);
        geometry.faces.push(new THREE.Face3(l+0, l+3, l+1));
        geometry.faces.push(new THREE.Face3(l+1, l+3, l+2));

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

		const material = new THREE.MeshLambertMaterial({color: 0xCBC9D4, side: THREE.DoubleSide});
        this.body = new THREE.Mesh(geometry, material);
        this.add(this.body);

        return this;
    }
    
}