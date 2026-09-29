//region Scene_Boot
import DropsNotetagDescriptions from './../core/describeDropsNotetags.js';
import DropsParameterRegistration from './../core/registerDropsParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Drops stats with the parameter catalog after vanilla seeding, and describes this plugin's tags.
 */
J.DROPS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.DROPS.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  DropsParameterRegistration.registerAll();

  // describe this plugin's tags, so anything listing what a state does can say what these ones do.
  DropsNotetagDescriptions.registerAll();

  // register the drops tag as non-combining so multiple <drops> lines stack across extensions.
  J.EXTEND.Metadata.registerNonCombiningKey(J.DROPS.RegExp.ExtraDrop);

  // build the drop upgrade ladders now that the database rows exist to read them from.
  J.DROPS.Metadata.buildDropLadders(J.DROPS.Metadata.dropLadderTables());
};
//endregion Scene_Boot