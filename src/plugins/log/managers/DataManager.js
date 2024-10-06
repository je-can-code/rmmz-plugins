//region DataManager
/**
 * Hooks into `DataManager` to create the game objects.
 */
J.LOG.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.LOG.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // generate a new instance of the action log manager.
  $actionLogManager = new MapLogManager();
  $actionLogManager.setMaxLogCount(30);

  // generate a new instance of the dia log manager.
  $diaLogManager = new MapLogManager();
  $diaLogManager.setMaxLogCount(10);

  // generate a new instance of the loot log manager.
  $lootLogManager = new MapLogManager();
  $lootLogManager.setMaxLogCount(100);
};
//endregion DataManager