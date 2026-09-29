//region Scene_Boot
import CritNotetagDescriptions from './../core/describeCritNotetags.js';
import CritParameterRegistration from './../core/registerCritParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers J-Crit stats with the parameter catalog after vanilla seeding, and describes this plugin's tags.
 */
J.CRIT.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.CRIT.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);

  // register owner stats with the parameter catalog.
  CritParameterRegistration.registerAll();

  // describe the tags this plugin reads, for every screen that lists what a state does.
  CritNotetagDescriptions.registerAll();

  // register all conditional crit tags as non-combining so multiple lines on the same
  // note are appended rather than overwritten when J-Extend merges extension skills.
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.ThisCritChanceIfState);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.ThisCritChanceIfStateType);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.CritChanceIfState);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.CritChanceIfStateType);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.ThisCritsAlwaysIfState);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.ThisCritsAlwaysIfStateType);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.CritAlwaysIfState);
  J.EXTEND.Metadata.registerNonCombiningKey(J.CRIT.RegExp.CritAlwaysIfStateType);
};
//endregion Scene_Boot