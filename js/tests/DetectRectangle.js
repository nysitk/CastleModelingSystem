import * as THREE from '/build/three.module.js';


export class DetectRectangleTest {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;

        this.plane = new Plane(200, 100)
        this.scene.add(this.plane)

        this.plane.getVerticesCorrdinates(this.sceneManager.currentCamera);
    }
}

class Plane extends THREE.Mesh {
    constructor(width, height) {
        super();

        this.geometry = new THREE.PlaneGeometry( width, height );
        this.material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

        this.width = width;
        this.height = height;

        this.vertices = [
            new THREE.Vector3(width/2, 0, -height/2),
            new THREE.Vector3(width/2, 0, height/2),
            new THREE.Vector3(-width/2, 0, height/2),
            new THREE.Vector3(-width/2, 0, -height/2),
        ]

        this.rotateX(Math.PI / 2)
    }

    // 4頂点のワールド座標と対応するスクリーン座標を表示
    getVerticesCorrdinates(camera) {
        this.vertices.forEach(v => {
            let c = this.worldToScreenCoordinate(v.x, v.y, v.z, camera);
            console.log(v, c)
        });
    }

    // ワールド座標からスクリーン座標に変換
    worldToScreenCoordinate(x, y, z, camera) {
        const projection = new THREE.Vector3(x, y, z).project(camera);
        // const projection = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);

        const sx = (window.innerWidth / 2) * ( +projection.x + 1.0 );
        const sy = (window.innerHeight / 2) * ( -projection.y + 1.0 );

        // スクリーン座標
        return new THREE.Vector2(sx, sy)
    }
}