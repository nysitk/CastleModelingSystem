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


    createIshigakiLine(P1, P2, P3, parameters) {

        this.removeIshigakiLine();

        this.model.ishigaki = new Ishigaki(this.PARAMS, P1, P2, P3).createLine(parameters);
        
        this.sceneManager.scene.add(this.model.ishigaki)

    }

    removeIshigakiLine() {

        this.removeIshigaki();

    }

    removeIshigaki() {

        if (!this.model.ishigaki) return;

        this.sceneManager.scene.remove(this.model.ishigaki);

        this.model.ishigaki.dispose();

        this.model.ishigaki = null;

    }

    createIshigakiPolygon(P1, P2, P3, parameters) {

        this.removeIshigakiPolygon();

        this.model.ishigaki = new Ishigaki(this.PARAMS, P1, P2, P3).createPolygon(parameters);
        
        this.sceneManager.scene.add(this.model.ishigaki)

    }

    removeIshigakiPolygon() {

        this.removeIshigaki();

    }

    createYaguraLine(R3, R4, R6) {
 
        this.removeYaguraLine();

        this.model.yagura = new Yagura(R3, R4, R6, this).createLine();

        this.sceneManager.scene.add(this.model.yagura)
    
    }

    removeYaguraLine() {

        this.removeYagura();

    }

    createYaguraPolygon(R3, R4, R6, parameters = {type: "whole"}) {
        
        this.removeYaguraPolygon();
        
        this.model.yagura = new Yagura(R3, R4, R6, this, parameters).createPolygon(parameters);


        if (parameters.type == "whole") {
            
            if (!parameters.wallTexture) parameters.wallTexture = "window"
            
            this.model.yagura.setTexture(parameters)

        }


        this.sceneManager.scene.add(this.model.yagura)
    
    }

    removeYaguraPolygon() {
        this.removeYagura();
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

    createYaneLine(R3, R4, R6) {
        console.info("this function is not used.")
        // this.removeYaneLine();

        // this.model.yane.line = new Yane(this.PARAMS, R3, R4, R6).createLine();
        // this.sceneManager.scene.add(this.model.yane.line)
    }

    removeYaneLine() {
        console.info("this function is not used.")
        // if (this.model.yane.line) {
        //     this.sceneManager.scene.remove(this.model.yane.line)
        // }
    }

    createYanePolygon(R3, R4, R6, type = "whole", topFloor = false) {
        console.info("this function is not used.")
        // this.removeYanePolygon();

        // this.model.yane.polygon = new Yane(this.PARAMS, R3, R4, R6, topFloor).createPolygon(type);
        // this.sceneManager.scene.add(this.model.yane.polygon)

        // if (!this.castleGUIFolder) this.addGUICastle();
    }

    setYaneColor(parameters) {

        if (!parameters.modelPreset) parameters.modelPreset = {}
        if (!parameters.modelPreset.yaneColor) parameters.modelPreset.yaneColor = undefined;

        const yagura = this.model.yagura;

        if (!yagura) return;


        yagura.setYaneColor(parameters);

    }

    removeYanePolygon() {
        console.info("this function is not used.")

        // let polygon = this.model.yane.polygon

        // if (polygon) {
        //     this.sceneManager.scene.remove(polygon)
        // }
    }

    createHafuPreset(parameters) {

        if (this.model.yagura) {

            this.model.yagura.createHafuPreset(POLYGON, parameters);

        }

    }

    removeAllLine() {

        this.removeIshigakiLine();
        this.removeYaguraLine();

    }

    removeAllPolygon() {

        this.removeIshigakiPolygon();
        this.removeYaguraPolygon();

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