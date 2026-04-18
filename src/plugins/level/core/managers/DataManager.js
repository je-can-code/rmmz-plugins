//region DataManager
/**
 * Extends {@link #setupNewGame}.<br/>
 * Also builds the beyond max data for classes.
 */
J.LEVEL.Aliased.DataManager.set('setupNewGame', DataManager.setupNewGame);
DataManager.setupNewGame = function()
{
  // perform original logic.
  J.LEVEL.Aliased.DataManager.get('setupNewGame')
    .call(this);

  // also build the beyond max data.
  $gameTemp.buildBeyondMaxData();
};
//endregion DataManager