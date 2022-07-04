import * as THREE from '/build/three.module.js';

import { POLYGON } from './Params.js';

import { Ishigaki } from '../models/Ishigaki.js'
import { Yagura } from '../models/Yagura.js'
import { Yane } from '../models/Yane.js'

/**
 * 城郭モデル関連のモデルクラス
 */
export class CastleModelManager {
    constructor(modelingManager) {
        this.modelingManager = modelingManager
        this.sceneManager = modelingManager.sceneManager;
        this.referencePoint = modelingManager.referencePoint;
        this.PARAMS = modelingManager.PARAMS;

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

        this.addGUICastle();
    }

    addGUICastle() {
        this.castleGUIFolder = this.sceneManager.gui.addFolder('Castle');
        this.castleGUIFolder.add(this.PARAMS, "yaguraSteps", 2, 10).step(1.0).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS, "seiRatio", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yaneSizeRatio, "x", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yaneSizeRatio, "z", 0.0, 3.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS, "yaneUpperPosition", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS, "yaneLowerPosition", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS, "windowNum", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS, "windowWidth", 0.0, 2.0).step(0.01).onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.open();
    }

    changeGUICastle() {
        this.changeCastleModel();
        this.sceneManager.render();
    }

    createIshigakiLine(P1, P2, P3) {
        this.removeIshigakiLine();

        this.model.ishigaki.line = new Ishigaki(this.PARAMS, P1, P2, P3).createLine();
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

    createIshigakiPolygon(P1, P2, P3, type = "whole") {
        this.removeIshigakiPolygon();

        this.model.ishigaki.polygon = new Ishigaki(this.PARAMS, P1, P2, P3).createPolygon(type);
        this.sceneManager.scene.add(this.model.ishigaki.polygon)
    }

    removeIshigakiPolygon() {
        let polygon = this.model.ishigaki.polygon

        if (polygon) {
            this.sceneManager.scene.remove(polygon)
            
            polygon = null;
        }
    }

    createYaguraLine(R3, R4, R6) {
        this.removeYaguraLine();

        this.model.yagura.line = new Yagura(this.PARAMS, R3, R4, R6).createLine();
        this.sceneManager.scene.add(this.model.yagura.line)
    }

    removeYaguraLine() {
        let line = this.model.yagura.line

        if (line) {
            this.sceneManager.scene.remove(line)
            
            line.dispose();

            this.model.yagura.line = null;
        }
    }

    createYaguraPolygon(R3, R4, R6, type = "whole") {
        this.removeYaguraPolygon();

        this.model.yagura.polygon = new Yagura(this.PARAMS, R3, R4, R6).createPolygon(type);
        if (type == "whole") this.model.yagura.polygon.setTexture("window")
        this.sceneManager.scene.add(this.model.yagura.polygon)
    }

    removeYaguraPolygon() {
        let polygon = this.model.yagura.polygon

        if (polygon) {
            this.sceneManager.scene.remove(polygon)
            
            polygon.dispose();

            polygon = null;
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

        this.model.yane.line = new Yane(this.PARAMS, R3, R4, R6).createLine();
        this.sceneManager.scene.add(this.model.yane.line)
    }

    removeYaneLine() {
        if (this.model.yane.line) {
            this.sceneManager.scene.remove(this.model.yane.line)
        }
    }

    createYanePolygon(R3, R4, R6, type = "whole") {
        this.removeYanePolygon();

        this.model.yane.polygon = new Yane(this.PARAMS, R3, R4, R6).createPolygon(type);
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
        let polygon = this.model.yane.polygon

        if (polygon) {
            this.sceneManager.scene.remove(polygon)
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

    changeCastleModel() {
        if (this.model.yane.polygon) {

            this.removeYanePolygon();

            this.createYanePolygon(
                this.referencePoint.ishigakiTop[0].clone(),
                this.referencePoint.ishigakiTop[1].clone(),
                this.referencePoint.yaguraTop[1].clone()
            );

        }

        if (this.model.yagura.polygon) {

            this.removeYaguraPolygon();
            
            this.createYaguraPolygon(
                this.referencePoint.ishigakiTop[0].clone(),
                this.referencePoint.ishigakiTop[1].clone(),
                this.referencePoint.yaguraTop[1].clone()
            );

        }

        
    }
}