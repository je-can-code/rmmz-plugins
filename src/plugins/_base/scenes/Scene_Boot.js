//region Scene_Boot
import VanillaParameterRegistration from './../core/registerVanillaParameters.js';
import ProfileManager from './../managers/ProfileManager.js';

/**
 * Extends {@link #loadPlayerData}.<br/>
 * Also reads the profile document, alongside the config and the savefile index.
 */
J.BASE.Aliased.Scene_Boot.set('loadPlayerData', Scene_Boot.prototype.loadPlayerData);
Scene_Boot.prototype.loadPlayerData = function()
{
  // perform original logic.
  J.BASE.Aliased.Scene_Boot.get('loadPlayerData')
    .call(this);

  // the third scope. installation and slot are the engine's; this one is ours.
  ProfileManager.load();
};

/**
 * Extends {@link #isPlayerDataLoaded}.<br/>
 * Also waits on the profile document before the boot sequence proceeds.
 * @returns {boolean}
 */
J.BASE.Aliased.Scene_Boot.set('isPlayerDataLoaded', Scene_Boot.prototype.isPlayerDataLoaded);
Scene_Boot.prototype.isPlayerDataLoaded = function()
{
  // perform original logic.
  const loaded = J.BASE.Aliased.Scene_Boot.get('isPlayerDataLoaded')
    .call(this);

  return loaded && ProfileManager.isLoaded();
};

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Seeds vanilla engine parameters before downstream plugins extend the catalog.
 */
J.BASE.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // register vanilla stats first so owner plugins can append without fighting load order.
  VanillaParameterRegistration.registerAll();

  // perform original logic.
  J.BASE.Aliased.Scene_Boot.get('onDatabaseLoaded').call(this);
};
//endregion Scene_Boot