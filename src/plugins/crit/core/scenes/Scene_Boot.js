//region Scene_Boot
import CritParameterRegistration from './../core/registerCritParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Crit stats with the parameter catalog after vanilla seeding.
 */
J.CRIT.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.CRIT.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  CritParameterRegistration.registerAll();
};
//endregion Scene_Boot