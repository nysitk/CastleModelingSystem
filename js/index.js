import { SceneManager } from './managers/SceneManager.js'

/**
 * entry point
 */
(() => {

  window.onload = () => {

	const sceneManager = new SceneManager();
	WebGLAnimation(sceneManager);

	function WebGLAnimation() {

		requestAnimationFrame(WebGLAnimation);
		sceneManager.render();

	}

  };
  
})();