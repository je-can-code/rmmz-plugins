//region Scene_Map (motion tick)
import JuiceMotionManager from './../managers/JuiceMotionManager.js';
/**
 * Extends {@link Scene_Map#update}.<br/>
 * Advances queued juice tweens after the map scene finishes its own update pass.
 */
J.ABS.EXT.JUICE.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic (characters, windows, etc.).
  J.ABS.EXT.JUICE.Aliased.Scene_Map.get('update')
    .call(this);

  // tick procedural juice after transforms from movement / poses are applied for this frame.
  JuiceMotionManager.frameTick();
};

/**
 * Extends {@link Scene_Map#terminate}.<br/>
 * Flushes all queued juice effects before the scene is torn down.
 *
 * The JuiceMotionManager effect queue is static and outlives any single scene instance.
 * All queued effects hold direct references to Sprite_Character objects that belong to
 * this scene's spriteset; those sprites are destroyed along with the scene. Clearing the
 * queue here ensures the next Scene_Map instance does not inherit stale references to
 * dead sprites and crash on the first frameTick call.
 */
J.ABS.EXT.JUICE.Aliased.Scene_Map.set('terminate', Scene_Map.prototype.terminate);
Scene_Map.prototype.terminate = function()
{
  // flush juice effects before sprites are destroyed so no stale references survive.
  JuiceMotionManager.clearAll();

  // perform original logic.
  J.ABS.EXT.JUICE.Aliased.Scene_Map.get('terminate')
    .call(this);
};
//endregion Scene_Map (motion tick)