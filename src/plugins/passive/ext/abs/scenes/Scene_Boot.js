//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Initializes the passive state affix weights for JABS map enemies.
 * The passive detail window's JABS sections are provided directly by
 * Window_PassiveDetail in this extension — no contributor registration needed.
 */
J.PASSIVE.EXT.ABS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PASSIVE.EXT.ABS.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // initialize the state affix weights used by the JABS enemy affix system.
  J.PASSIVE.EXT.ABS.Metadata.initializeStateAffixWeights();
};
//endregion Scene_Boot