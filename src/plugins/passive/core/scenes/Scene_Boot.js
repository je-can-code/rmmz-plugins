//region Scene_Boot
import PassiveNotetagDescriptions from './../core/describePassiveNotetags.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Describes this plugin's tags once the database they are read from exists.
 */
J.PASSIVE.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PASSIVE.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // describe this plugin's tags, so anything listing what a row does can say what these ones do.
  PassiveNotetagDescriptions.registerAll();
};
//endregion Scene_Boot