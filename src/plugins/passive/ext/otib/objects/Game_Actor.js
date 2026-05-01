//region Game_Actor
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes the OTIB unlock storage for this actor.
 */
J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('initMembers')
    .call(this);

  // initialize the otib properties.
  this.initOtibMembers();
};

/**
 * Initializes the OTIB unlock storage on this actor.
 */
Game_Actor.prototype.initOtibMembers = function()
{
  this._j ||= {};

  /**
   * A grouping of all properties associated with OTIB.
   */
  this._j._otib ||= {};

  /**
   * The persisted list of all OTIB unlocks earned by this actor.
   * Each entry is an {@link OtibUnlockRecord} mapping an item id to the states it granted.
   * @type {OtibUnlockRecord[]}
   */
  this._j._otib._unlocks ||= [];
};

/**
 * Gets all OTIB unlock records for this actor.
 * @returns {OtibUnlockRecord[]}
 */
Game_Actor.prototype.otibUnlocks = function()
{
  return this._j._otib._unlocks;
};

/**
 * Adds a new unlock record to this actor's OTIB history.
 * @param {OtibUnlockRecord} record The unlock record to persist.
 */
Game_Actor.prototype.addOtibUnlock = function(record)
{
  this.otibUnlocks()
    .push(record);
};

/**
 * Gets a flat array of all state ids currently granted to this actor via OTIB.
 * Used by the passive viewer's tab filter to identify which passive states came from OTIB.
 * @returns {number[]}
 */
Game_Actor.prototype.otibPassiveStateIds = function()
{
  return this.otibUnlocks()
    .flatMap(unlock => unlock.stateIds);
};

/**
 * Determines whether or not this actor has already unlocked the OTIB for the given item.
 * @param {number} itemId The id of the item to check.
 * @returns {boolean} True if the unlock record exists for this item, false otherwise.
 */
Game_Actor.prototype.isOtibUnlocked = function(itemId)
{
  return this.otibUnlocks()
    .some(unlock => unlock.itemId === itemId);
};

/**
 * Overrides {@link Game_Battler#handleOtibUnlock} with the real actor implementation.<br>
 * Checks whether this item has an OTIB notetag and, if so, persists the unlock record
 * and refreshes the passive pipeline so the granted states take effect immediately.
 * When J-Log is present, fires a DiaLog message for each newly unlocked state.
 * @param {RPG_Item} item The item that was consumed.
 */
Game_Actor.prototype.handleOtibUnlock = function(item)
{
  // items with no OTIB notetag are not part of this system.
  const stateIds = item.otibStateIds;
  if (stateIds.length === 0) return;

  // skip if this actor already earned the unlock for this item.
  if (this.isOtibUnlocked(item.id)) return;

  // persist the unlock record so it survives save/load.
  this.addOtibUnlock(new OtibUnlockRecord(item.id, stateIds));

  // rebuild the passive pipeline to include the newly unlocked states.
  this.refreshPassiveStates();

  // notify the player of each newly unlocked state via DiaLog when J-Log is loaded.
  if (J.LOG && $diaLogManager)
  {
    this.notifyOtibUnlock(item, stateIds);
  }
};

/**
 * Fires one DiaLog message per unlocked state, telling the player what was gained.
 * Falls through silently if $diaLogManager is not yet available on the scene.
 * @param {RPG_Item} item The item that triggered the unlock.
 * @param {number[]} stateIds The state ids that were just unlocked.
 */
Game_Actor.prototype.notifyOtibUnlock = function(item, stateIds)
{
  stateIds.forEach(stateId =>
  {
    // \item[id] and \state[id] are drawTextEx escape codes that render the icon + name inline.
    // two lines: item on the first (main), unlocked state on the second (subtext).
    const log = new DiaLogBuilder()
      .addLine(`Consuming the \\item[${item.id}]`)
      .addLine(`unlocked \\state[${stateId}] effect!`)
      .build();
    $diaLogManager.addLog(log);
  });
};

/**
 * Extends {@link #getPassiveStateSources}.<br>
 * Injects OTIB-derived synthetic passive sources so the pipeline picks them up
 * on every refresh without needing to persist RPG_BaseItem instances.
 * @returns {(RPG_Actor|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State|RPG_BaseItem)[]}
 */
J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.set('getPassiveStateSources', Game_Actor.prototype.getPassiveStateSources);
Game_Actor.prototype.getPassiveStateSources = function()
{
  // perform original logic.
  const sources = J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('getPassiveStateSources')
    .call(this);

  // append one synthetic source per OTIB unlock so the passive pipeline sees them.
  sources.push(...this.buildOtibPassiveSources());

  // return the combined source list.
  return sources;
};

/**
 * Builds a synthetic {@link RPG_BaseItem} per OTIB unlock so the passive pipeline
 * can derive state ids from them via the standard <passive:[...]> note format.
 * @returns {RPG_BaseItem[]}
 */
Game_Actor.prototype.buildOtibPassiveSources = function()
{
  return this.otibUnlocks()
    .map(unlock => this.buildSourceFromStateIds(unlock.stateIds));
};
//endregion Game_Actor