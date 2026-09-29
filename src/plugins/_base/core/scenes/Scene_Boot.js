//region Scene_Boot
import VanillaParameterRegistration from './../core/registerVanillaParameters.js';
import NotetagDescriber from './../managers/NotetagDescriber.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Seeds vanilla engine parameters before downstream plugins extend the catalog, and loads the sentences every
 * notetag is described with.
 */
J.BASE.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // register vanilla stats first so owner plugins can append without fighting load order.
  VanillaParameterRegistration.registerAll();

  // every describer reads its sentence from the game's config, so the config loads with the database.
  NotetagDescriber.loadTemplates();

  // perform original logic.
  J.BASE.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);
};
//endregion Scene_Boot