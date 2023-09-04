//region DataManager
/**
 * The global text logger.
 * @type {MapLogManager}
 */
var $mapLogManager = null;

/**
 * Hooks into `DataManager` to create the game objects.
 */
J.LOG.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.LOG.Aliased.DataManager.get('createGameObjects').call(this);

  // generate a new instance of the text log.
  $mapLogManager = new MapLogManager();
};
//endregion DataManager