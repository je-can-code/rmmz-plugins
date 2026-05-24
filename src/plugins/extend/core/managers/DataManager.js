//region DataManager
import OverlayManager from './OverlayManager.js';

/**
 * Extends {@link #setupNewGame}.<br/>
 * Also clears the RPGManager note cache for a fresh session.
 */
J.EXTEND.Aliased.DataManager.set('setupNewGame', DataManager.setupNewGame);
DataManager.setupNewGame = function()
{
  // clear any previously cached skill extensions before creating a new game.
  OverlayManager.clearCache();

  // perform original logic.
  J.EXTEND.Aliased.DataManager.get('setupNewGame')
    .call(this);
};

/**
 * Extends {@link #extractSaveContents}.<br/>
 * Also clears the RPGManager note cache before applying save data.
 */
J.EXTEND.Aliased.DataManager.set('extractSaveContents', DataManager.extractSaveContents);
DataManager.extractSaveContents = function(contents)
{
  // clear any previously cached skill extensions before applying the save contents.
  OverlayManager.clearCache();

  // perform original logic.
  J.EXTEND.Aliased.DataManager.get('extractSaveContents')
    .call(this, contents);
};

/**
 * Extends {@link #setupBattleTest}.<br/>
 * Also clears the RPGManager note cache when entering battle test.
 */
J.EXTEND.Aliased.DataManager.set('setupBattleTest', DataManager.setupBattleTest);
DataManager.setupBattleTest = function()
{
  // clear cache to ensure battle test uses fresh extensions.
  OverlayManager.clearCache();

  // perform original logic.
  J.EXTEND.Aliased.DataManager.get('setupBattleTest')
    .call(this);
};
//endregion DataManager