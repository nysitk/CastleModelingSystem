import { OperationManager } from './OperationManager.js';
import { SceneManager } from './SceneManager.js'

/**
 * entry point
 */
(() => {
  window.onload = () => {
      const sceneManager = new SceneManager();
      sceneManager.render()

      const operationManager = new OperationManager(sceneManager);
  };
})();