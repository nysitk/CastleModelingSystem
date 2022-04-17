import * as THREE from '/build/three.module.js';

import { PARAMS, POLYGON } from './Params.js';

import { Ishigaki } from '../models/Ishigaki.js'
import { Yagura } from '../models/Yagura.js'
import { Yane } from '../models/Yane.js'

/**
 * 城郭モデル関連のモデルクラス
 */
export class CastleModelManager {
    constructor(referencePoint, sceneManager) {
        this.sceneManager = sceneManager;
        this.referencePoint = referencePoint;
        this.model = {
            ishigaki: {
                line: null,
                polygon: null
            },
            yagura: {
                line: null,
                polygon: null
            },
            yane: {
                line: null,
                polygon: null
            },
            hafu: null
        };
    }

    addGUICastle() {
        this.castleGUIFolder = this.sceneManager.gui.addFolder('Castle');
        this.castleGUIFolder.add(PARAMS, "yaguraSteps", 2, 10).step(1.0).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(PARAMS, "seiRatio", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(PARAMS.yaneSizeRatio, "x", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(PARAMS.yaneSizeRatio, "z", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(PARAMS, "yaneUpperPosition", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(PARAMS, "yaneLowerPosition", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.open();
    }

    changeGUICastle() {
        this.changeYaguraSteps(PARAMS.yaguraSteps);
        this.sceneManager.render();
    }

    createIshigakiLine(P1, P2, P3) {
        this.removeIshigakiLine();

        this.model.ishigaki.line = new Ishigaki(P1, P2, P3).createLine();
        this.sceneManager.scene.add(this.model.ishigaki.line)
    }

    removeIshigakiLine() {
        const line = this.model.ishigaki.line

        if (line) {
            this.sceneManager.scene.remove(line)
            
            line.dispose();

            this.model.ishigaki.line = null;
        }
    }

    createIshigakiPolygon(P1, P2, P3) {
        this.removeIshigakiPolygon();

        this.model.ishigaki.polygon = new Ishigaki(P1, P2, P3).createPolygon();
        this.sceneManager.scene.add(this.model.ishigaki.polygon)
    }

    removeIshigakiPolygon() {
        if (this.model.ishigaki.polygon) {
            this.sceneManager.scene.remove(this.model.ishigaki.polygon)
        }
    }

    createYaguraLine(R3, R4, R6) {
        this.removeYaguraLine();

        this.model.yagura.line = new Yagura(R3, R4, R6).createLine();
        this.sceneManager.scene.add(this.model.yagura.line)
    }

    removeYaguraLine() {
        const line = this.model.yagura.line

        if (line) {
            this.sceneManager.scene.remove(line)
            
            line.dispose();

            this.model.yagura.line = null;
        }
    }

    createYaguraPolygon(R3, R4, R6) {
        this.removeYaguraPolygon();

        this.model.yagura.polygon = new Yagura(R3, R4, R6).createPolygon();
        this.model.yagura.polygon.setTexture("window")
        this.sceneManager.scene.add(this.model.yagura.polygon)
    }

    removeYaguraPolygon() {
        const polygon = this.model.yagura.polygon

        if (polygon) {
            this.sceneManager.scene.remove(polygon)
            
            polygon.dispose();

            this.model.yagura.polygon = null;
        }
    }

    setWallTexture(name) {
        if (this.model.yagura.polygon) {
            this.model.yagura.polygon.removeTexture();

            if (name) {
                this.model.yagura.polygon.setTexture(name);
            } else {
                this.model.yagura.polygon.setTexture("window");
            }
        }
    }

    createYaneLine(R3, R4, R6) {
        this.removeYaneLine();

        this.model.yane.line = new Yane(R3, R4, R6).createLine();
        this.sceneManager.scene.add(this.model.yane.line)
    }

    removeYaneLine() {
        if (this.model.yane.line) {
            this.sceneManager.scene.remove(this.model.yane.line)
        }
    }

    createYanePolygon(R3, R4, R6) {
        this.removeYanePolygon();

        this.model.yane.polygon = new Yane(R3, R4, R6).createPolygon();
        this.sceneManager.scene.add(this.model.yane.polygon)

        if (!this.castleGUIFolder) this.addGUICastle();
    }

    setYaneColor(color) {
        if (this.model.yane.polygon) {
            if (color)
                this.model.yane.polygon.setAllColor(color)
        }
    }

    removeYanePolygon() {
        if (this.model.yane.polygon) {
            this.sceneManager.scene.remove(this.model.yane.polygon)
        }
    }

    createHafuPreset(name) {
        if (this.model.yane.polygon) {
            this.model.yane.polygon.createHafuPreset(POLYGON, name);
        }
    }

    removeAllLine() {
        this.removeIshigakiLine();
        this.removeYaguraLine();
        this.removeYaneLine();
    }

    removeAllPolygon() {
        this.removeIshigakiPolygon();
        this.removeYaguraPolygon();
        this.removeYanePolygon();
    }

    getAllSurroundingYane() {
        if (this.model.yane.polygon)
        return this.model.yane.polygon.getAllSurroundingYane();
    }

    getAllYaneComponent() {
        const allYaneComponent = []
        if (this.getAllSurroundingYane()) {
            this.getAllSurroundingYane().forEach(surroundingYane => {
                surroundingYane.getAllYaneComponent().forEach(yaneComponent => {
                    allYaneComponent.push(yaneComponent);
                })
            });
        }
        return allYaneComponent;
    }

    getAllYaneBodyMesh() {
        const allBodyMesh = [];
        this.getAllYaneComponent().forEach(yaneComponent => {
            allBodyMesh.push(yaneComponent.getBodyMesh());
        })
        return allBodyMesh;
    }

    changeYaguraSteps(step) {
        PARAMS.yaguraSteps = step;

        this.removeYaguraPolygon();
        this.removeYanePolygon();
        
        this.createYaguraPolygon(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.referencePoint.yaguraTop[1].clone()
        );

        this.createYanePolygon(
            this.referencePoint.ishigakiTop[0].clone(),
            this.referencePoint.ishigakiTop[1].clone(),
            this.referencePoint.yaguraTop[1].clone()
        );
        
    }
}