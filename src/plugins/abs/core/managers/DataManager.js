/* eslint-disable no-unused-vars */
//region DataManager
import JABS_Engine from './JABS_Engine.js';
/**
 * The global reference for the `JABS_Engine` data object.
 * @type {JABS_Engine}
 * @global
 */
globalThis.$jabsEngine = null;

/**
 * The global reference for the `Game_Enemies` data object.<br/>
 *
 * Unlike `$gameActors`, this is effectively a `Game_Enemy` factory rather than
 * a getter for `Game_Actor`s.
 * @type {Game_Enemies}
 * @global
 */
globalThis.$gameEnemies = null;

/**
 * The global reference for the `$dataMap` data object that contains all the replicable JABS actions.
 * @type {Map}
 * @global
 */
globalThis.$actionMap = null;

/**
 * Extends {@link DataManager.createGameObjects}.<br/>
 * Includes creation of our global game objects.
 */
J.ABS.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.ABS.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // update the skill master map to have data.
  DataManager.getSkillMasterMap();

  // instantiate the engine itself.
  globalThis.$jabsEngine = new JABS_Engine();

  // setup the global access to the enemies database data.
  globalThis.$gameEnemies = new Game_Enemies();
};

/**
 * Executes the retrieval of the skill master map from which we clone all action events.
 */
DataManager.getSkillMasterMap = function()
{
  const mapId = J.ABS.DefaultValues.ActionMap;
  if (mapId > 0)
  {
    const filename = 'Map%1.json'.format(mapId.padZero(3));
    this.loadSkillMasterMap('$dataMap', filename);
  }
  else
  {
    throw new Error('Missing skill master map.');
  }
};

/**
 * Retrieves the skill master map.
 * @param {string} name The name of the file to retrieve.
 * @param {string} src The source.
 */
DataManager.loadSkillMasterMap = function(name, src)
{
  const xhr = new XMLHttpRequest();
  const url = `data/${src}`;
  xhr.open('GET', url);
  xhr.overrideMimeType('application/json');
  xhr.onload = () => this.onMapGet(xhr, name, src, url);
  xhr.onerror = () => this.gracefulFail(name, src, url);
  xhr.send();
};

/**
 * Retrieves the map data file from a given location.
 * @param {XMLHttpRequest} xhr The `xhr` service for fetching files from the local.
 * @param {string} name The name of the file to retrieve.
 * @param {string} src The source.
 * @param {string} url The path of the file to retrieve.
 */
DataManager.onMapGet = function(xhr, name, src, url)
{
  if (xhr.status < 400)
  {
    globalThis.$actionMap = JSON.parse(xhr.responseText);
  }
  else
  {
    this.gracefulFail(name, src, url);
  }
};

/**
 * Gracefully fails and just logs it a missing file or whatever is the problem.
 * @param {string} name The name of the problemed file.
 * @param {string} src The source.
 * @param {string} url The path of the problemed file.
 */
DataManager.gracefulFail = function(name, src, url)
{
  Diagnostics.error('J-ABS', `failed to load a data file: ${name}`, {
    name,
    src,
    url,
  });
};

/**
 * Extends {@link DataManager.makeSaveContents}.<br/>
 * Reviews the save contents to ensure that there are no circular references.
 */
J.ABS.Aliased.DataManager.set('makeSaveContents', DataManager.makeSaveContents);
DataManager.makeSaveContents = function()
{
  // perform original logic.
  const contents = J.ABS.Aliased.DataManager.get('makeSaveContents')
    .call(this);

  /**
   * @type {Game_Event[]}
   */
  const originalEvents = contents.map._events;

  const actionlessEvents = originalEvents.map(event =>
  {
    // if the event itself is falsey, then return whatever it is.
    if (!event) return event;

    // don't save actions.
    if (event.isJabsAction()) return null;

    // save it.
    return event;
  });

  // update the events with the action-free list.
  contents.map._events = actionlessEvents;

  // return the contents.
  return contents;
};
//endregion