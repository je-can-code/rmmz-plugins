//region Game_System
/**
 * Extends {@link Game_System.initMembers}.<br/>
 * Also initializes the respawn registry for defeated battlers.
 */
J.ABS.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_System.get('initMembers')
    .call(this);

  // initialize the respawn registry.
  this.initRespawnMembers();
};

/**
 * Initializes the respawn registry members.
 */
Game_System.prototype.initRespawnMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * The registry of all pending and permanent respawns, world-wide.
   *
   * This is world state rather than party state: a record means "this authored event on this map
   * may not become a battler yet (or ever)". Keyed by map id, then by event id.
   * @type {Map<number, Map<number, JABS_RespawnRecord>>}
   */
  this._j._abs._respawns ||= new Map();
};

/**
 * Gets the whole respawn registry.
 * @returns {Map<number, Map<number, JABS_RespawnRecord>>}
 */
Game_System.prototype.respawnRegistry = function()
{
  return this._j._abs._respawns;
};

/**
 * Gets the respawn record for the given event on the given map, if one exists.
 * @param {number} mapId The id of the map the event lives on.
 * @param {number} eventId The id of the authored event.
 * @returns {JABS_RespawnRecord|null} The record, or null when nothing is tracked.
 */
Game_System.prototype.respawnRecord = function(mapId, eventId)
{
  // find the map's own respawn records.
  const mapRecords = this.respawnRegistry()
    .get(mapId);

  // an untracked map tracks no events.
  if (!mapRecords) return null;

  // hand back the record if we have one.
  return mapRecords.get(eventId) ?? null;
};

/**
 * Registers a respawn record for the given event on the given map.
 * A newer record for the same event replaces the older one outright.
 * @param {number} mapId The id of the map the event lives on.
 * @param {number} eventId The id of the authored event.
 * @param {JABS_RespawnRecord} record The record to register.
 */
Game_System.prototype.setRespawnRecord = function(mapId, eventId, record)
{
  // find the map's own respawn records.
  let mapRecords = this.respawnRegistry()
    .get(mapId);

  // check if this map has never tracked a respawn before.
  if (!mapRecords)
  {
    // establish the map's own tracking.
    mapRecords = new Map();
    this.respawnRegistry()
      .set(mapId, mapRecords);
  }

  // track the record.
  mapRecords.set(eventId, record);
};

/**
 * Removes the respawn record for the given event on the given map, if one exists.
 * Emptied maps are dropped from the registry entirely so saves don't accumulate husks.
 * @param {number} mapId The id of the map the event lives on.
 * @param {number} eventId The id of the authored event.
 */
Game_System.prototype.clearRespawnRecord = function(mapId, eventId)
{
  // find the map's own respawn records.
  const mapRecords = this.respawnRegistry()
    .get(mapId);

  // an untracked map has nothing to clear.
  if (!mapRecords) return;

  // drop the record.
  mapRecords.delete(eventId);

  // check if that was the last record for this map.
  if (mapRecords.size === 0)
  {
    // drop the map's emptied tracking, too.
    this.respawnRegistry()
      .delete(mapId);
  }
};

/**
 * Gets all respawn records currently tracked for the given map.
 * @param {number} mapId The id of the map to fetch records for.
 * @returns {[number, JABS_RespawnRecord][]} The event-id-to-record pairs; possibly empty.
 */
Game_System.prototype.respawnRecordsForMap = function(mapId)
{
  // find the map's own respawn records.
  const mapRecords = this.respawnRegistry()
    .get(mapId);

  // an untracked map tracks no events.
  if (!mapRecords) return [];

  // hand back the pairs.
  return Array.from(mapRecords.entries());
};
//endregion Game_System