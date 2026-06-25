//region Scene_Boot
import DropsParameterRegistration from './../core/registerDropsParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Drops stats with the parameter catalog after vanilla seeding.
 */
J.DROPS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.DROPS.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  DropsParameterRegistration.registerAll();

  // register the drops tag as non-combining so multiple <drops> lines stack across extensions.
  J.EXTEND.Metadata.registerNonCombiningKey(J.DROPS.RegExp.ExtraDrop);
};
//endregion Scene_Boot