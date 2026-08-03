//region Scene_Load
/**
 * Overwrites {@link Scene_Load.reloadMapIfUpdated}.<br/>
 * When loading, the map needs to be refreshed to load the enemies properly.
 */
J.ABS.Aliased.Scene_Load.set('reloadMapIfUpdated', Scene_Load.prototype.reloadMapIfUpdated);
Scene_Load.prototype.reloadMapIfUpdated = function()
{
  if ($jabsEngine.absEnabled)
  {
    J.ABS.Helpers.forceMapReload();
  }
  else
  {
    // perform original logic.
    J.ABS.Aliased.Scene_Load.get('reloadMapIfUpdated')
      .call(this);
  }
};
//endregion Scene_Load