//region DataManager
/**
 * Hooks into `DataManager` to create the game objects.
 */
J.LOG.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.LOG.Aliased.DataManager.get('createGameObjects').call(this);

  // generate a new instance of the action log manager.
  $mapLogManager = new MapLogManager();
  $mapLogManager.setMaxLogCount(30);

  // generate a new instance of the dia log manager.
  $diaLogManager = new MapLogManager();
  $diaLogManager.setMaxLogCount(10);
};
//endregion DataManager