//region Scene_Boot
import VanillaParameterRegistration from './../core/registerVanillaParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Seeds vanilla engine parameters before downstream plugins extend the catalog.
 */
J.BASE.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // register vanilla stats first so owner plugins can append without fighting load order.
  VanillaParameterRegistration.registerAll();

  // perform original logic.
  J.BASE.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);
};
//endregion Scene_Boot