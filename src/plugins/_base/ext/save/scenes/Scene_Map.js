//region Scene_Map
import Scene_Files from './Scene_Files.js';

/**
 * Extends {@link #needsFadeIn}.<br/>
 * Also fades in when the map was reached by loading from the files scene.
 *
 * Vanilla asks whether the previous scene was `Scene_Battle` or `Scene_Load`, and
 * `SceneManager.isPreviousScene` compares `_previousClass === sceneClass` - **exact constructor
 * identity rather than any walk of the prototype chain** - so even a `Scene_Files` that inherited from
 * `Scene_Load` would not have satisfied it.
 *
 * Without this the map stops fading in after a load and simply pops into existence. It is cosmetic, it
 * announces nothing, and it is exactly the sort of thing that gets blamed on something unrelated three
 * weeks later.
 * @returns {boolean}
 */
J.BASE.EXT.SAVE.Aliased.Scene_Map.set('needsFadeIn', Scene_Map.prototype.needsFadeIn);
Scene_Map.prototype.needsFadeIn = function()
{
  // perform original logic.
  const original = J.BASE.EXT.SAVE.Aliased.Scene_Map.get('needsFadeIn')
    .call(this);

  return original || SceneManager.isPreviousScene(Scene_Files);
};
//endregion Scene_Map