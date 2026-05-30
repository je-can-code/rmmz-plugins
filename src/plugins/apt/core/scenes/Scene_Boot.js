//region Scene_Boot
import AptParameterRegistration from './../core/registerAptParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Aptitude stats with the parameter catalog after vanilla seeding.
 */
J.APT.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.APT.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  AptParameterRegistration.registerAll();
};
//endregion Scene_Boot