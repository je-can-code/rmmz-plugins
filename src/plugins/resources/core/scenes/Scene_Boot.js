//region Scene_Boot
import ResourcesParameterRegistration from './../core/registerResourcesParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Resources stats with the parameter catalog after vanilla seeding.
 */
J.RESOURCES.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.RESOURCES.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  ResourcesParameterRegistration.registerAll();
};
//endregion Scene_Boot