import * as THREE from '/build/three.module.js';

/**
 * モデル生成補助
 */
export class ModelingSupporter {
    generateBoxLineGeometry(A, B, C, D) {
        var geometry = new THREE.Geometry();
    
        geometry.vertices.push(new THREE.Vector3(A.x, A.y, A.z));
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, C.z));
        geometry.vertices.push(new THREE.Vector3(A.x, A.y, B.z));
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, D.z));
        geometry.vertices.push(new THREE.Vector3(B.x, B.y, B.z));
        geometry.vertices.push(new THREE.Vector3(D.x, D.y, D.z));
        geometry.vertices.push(new THREE.Vector3(B.x, B.y, A.z));
        geometry.vertices.push(new THREE.Vector3(D.x, D.y, C.z));
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, C.z));
        geometry.vertices.push(new THREE.Vector3(D.x, C.y, C.z));
        geometry.vertices.push(new THREE.Vector3(D.x, C.y, D.z));
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, D.z));
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, C.z));
    
        // for (let i=0; i<5; i++) {
        // 	geometry.vertices = line_vertices[i];
        // 	geometry.verticesNeedUpdate = true;
        // 	geometry.elementNeedUpdate = true;
        // 	geometry.computeFaceNormals();
        // }
        return geometry;
    }

    generateSimpleBoxPolygonGeometry(width, depth, height) {
        const g = this.generateBoxPolygonBufferGeometry(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(width, 0, depth),
            new THREE.Vector3(0, height, 0),
            new THREE.Vector3(width, height, depth)
        )
        return g;
    }

    generateBoxPolygonBufferGeometry(A, B, C, D) {
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array([
            A.x, A.y, A.z,
            B.x, A.y, A.z,
            B.x, A.y, B.z,
            A.x, A.y, B.z,
            C.x, C.y, C.z,
            D.x, C.y, C.z,
            D.x, C.y, D.z,
            C.x, C.y, D.z
        ]);

        const index = new Uint32Array([
            0, 3, 1,
            1, 3, 2,
            0, 1, 4,
            1, 5, 4,
            1, 2, 5,
            2, 6, 5,
            2, 3, 6,
            3, 7, 6,
            3, 0, 7,
            0, 4, 7,
            4, 5, 6,
            4, 6, 7,
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(index, 1));
        
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    generateBoxPolygonGeometry(A, B, C, D) {
        var geometry = new THREE.Geometry();
        // 下側の四角
        geometry.vertices.push(new THREE.Vector3(A.x, A.y, A.z)); //V0
        geometry.vertices.push(new THREE.Vector3(B.x, A.y, A.z)); //V1
        geometry.vertices.push(new THREE.Vector3(B.x, A.y, B.z)); //V2
        geometry.vertices.push(new THREE.Vector3(A.x, A.y, B.z)); //V3
        // 上側の四角
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, C.z)); //V4
        geometry.vertices.push(new THREE.Vector3(D.x, C.y, C.z)); //V5
        geometry.vertices.push(new THREE.Vector3(D.x, C.y, D.z)); //V6
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, D.z)); //V7
    
        //    V7-------V6
        //   / \       |\
        //  /  V4-------V5
        // V3--/-------V2 \
        //  \ /          \ \
        //   V0-----------V1
    
        geometry.faces.push(new THREE.Face3( 0, 3, 1));
        geometry.faces.push(new THREE.Face3( 1, 3, 2));
        geometry.faces.push(new THREE.Face3( 0, 1, 4));
        geometry.faces.push(new THREE.Face3( 1, 5, 4));
        geometry.faces.push(new THREE.Face3( 1, 2, 5));
        geometry.faces.push(new THREE.Face3( 2, 6, 5));
        geometry.faces.push(new THREE.Face3( 2, 3, 6));
        geometry.faces.push(new THREE.Face3( 3, 7, 6));
        geometry.faces.push(new THREE.Face3( 3, 0, 7));
        geometry.faces.push(new THREE.Face3( 0, 4, 7));
        geometry.faces.push(new THREE.Face3( 4, 5, 6));
        geometry.faces.push(new THREE.Face3( 4, 6, 7));
    
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
    
        return geometry;
    }

    generateRectangleLine(A, B) {
        const vertices = [];
        vertices.push(new THREE.Vector3(A.x, 0, A.z));
        vertices.push(new THREE.Vector3(B.x, 0, A.z));
        vertices.push(new THREE.Vector3(B.x, 0, B.z));
        vertices.push(new THREE.Vector3(A.x, 0, B.z));
        vertices.push(new THREE.Vector3(A.x, 0, A.z));
        vertices.push(new THREE.Vector3(B.x, 0, B.z));
        return vertices;
    }
    
    generateRectangleGeometry(A, B, C, D) {
        var geometry = new THREE.Geometry();
        // 下側の四角
        geometry.vertices.push(new THREE.Vector3(A.x, A.y, A.z)); //V0
        geometry.vertices.push(new THREE.Vector3(B.x, A.y, A.z)); //V1
        geometry.vertices.push(new THREE.Vector3(C.x, C.y, C.z)); //V2
        geometry.vertices.push(new THREE.Vector3(D.x, C.y, C.z)); //V3
    
        //   V2-------V3
        //   |        |
        //   |        |
        //   V0-------V1
    
        geometry.faces.push(new THREE.Face3( 0, 1, 2));
        geometry.faces.push(new THREE.Face3( 1, 3, 2));
    
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
    
        return geometry;
    }
    
    calcInternalEquinox(A, B, rate) {
        // AとBをm:nに内分する点を求める
        var m = rate, n = 1-rate;
        return new THREE.Vector3().addVectors(A.clone().multiplyScalar(n), B.clone().multiplyScalar(m));
    }
}