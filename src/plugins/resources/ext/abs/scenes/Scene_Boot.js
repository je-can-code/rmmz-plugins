//region Scene_Boot
import ResourcesAbsParameterRegistration from './../core/registerResourcesAbsParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Resources-ABS drain stats with the parameter catalog after vanilla seeding.
 */
J.RESOURCES.EXT.ABS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.RESOURCES.EXT.ABS.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  ResourcesAbsParameterRegistration.registerAll();
};
//endregion Scene_Boot