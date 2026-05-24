//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Initializes the proficiency data. The passive detail window draws
 * J-Prof data directly from the state note — no contributor registration needed.
 */
J.PROF.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PROF.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // initialize the proficiency data.
  J.PROF.Metadata.initializeProficiencies();
};
//endregion Scene_Boot