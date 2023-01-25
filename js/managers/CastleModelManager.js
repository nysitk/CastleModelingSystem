import * as THREE from '/build/three.module.js';

import { POLYGON } from './Params.js';

import { Ishigaki } from '../models/Ishigaki.js'
import { Yagura } from '../models/Yagura.js'


/**
 * 城郭モデル関連のモデルクラス
 */
export class CastleModelManager extends THREE.Group {

	constructor(modelingManager) {

		super();

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
				sumimunePow: 2.0,
			},

			hafu: []

		}


		this.sceneManager.scene.add(this);
		this.ishigaki = null;
		this.yagura = null;

		this.addGUICastle();

	}

	addGUICastle() {

		this.castleGUIFolder = this.sceneManager.gui.addFolder('Castle');

		this.castleGUIFolder.add(this.PARAMS, "hiraTsumaReverse").name("hira tsuma reverse").onChange( () => { this.changeGUICastle() } );;
		this.castleGUIFolder.add(this.PARAMS.yagura, "steps", 2, 10, 1.0).name("yagura steps").onChange( () => { this.changeGUICastle() } );;
		this.castleGUIFolder.add(this.PARAMS.yane, "seiRatio", 0.0, 3.0, 0.01).name("sei ratio").onChange( () => { this.changeGUICastle() } );;
		this.castleGUIFolder.add(this.PARAMS.yane, "sumimunePow", 1.0, 2.0, 0.01).name("sumimune pow").onChange( () => { this.changeGUICastle() } );;
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
	
	createIshigaki(P1, P2, P3, parameters) {
		
		this.removeIshigaki();
		
		this.ishigaki = new Ishigaki(this.PARAMS, P1, P2, P3).create(parameters);
		
		this.add(this.ishigaki)
		
	}

	removeIshigaki() {

		if (!this.ishigaki) return;

		this.remove(this.ishigaki);

		this.ishigaki.dispose();

		this.ishigaki = null;

	}

	createYagura(R3, R4, R6, parameters = {}) {
		
		this.removeYagura();
		
		this.yagura = new Yagura(R3, R4, R6, this, parameters).create(parameters);


		if (parameters.type == "polygon" && parameters.polygonType == "whole") {
			
			this.yagura.setTexture(parameters)

		}

		this.add(this.yagura)
	
	}

	removeYagura() {

		if (!this.yagura) return;

		this.remove(this.yagura);

		this.yagura.dispose();
		
		this.yagura = null;

	}

	setWallTexture(parameters) {

		if (this.yagura) {

			this.yagura.setTexture(parameters);

		}

	}

	setYaneColor(parameters) {

		if (this.yagura) {
			
			this.yagura.setYaneColor(parameters);

		}

	}

	createHafuPreset(parameters) {

		if (this.yagura) {

			this.yagura.createHafuPreset(parameters);

		}

	}

	removeAll() {

		this.removeIshigaki();
		this.removeYagura();

		super.remove();

	}

	getAllYaneBodyMesh() {

		if (!this.yagura) {
			
			console.info("this castle model has no yagura.")

			return [];
			
		}

		
		return this.yagura.getAllYaneBodyMesh();

	}

	changeCastleModel() {

		if (this.yagura) {

			this.removeYagura();
			
			this.createYagura(

				this.referencePoint.ishigakiTop[0].clone(),
				this.referencePoint.ishigakiTop[1].clone(),
				this.referencePoint.yaguraTop[1].clone()

			);

		}
		
	}
}