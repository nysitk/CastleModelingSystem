import { OperationManager } from './managers/OperationManager.js';
import { SceneManager } from './managers/SceneManager.js'

/**
 * entry point
 */
(() => {
  window.onload = () => {
      const sceneManager = new SceneManager();
      sceneManager.render()

      new OperationManager(sceneManager);
  };
})();