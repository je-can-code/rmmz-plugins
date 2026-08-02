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
