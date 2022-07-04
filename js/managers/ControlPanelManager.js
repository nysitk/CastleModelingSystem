import * as THREE from '/build/three.module.js';

import { ModelingManager } from './ModelingManager.js';

import { OBJExporter, OBJExporterWithMtl } from '../controls/OBJExporter.js';

/**
 * ユーザー操作関連のモデルクラス
 */
 export class ControlPanelManager {
    constructor(operationManager) {
        this.operationManager = operationManager;
        this.sceneManager = operationManager.sceneManager;
        this.modelingManager = operationManager.modelingManager;

        this.init(this.operationManager.cursorInfo.mode)
    }

    init(mode) {

        $('#controlPanel-close').on("click", () => {
            $('#controlPanel-main').slideToggle(500);
        })

        $("#modeButton > li").each(function(i, button) {
            button.addEventListener('click', (e) => { this.clickCursorModeButton(e) }, false)
        }.bind(this));

        $('#background-Image').on( 'change', (e) => { this.changeBackground(e) } );

        $('#convertTo3D').on('click', (e) => { this.convertTo3D(e) });

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

                $(sceneManager.renderer.domElement).css('opacity', '0.5')
                console.log(canvas.width, canvas.height)
                sceneManager.changeRendererSize(canvas.width, canvas.height);
                sceneManager.removeOnWindowResize();

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