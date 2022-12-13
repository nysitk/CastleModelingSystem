import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

import { Tab } from './SidePanelTabManager.js'

/**
 * サイドパネルのモデルクラス
 */
 export class SidePanelManager {
    
    constructor(operationManager) {
        
        this.operationManager = operationManager;
        this.sceneManager = operationManager.sceneManager;
        this.modelingManager = operationManager.modelingManager;


        this.orbitButton = document.getElementById("changeOrbit")

        this.containerDom = document.getElementById("sidePanel")

        this.sceneTab = new Tab(this, "Scene")
        this.castleEditTab = new Tab(this, "CastleEdit");
        this.planeControlTab = new Tab(this, "PlaneControl");
        this.fovEstimationTab = new Tab(this, "FovEstimation");
        this.testTab = new Tab(this, "Test");

        this.openTab(this.sceneTab);

        this.orbitButton.addEventListener('click', (e) => {
            this.operationManager.propOrbit();
        })

        $('.background-Image').on( 'change', (e) => { this.changeBackground(e) } );

    }

    openTab(tab) {

        if (this.selected) {
            this.selected.close();
        }

        tab.open();

        this.selected = tab;

    }

    enableOrbitMode() {
        this.orbitButton.classList.add("disabledButton");
    }

    disableOrbitMode() {
        this.orbitButton.classList.remove("disabledButton");
    }

    clickCursorModeButton(e){
        const mode = $(e.target).attr('id')
        this.operationManager.changeCursorMode(mode);
    };

    changeCursorModeButtonColor(mode) {
        $('#modeButton > li').removeClass('is-active')
        $("#modeButton > #" + mode).addClass('is-active');
    }

    changeBackground(e) {

        const sceneManager = this.sceneManager;

        const canvas = document.getElementById("backgroundCanvas");
        const context = canvas.getContext("2d");
        const image = document.getElementById("backgroundImage");

        var reader = new FileReader();

        reader.onload = function (e) {

            image.src = e.target.result;

            image.onload = function () {

                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0)

                sceneManager.canvasController.opacity = 0.6;
                sceneManager.canvasController.width = canvas.width;
                sceneManager.canvasController.height = canvas.height;
                sceneManager.removeOnWindowResize();

                sceneManager.scene.remove(sceneManager.sky);
                sceneManager.renderer.setClearColor(0xffffff, 1);

                sceneManager.skyEffectController.turbidity = 0.0
                sceneManager.skyEffectController.inclination = 0.0;

                sceneManager.changeGUI();

                
                return true;
                
            }
        }
        
        reader.readAsDataURL(e.target.files[0]);

    }
}