//region DataManager
import SaveFileSystem from './SaveFileSystem.js';

/**
 * Extends {@link #makeSavefileInfo}.<br/>
 * Also describes the playthrough well enough that a load menu never has to open a world.
 *
 * The vanilla five - title, characters, faces, playtime, timestamp - stay exactly as they are,
 * because {@link Window_SavefileList} reads them by name. Everything added here is what a save menu
 * worth looking at would want to show, and it costs nothing: this object is written into the
 * generation's manifest, which is the one file the load menu reads.
 * @returns {object} The savefile info, extended.
 */
J.BASE.EXT.SAVE.Aliased.DataManager.set('makeSavefileInfo', DataManager.makeSavefileInfo);
DataManager.makeSavefileInfo = function()
{
  // perform original logic.
  const info = J.BASE.EXT.SAVE.Aliased.DataManager.get('makeSavefileInfo')
    .call(this);

  const leader = $gameParty.leader();

  info.mapName = this.savefileMapName();

  info.leaderName = leader.name();

  info.level = leader.level;

  info.gold = $gameParty.gold();

  // the roster is written as ids rather than as members, because this block has to survive being
  // read by a menu that has not loaded anything else about the save.
  info.party = $gameParty.allMembers()
    .map(member => member.actorId());

  return info;
};

/**
 * Gets the name of the map the player is standing on, for a savefile's summary.
 *
 * The display name is preferred because it is the name the player has actually seen; the editor's
 * name for the map is the fallback for the many maps that have no display name set.
 * @returns {string}
 */
DataManager.savefileMapName = function()
{
  const displayName = $gameMap.displayName();

  if (displayName !== String.empty) return displayName;

  return $dataMapInfos[$gameMap.mapId()].name;
};

/**
 * Overwrites {@link #maxSavefiles}.<br/>
 * Answers with the number of slots the files scene actually renders.
 *
 * Vanilla says twenty, and leaving that disagreeing with what is drawn causes two real problems rather
 * than one cosmetic one:
 *
 * - `DataManager.selectSavefileForNewGame` picks the first empty slot across the whole range and stamps
 *   `$gameSystem.setSavefileId` with it. It can land on a slot the scene never draws, which puts that
 *   playthrough's entire generation history somewhere Rewind can never reach.
 * - {@link #loadGlobalInfo} loops the same range, so every open of the load menu reads eighteen absent
 *   manifests to learn nothing.
 *
 * This is the one knob, and both problems turn with it. It is a plain constant rather than a plugin
 * parameter for now, deliberately - see the files scene plan.
 * @returns {number}
 */
DataManager.maxSavefiles = function()
{
  return 2;
};

/**
 * Loads one specific generation of a slot, rather than the newest one that works.
 *
 * Mirrors vanilla's {@link #loadGame} step for step, and that is the whole reason it exists. Reading
 * the file is not loading it: `createGameObjects`, `extractSaveContents` and `correctDataErrors` are
 * what actually replace the running game, and without this layer a rewind would decode a perfectly good
 * generation and then quietly do nothing with it.
 * @param {number} savefileId The slot to read from.
 * @param {string} generationName The generation to read, ex: `gen-0007`.
 * @returns {Promise<number>}
 */
DataManager.loadGeneration = function(savefileId, generationName)
{
  const saveName = this.makeSavename(savefileId);

  return StorageManager.loadGeneration(saveName, generationName)
    .then(contents =>
    {
      this.createGameObjects();
      this.extractSaveContents(contents);
      this.correctDataErrors();

      return 0;
    });
};

/**
 * Overwrites {@link #loadGlobalInfo}.<br/>
 * Builds the savefile index by reading each slot's manifest instead of a parallel index file.
 *
 * Vanilla keeps `global.rmmzsave`, a second document listing what every slot holds, and it can drift
 * from the slots themselves - it is written after the save it describes, so a crash between the two
 * leaves the menu describing a save that is not there, or hiding one that is. Here each generation
 * carries its own summary, so the index is derived rather than stored and cannot disagree with the
 * thing it indexes.
 */
DataManager.loadGlobalInfo = function()
{
  const globalInfo = [];

  // slot ids start at one; index zero is deliberately left empty, as vanilla leaves it.
  for (let savefileId = 1; savefileId <= this.maxSavefiles(); savefileId++)
  {
    const manifest = SaveFileSystem.readManifest(this.makeSavename(savefileId));

    if (manifest === null) continue;

    globalInfo[savefileId] = manifest.display;
  }

  this._globalInfo = globalInfo;
};

/**
 * Overwrites {@link #saveGlobalInfo}.<br/>
 * Does nothing, because the index is derived from the manifests rather than written beside them.
 *
 * The in-memory `_globalInfo` the engine updates after a save is still correct for this session;
 * the next boot rebuilds it from the manifests. Deliberately kept as a no-op rather than deleted,
 * since the engine calls it from {@link #saveGame}.
 */
DataManager.saveGlobalInfo = function()
{
};
//endregion DataManager
