import * as THREE from '/build/three.module.js';

import { POLYGON } from './Params.js';

import { Ishigaki } from '../models/Ishigaki.js'
import { Yagura } from '../models/Yagura.js'


/**
 * 城郭モデル関連のモデルクラス
 */
export class CastleModelManager {

    constructor(modelingManager) {

        this.modelingManager = modelingManager
        this.sceneManager = modelingManager.sceneManager;
        this.referencePoint = modelingManager.referencePoint;


        this.PARAMS = {

            hiraTsumaReverse: false, // 平（横向き）と妻（奥行き）を入れ替えるか

            ishigaki: {
                steps: 6,
            },

            yagura: {
                steps: 5,
                windowNum: 1.0,
                windowWidth: 1.0,
            },

            yane: {
                sizeRatio: new THREE.Vector3(1.0, 1.0, 1.0),
                upperPosition: 1.0,
                lowerPosition: 1.0,
                seiRatio: 1.0,
            },

            hafu: []

        }


        this.model = {

            ishigaki: null,
            yagura: null,
            hafu: null

        };

        this.addGUICastle();

    }

    addGUICastle() {

        this.castleGUIFolder = this.sceneManager.gui.addFolder('Castle');

        this.castleGUIFolder.add(this.PARAMS.yagura, "steps", 2, 10, 1.0).name("yagura steps").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yane, "seiRatio", 0.0, 3.0, 0.01).name("sei ratio").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yane.sizeRatio, "x", 0.0, 3.0, 0.01).name("yane size ratio x").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yane.sizeRatio, "z", 0.0, 3.0, 0.01).name("yane size ratio z").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yane, "upperPosition", 0.0, 2.0, 0.01).name("yane upper position").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yane, "lowerPosition", 0.0, 2.0, 0.01).name("yane lower position").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yagura, "windowNum", 0.0, 2.0, 0.01).name("window num").onChange( () => { this.changeGUICastle() } );;
        this.castleGUIFolder.add(this.PARAMS.yagura, "windowWidth", 0.0, 2.0, 0.01).name("window width").onChange( () => { this.changeGUICastle() } );;
        
        this.castleGUIFolder.open();

    }

    changeGUICastle() {

        this.changeCastleModel();

        this.sceneManager.render();

    }

    removeIshigaki() {

        if (!this.model.ishigaki) return;

        this.sceneManager.scene.remove(this.model.ishigaki);

        this.model.ishigaki.dispose();

        this.model.ishigaki = null;

    }

    createIshigaki(P1, P2, P3, parameters) {

        this.removeIshigaki();

        this.model.ishigaki = new Ishigaki(this.PARAMS, P1, P2, P3).create(parameters);
        
        // this.displayVerticesInfo(this.model.ishigaki);

        this.sceneManager.scene.add(this.model.ishigaki)

    }

    displayVerticesInfo(ishigaki) {

        for (const point of this.modelingManager.getCornerPoints(ishigaki.A, ishigaki.B)) {
            
            console.log(point);
            console.log(this.sceneManager.worldToScreenCoordinate(point, this.sceneManager.currentCamera))
            
        }

    }

    createYagura(R3, R4, R6, parameters = {}) {
        
        this.removeYagura();
        
        this.model.yagura = new Yagura(R3, R4, R6, this, parameters).create(parameters);


        if (parameters.type == "polygon" && parameters.polygonType == "whole") {
            
            if (!parameters.wallTexture) parameters.wallTexture = "window"
            
            this.model.yagura.setTexture(parameters)

        }

        this.sceneManager.scene.add(this.model.yagura)
    
    }

    removeYagura() {

        if (!this.model.yagura) return;

        this.sceneManager.scene.remove(this.model.yagura);

        this.model.yagura.dispose();
        
        this.model.yagura = null;

    }

    setWallTexture(parameters) {

        if (!parameters.modelPreset) parameters.modelPreset = {}
        if (!parameters.modelPreset.wallTexture) parameters.modelPreset.wallTexture = "window";

        const yagura = this.model.yagura;

        if (!yagura) return;


        yagura.removeTexture();

        yagura.setTexture(parameters);

    }

    setYaneColor(parameters) {

        if (!parameters.modelPreset) parameters.modelPreset = {}
        if (!parameters.modelPreset.yaneColor) parameters.modelPreset.yaneColor = undefined;

        const yagura = this.model.yagura;

        if (!yagura) return;


        yagura.setYaneColor(parameters);

    }

    createHafuPreset(parameters) {

        if (this.model.yagura) {

            this.model.yagura.createHafuPreset(parameters);

        }

    }

    remove() {

        this.removeIshigaki();
        this.removeYagura();

    }
    
    getAllSurroundingYane() {

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

        if (!this.model.yagura) {
            
            console.info("this castle model has no yagura.")

            return [];
            
        }

        
        return this.model.yagura.getAllYaneBodyMesh();

    }

    changeCastleModel() {

        if (this.model.yagura) {

            this.removeYaguraPolygon();
            
            this.createYaguraPolygon(

                this.referencePoint.ishigakiTop[0].clone(),
                this.referencePoint.ishigakiTop[1].clone(),
                this.referencePoint.yaguraTop[1].clone()

            );

        }
        
    }
}