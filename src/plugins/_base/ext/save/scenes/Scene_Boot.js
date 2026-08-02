//region Scene_Boot
import ProfileManager from './../managers/ProfileManager.js';

/**
 * Extends {@link #loadPlayerData}.<br/>
 * Also reads the profile document, alongside the config and the savefile index.
 */
J.BASE.EXT.SAVE.Aliased.Scene_Boot.set('loadPlayerData', Scene_Boot.prototype.loadPlayerData);
Scene_Boot.prototype.loadPlayerData = function()
{
  // perform original logic.
  J.BASE.EXT.SAVE.Aliased.Scene_Boot.get('loadPlayerData')
    .call(this);

  // the third scope. installation and slot are the engine's; this one is ours.
  ProfileManager.load();
};

/**
 * Extends {@link #isPlayerDataLoaded}.<br/>
 * Also waits on the profile document before the boot sequence proceeds.
 * @returns {boolean}
 */
J.BASE.EXT.SAVE.Aliased.Scene_Boot.set('isPlayerDataLoaded', Scene_Boot.prototype.isPlayerDataLoaded);
Scene_Boot.prototype.isPlayerDataLoaded = function()
{
  // perform original logic.
  const loaded = J.BASE.EXT.SAVE.Aliased.Scene_Boot.get('isPlayerDataLoaded')
    .call(this);

  return loaded && ProfileManager.isLoaded();
};
//endregion Scene_Boot
