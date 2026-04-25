//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Initializes the proficiency data.
 */
J.PROF.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function ()
{
  // perform original logic.
  J.PROF.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // initialize the proficiency data.
  J.PROF.Metadata.initializeProficiencies();
};

//endregion Scene_Boot