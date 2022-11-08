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

        this.openTab(this.castleEditTab);

        this.orbitButton.addEventListener('click', (e) => {
            this.operationManager.changeCursorMode("orbit");
        })


        $('#controlPanel-close').on("click", () => {
            $('#controlPanel-main').slideToggle(500);
        })

        $("#modeButton > li").each(function(i, button) {
            button.addEventListener('click', (e) => { this.clickCursorModeButton(e) }, false)
        }.bind(this));

        $('#background-Image').on( 'change', (e) => { this.changeBackground(e) } );

        $('#convertTo3D').on('click', (e) => { this.convertTo3D(e) });

    }

    openTab(tab) {

        if (this.selected) {
            this.selected.close();
        }

        tab.open();

        this.selected = tab;

    }

    enableOrbit() {
        this.orbitButton.disabled = true;
    }

    disableOrbit() {
        this.orbitButton.disabled = false;
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

                $(sceneManager.renderer.domElement).css('opacity', '0.6')
                sceneManager.changeRendererSize(canvas.width, canvas.height);
                sceneManager.removeOnWindowResize();

                sceneManager.scene.remove(sceneManager.sky);
                sceneManager.renderer.setClearColor(0xffffff, 1);

                sceneManager.effectController.turbidity = 0.0
                sceneManager.effectController.inclination = 0.0;
                sceneManager.changeGUI();
            }
        }
        
        reader.readAsDataURL(e.target.files[0]);
    }

    convertTo3D() {
        this.modelingManager.createAllModel();
        this.operationManager.disable2DFix();
    }
}