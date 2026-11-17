//region DataManager
import JabsBossManager from './JabsBossManager.js';

/**
 * Extends {@link #setupNewGame}.<br/>
 * Also forgets any boss fight the last game was in the middle of.
 *
 * The boss manager is static, so a fight outlives the game it was fought in. A party that wipes mid-fight goes back
 * to the title with the fight still running, and a new game started from there would check the first enemy to fall
 * against a boss from the last one.
 */
J.ABS.EXT.BOSS.Aliased.DataManager.set('setupNewGame', DataManager.setupNewGame);
DataManager.setupNewGame = function()
{
  // a new game starts with no fight on, whatever the last one was doing when it ended.
  JabsBossManager.discardEncounter();

  // perform original logic.
  J.ABS.EXT.BOSS.Aliased.DataManager.get('setupNewGame')
    .call(this);
};

/**
 * Extends {@link #extractSaveContents}.<br/>
 * Also forgets any boss fight the game being left behind was in the middle of.
 *
 * A loaded save brings back a world of its own, and a fight still running in the game it replaces belongs to
 * neither: its bodies were that game's events, and nothing of them is on the map the save restores.
 * @param {object} contents The save contents being applied.
 */
J.ABS.EXT.BOSS.Aliased.DataManager.set('extractSaveContents', DataManager.extractSaveContents);
DataManager.extractSaveContents = function(contents)
{
  // a loaded game starts with no fight on, whatever the one it replaces was doing.
  JabsBossManager.discardEncounter();

  // perform original logic.
  J.ABS.EXT.BOSS.Aliased.DataManager.get('extractSaveContents')
    .call(this, contents);
};
//endregion DataManager