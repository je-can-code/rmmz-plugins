//region Scene_Map (motion tick)
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
//endregion Scene_Map (motion tick)