//region DataManager
import MapLogRegistry from './MapLogRegistry.js';

/**
 * Hooks into `DataManager` to create the game objects.
 */
J.LOG.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.LOG.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // generate the registry, which builds all three channels at their own capacities.
  $mapLogs = new MapLogRegistry();
};
//endregion DataManager