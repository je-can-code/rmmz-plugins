//region Scene_Boot
import SpeedParameterRegistration from './../core/registerSpeedParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-ABS-Speed stats with the parameter catalog after vanilla seeding.
 */
J.ABS.EXT.SPEED.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.ABS.EXT.SPEED.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  SpeedParameterRegistration.registerAll();
};
//endregion Scene_Boot