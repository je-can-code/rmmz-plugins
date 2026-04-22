//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Initializes the state affix weights.
 */
J.PASSIVE.EXT.ABS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PASSIVE.EXT.ABS.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // initialize the state affix weights.
  J.PASSIVE.EXT.ABS.Metadata.initializeStateAffixWeights();
};
//endregion Scene_Boot