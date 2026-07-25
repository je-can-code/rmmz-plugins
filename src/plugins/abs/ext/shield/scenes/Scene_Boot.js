//region Scene_Boot
import ShieldParameterRegistration from './../core/registerShieldParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-ABS-Shield stats with the parameter catalog after vanilla seeding.
 */
J.ABS.EXT.SHIELD.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  ShieldParameterRegistration.registerAll();
};
//endregion Scene_Boot