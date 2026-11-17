//region DataManager
import BossFrameManager from './BossFrameManager.js';

/**
 * Extends {@link #setupNewGame}.<br/>
 * Also stands down any boss frame the last game left up.
 *
 * The boss frame manager is static, so a frame outlives the game it was shown in. A party that wipes mid-fight goes
 * back to the title with the frame still up, and a new game started from there would begin with the target frame
 * held below a boss frame that is no longer there.
 */
J.HUD.EXT.BOSS.Aliased.DataManager.set('setupNewGame', DataManager.setupNewGame);
DataManager.setupNewGame = function()
{
  // a new game starts with no boss framed, whatever the last one was showing when it ended.
  BossFrameManager.resetBossFrame();

  // perform original logic.
  J.HUD.EXT.BOSS.Aliased.DataManager.get('setupNewGame')
    .call(this);
};

/**
 * Extends {@link #extractSaveContents}.<br/>
 * Also stands down any boss frame the game being left behind had up.
 *
 * A loaded save brings back a world of its own, and the boss a frame was showing in the game it replaces is nowhere
 * in it.
 * @param {object} contents The save contents being applied.
 */
J.HUD.EXT.BOSS.Aliased.DataManager.set('extractSaveContents', DataManager.extractSaveContents);
DataManager.extractSaveContents = function(contents)
{
  // a loaded game starts with no boss framed, whatever the one it replaces was showing.
  BossFrameManager.resetBossFrame();

  // perform original logic.
  J.HUD.EXT.BOSS.Aliased.DataManager.get('extractSaveContents')
    .call(this, contents);
};
//endregion DataManager