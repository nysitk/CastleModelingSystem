import { OperationManager } from './managers/OperationManager.js';
import { SceneManager } from './managers/SceneManager.js'

/**
 * entry point
 */
(() => {
  window.onload = () => {
    const sceneManager = new SceneManager();
    WebGLAnimation(sceneManager);

    new OperationManager(sceneManager);

    function WebGLAnimation() {
      requestAnimationFrame(WebGLAnimation)
      sceneManager.render();
    }
  };
})();