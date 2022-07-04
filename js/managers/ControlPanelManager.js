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
        const reader = new FileReader();
        reader.onload = function (e) {
            $("body").css('background-image', 'url("' + e.target.result + '")');
        }
        reader.readAsDataURL(e.target.files[0]);
        $(this.sceneManager.renderer.domElement).css('opacity', '0.8')

        this.sceneManager.effectController.inclination = 1.0;
        this.sceneManager.changeGUI();
    }

    convertTo3D() {
        this.modelingManager.createAllModel();
        this.operationManager.disable2DFix();
    }
}