//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers the chargeTier tag as non-combining with J-Extend so that multiple
 * <chargeTier> lines from separate extension skills are appended rather than overwritten.
 */
J.ABS.EXT.CHARGE.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.ABS.EXT.CHARGE.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register chargeTier as non-combining so stacked charge tiers from multiple extensions survive merging.
  J.EXTEND.Metadata.registerNonCombiningKey(J.ABS.EXT.CHARGE.RegExp.ChargeData);
};
//endregion Scene_Boot
