//region Scene_Boot
import AffixNotetagDescriptions from './../core/describeAffixNotetags.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Initializes the passive state affix weights for JABS map enemies, and describes this plugin's tags.
 * The passive detail window's JABS sections are provided directly by
 * Window_PassiveDetail in this extension — no contributor registration needed.
 */
J.PASSIVE.EXT.AFFIX.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PASSIVE.EXT.AFFIX.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // initialize the state affix weights used by the JABS enemy affix system.
  J.PASSIVE.EXT.AFFIX.Metadata.initializeStateAffixWeights();

  // describe the tags this plugin reads, for every screen that lists what a state does.
  AffixNotetagDescriptions.registerAll();
};
//endregion Scene_Boot