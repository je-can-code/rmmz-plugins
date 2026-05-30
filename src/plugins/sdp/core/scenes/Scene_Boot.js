//region Scene_Boot
import SdpParameterRegistration from './../core/registerSdpParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-SDP stats with the parameter catalog after vanilla seeding.
 */
J.SDP.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.SDP.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  SdpParameterRegistration.registerAll();
};
//endregion Scene_Boot