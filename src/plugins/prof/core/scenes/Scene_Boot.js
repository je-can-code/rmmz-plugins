//region Scene_Boot
import ProfNotetagDescriptions from './../core/describeProfNotetags.js';
import ProfParameterRegistration from './../core/registerProfParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Prof stats with the parameter catalog, describes this plugin's tags, and initializes proficiency data.
 */
J.PROF.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PROF.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register prof stat with the parameter catalog.
  ProfParameterRegistration.registerAll();

  // describe this plugin's tags, so anything listing what a row does can say what these ones do.
  ProfNotetagDescriptions.registerAll();

  // initialize the proficiency data.
  J.PROF.Metadata.initializeProficiencies();
};
//endregion Scene_Boot