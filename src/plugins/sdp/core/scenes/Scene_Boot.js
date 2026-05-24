//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * No initialization required for J-SDP on database load at this time;
 * the passive detail window draws J-SDP data directly from the state note.
 */
J.SDP.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.SDP.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);
};
//endregion Scene_Boot