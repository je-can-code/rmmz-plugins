/**
 * Extends {@link DataManager.setupNewGame}.<br/>
 * Includes difficulty setup for new games.
 */
J.PASSIVE.EXT.DIFFICULTY.Aliased.DataManager.set('setupNewGame', DataManager.setupNewGame);
DataManager.setupNewGame = function()
{
  // perform original logic.
  J.PASSIVE.EXT.DIFFICULTY.Aliased.DataManager.get('setupNewGame')
    .call(this);

  // setup the difficulty layers in the temp data.
  $gameTemp.setupDifficultySystem();
};