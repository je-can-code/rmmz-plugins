//region Scene_Base
/**
 * The scenes that should not update artificial time.
 */
Scene_Base._noTimeScenes = [
  Scene_Boot, Scene_Splash, Scene_File, Scene_Save, Scene_Load, Scene_Title, Scene_Gameover
];

/**
 * Extends {@link #update}.<br/>
 * Also updates artificial time if it should be updated.
 */
J.TIME.Aliased.Scene_Base.set('update', Scene_Base.prototype.update);
Scene_Base.prototype.update = function()
{
  // perform original logic.
  J.TIME.Aliased.Scene_Base.get('update')
    .call(this);

  // if time shouldn't update, then do not.
  if (this.shouldUpdateTime() === false) return;

  // update the time.
  $gameTime.update();
};

/**
 * Determines whether or not we should update artificial time while within the
 * current scene.
 * @returns {boolean}
 */
Scene_Base.prototype.shouldUpdateTime = function()
{
  // if we are on a no-time scene, then it shouldn't update.
  const checkIfNoTimeScene = scene => SceneManager._scene instanceof scene;
  const isOnNoTimeScene = Scene_Base._noTimeScenes.some(checkIfNoTimeScene, this) === true;
  if (isOnNoTimeScene) return false;

  // if time is inactive, then it shouldn't update.
  const isTimeInactive = $gameTime.isActive() === false;
  if (isTimeInactive) return false;

  // if time is blocked, then it shouldn't update.
  const isTimeBlocked = $gameTime.isBlocked() === true;
  if (isTimeBlocked) return false;

  // time can update!
  return true;
};
//endregion Scene_Base