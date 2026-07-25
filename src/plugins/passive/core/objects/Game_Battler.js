//region Game_Battler
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the passive states properties for this battler.
 */
J.PASSIVE.Aliased.Game_BattlerBase.set('initMembers', Game_Battler.prototype.initMembers);
Game_Battler.prototype.initMembers = function()
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_BattlerBase.get('initMembers')
    .call(this);

  // initialize the passive states properties.
  this.initPassiveStatesMembers();
};

/**
 * Initializes the passives collection
 */
Game_Battler.prototype.initPassiveStatesMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with passive states.
   */
  this._j._passive ||= {};

  /**
   * A cached list of all currently applied passive state ids.
   * @type {number[]|null}
   */
  this._j._passive._stateIds = [];

  /**
   * A group of all external sources that are associated with this battler's passive states.
   * @type {RPG_BaseItem[]}
   */
  this._j._passive._externalStateSources = [];

  /**
   * Pre-filtered subset of passive sources rebuilt after each {@link #refreshPassiveStates}.
   * Contains only sources that declare at least one passive state id; sources like weapon
   * combat skills that carry no passive tags are excluded so drift checks skip them.
   * @type {RPG_BaseItem[]}
   */
  this._j._passive._passiveSources = [];
};

/**
 * Get all currently known passive state ids this battler has.
 * @returns {number[]}
 */
Game_Battler.prototype.getPassiveStateIds = function()
{
  return this._j._passive._stateIds;
};

/**
 * Gets all the external sources (as base items) for this battler.
 * @returns {RPG_BaseItem[]}
 */
Game_Battler.prototype.passiveExternalStateSources = function()
{
  return this._j._passive._externalStateSources;
};

/**
 * Returns the pre-filtered list of passive-capable sources from the last refresh.<br/>
 * Contains only sources that declared at least one passive state id.
 * @returns {RPG_BaseItem[]}
 */
Game_Battler.prototype.passiveCapableSources = function()
{
  return this._j._passive._passiveSources;
};

/**
 * Rebuilds the filtered list of passive-capable sources from the full source list.<br/>
 * Called at the end of {@link #refreshPassiveStates} so the conditional ext's drift
 * fingerprint builder has a short list to iterate instead of the full source roster.
 */
Game_Battler.prototype.cachePassiveCapableSources = function()
{
  const allSources = this.getPassiveStateSources();

  this._j._passive._passiveSources = allSources.filter(source =>
    this.sourceHasAnyPassiveIds(source));
};

/**
 * Whether a source has any passive state ids on any passive tag variant.<br/>
 * Accounts for unique vs stackable and for equip-specific passive id properties.
 * All reads hit the {@link RPGManager} WeakMap cache so no regex work occurs here.
 * @param {RPG_BaseItem} source The source to inspect.
 * @returns {boolean} True when this source carries at least one passive state id.
 */
Game_Battler.prototype.sourceHasAnyPassiveIds = function(source)
{
  if (!source) return false;

  if (source.passiveStateIds && source.passiveStateIds.length > 0) return true;
  if (source.uniquePassiveStateIds && source.uniquePassiveStateIds.length > 0) return true;

  // equip items expose separate equip-slot-specific passive id properties.
  if (source.isEquipItem())
  {
    if (source.equippedPassiveStateIds && source.equippedPassiveStateIds.length > 0) return true;
    if (source.uniqueEquippedPassiveStateIds && source.uniqueEquippedPassiveStateIds.length > 0) return true;
  }

  return false;
};

/**
 * Adds a collection of state ids to the external passive state ids list.
 * @param {number[]} stateIds The ids of the external passive states.
 * @param {boolean} deferRefresh Whether or not to defer refreshing the passive states.
 */
Game_Battler.prototype.addPassiveStateExternalSourceByStateIds = function(stateIds, deferRefresh = false)
{
  // convert the state ids to a base item.
  const baseItem = this.buildSourceFromStateIds(stateIds);

  // add the converted item to the list.
  this.addPassiveStateExternalSource(baseItem, deferRefresh);
};

/**
 * Adds a source to the external passive source list.
 * @param {RPG_BaseItem} source The source to add.
 * @param {boolean} deferRefresh Whether or not to defer refreshing the passive states.
 */
Game_Battler.prototype.addPassiveStateExternalSource = function(source, deferRefresh = false)
{
  // add the converted item to the list.
  this._j._passive._externalStateSources.push(source);

  // if we are not deferring refreshing, then do it now.
  if (deferRefresh === true) return;

  // also refresh the passive states.
  this.refreshPassiveStates();
};

/**
 * Clears all external passive state sources.
 * @param {boolean} deferRefresh Whether or not to defer refreshing the passive states.
 */
Game_Battler.prototype.clearPassiveStateExternalSources = function(deferRefresh = false)
{
  // empty the external sources list.
  this._j._passive._externalStateSources = [];

  // if we're deferring the refresh, then don't do it.
  if (deferRefresh === true) return;

  // refresh the passive states.
  this.refreshPassiveStates();
};

/**
 * Builds a dummy base item that can be used to represent passive state ids.
 *
 * Note: these base items aren't real items from the database and shouldn't be used as such!
 * @param {number[]} stateIds The passive state ids to add to the base item.
 * @returns {RPG_BaseItem} The constructed base item.
 */
Game_Battler.prototype.buildSourceFromStateIds = function(stateIds)
{
  // build a fake base item.
  const baseItem = {
    id: -1,
    meta: {},
    name: String.empty,
    note: `<passive:[${stateIds.join(',')}]>`,
    description: String.empty,
    iconIndex: 0,
  };

  // return the constructed base item.
  return new RPG_BaseItem(baseItem, baseItem.id);
};

/**
 * Adds the given state id to the passive state ids collection for this battler.
 * If `allowDuplicates` is `false`, then the adding of the state id will be ignored
 * if the battler already has the id.
 * @param {number} stateId The id of the state to add.
 * @param {boolean=} allowDuplicates Whether or not duplicate state ids is permitted; defaults to true.
 */
Game_Battler.prototype.addPassiveStateId = function(stateId, allowDuplicates = true)
{
  // check if we disallow duplicates and already have the state tracked.
  if (!this.canAddPassiveStateId(stateId, allowDuplicates)) return;

  // grab the passive state id collection.
  const passiveStateIds = this.getPassiveStateIds();

  // add the stateId to the collection.
  passiveStateIds.push(stateId);
};

/**
 * Determines whether or not a given stateId can be added to the list
 * @param {number} stateId The id of the state to add.
 * @param {boolean=} allowDuplicates Whether or not duplicate state ids is permitted; defaults to true.
 * @returns {boolean} True if the state id can be added to the passives collection, false otherwise.
 */
Game_Battler.prototype.canAddPassiveStateId = function(stateId, allowDuplicates)
{
  // if we don't allow duplicates and already are have this stateId, then don't add it.
  if (!allowDuplicates && this.getPassiveStateIds()
    .includes(stateId))
  {
    return false;
  }

  // TODO: check for blacklisted ids as well.

  // we can add this stateId!
  return true;
};

/**
 * Gets the converted {@link RPG_State} form of all currently applied passive states.
 * @returns {RPG_State[]}
 */
Game_Battler.prototype.getPassiveStates = function()
{
  return this.getPassiveStateIds()
    .map(this.state, this);
};

/**
 * Clears all passive state data currently tracked.
 */
Game_Battler.prototype.clearPassiveStates = function()
{
  // empty the state tracker.
  this._j._passive._stateIds = [];
};

/**
 * Clears and updates the passive state tracker with the latest.
 */
Game_Battler.prototype.refreshPassiveStates = function()
{
  // remove all currently tracked passive states.
  this.clearPassiveStates();

  // grab all the unique ids.
  const uniqueIds = this.getAllUniquePassiveStateIds();

  // commit unique passives first so nested stack grants on mastery state rows resolve this pass.
  uniqueIds.forEach(stateId => this.addPassiveStateId(stateId, false), this);

  // grab stackable ids after unique rows are in the tracker — mastery states can own passiveStateCount.
  const stackableIds = this.getAllStackablePassiveStateIds();

  // add all the stackable ids to the tracker.
  stackableIds.forEach((stackCount, stateId) =>
  {
    // don't re-add unique passive states.
    if (uniqueIds.has(stateId)) return;

    // capture the number of times to duplicate the state object.
    let times = stackCount;

    // while we have times left, keep going.
    while (times > 0)
    {
      // add the stackable passive state id.
      this.addPassiveStateId(stateId);

      // decrement the counter.
      times--;
    }
  });

  // rebuild the filtered source cache so drift checks skip non-passive sources next cycle.
  this.cachePassiveCapableSources();

  // flag that battler data has changed.
  this.onBattlerDataChange();
};

/**
 * Determines whether a passive state from a specific source may be included
 * in this battler's passive collection right now.<br/>
 * Returns true unconditionally in the base; extension plugins override to apply gate rules.
 * @param {RPG_BaseItem} baseItem Database row that declares the passive state id.
 * @param {number} stateId Passive state id being evaluated for inclusion.
 * @returns {boolean} Whether this source/state pair passes all gate conditions.
 */
Game_Battler.prototype.canIncludePassiveStateFromSource = function(_baseItem, _stateId)
{
  // base implementation always allows — conditional ext overrides with gate rule logic.
  return true;
};

/**
 * Returns how many stacks one source contributes for a given passive state id.<br/>
 * Returns 1 unconditionally in the base; extension plugins override to scale by runtime context.
 * @param {RPG_BaseItem} baseItem Database row that declares the passive state id.
 * @param {number} stateId Passive state id being evaluated for stack contribution.
 * @returns {number} Stack contribution from this source (0 excludes it from the stack map).
 */
Game_Battler.prototype.getPassiveStackContributionFromSource = function(_baseItem, _stateId)
{
  // base implementation contributes a flat 1 stack — conditional ext overrides for scaling.
  return 1;
};

/**
 * Gets all unique passive state ids that are present across all sources this
 * battler owns.
 * @returns {Set<number>}
 */
Game_Battler.prototype.getAllUniquePassiveStateIds = function()
{
  // initialize the set of unique ids; there can only be one!
  const uniquePassiveStateIds = new Set();

  // grab all objects to get unique passive state ids from.
  const everything = this.getPassiveStateSources();

  // iterate over all the things.
  everything.forEach(baseItem =>
  {
    // grab the unique ids from the item.
    const uniqueIds = baseItem.uniquePassiveStateIds;

    // check if we need to include passive state ids, too.
    if (baseItem.isEquipItem())
    {
      // add the equip-only passive state ids.
      uniqueIds.push(...baseItem.uniqueEquippedPassiveStateIds);
    }

    // gate each candidate through the virtual inclusion hook before committing to the set.
    uniqueIds.forEach(id =>
    {
      if (this.canIncludePassiveStateFromSource(baseItem, id) === false) return;

      // add the gated id to the unique passive set.
      uniquePassiveStateIds.add(id);
    }, this);
  });

  // return the completed unique set.
  return uniquePassiveStateIds;
};

/**
 * Gets all stackable passive state ids that are present across all sources this
 * battler owns.
 * @returns {Map<number, number>}
 */
Game_Battler.prototype.getAllStackablePassiveStateIds = function()
{
  // initialize the map of stackable ids; each one can have many.
  /** @type {Map<number, number>} */
  const stackablePassiveStateIds = new Map();

  // grab all objects to get stackable passive state ids from.
  const everything = this.getPassiveStateSources();

  // iterate over all the things.
  everything.forEach(baseItem =>
  {
    // grab the stackable ids from the item.
    const stackableIds = baseItem.passiveStateIds;

    // check if we need to include passive state ids, too.
    if (baseItem.isEquipItem())
    {
      // add the equip-only passive state ids.
      stackableIds.push(...baseItem.equippedPassiveStateIds);
    }

    // iterate over each of the stackable passive state ids on this item.
    stackableIds.forEach(id =>
    {
      // gate each candidate through the virtual inclusion hook — conditional ext may veto.
      if (this.canIncludePassiveStateFromSource(baseItem, id) === false) return;

      // ask the virtual contribution hook for the stack amount — conditional ext may scale.
      const contribution = this.getPassiveStackContributionFromSource(baseItem, id);

      // zero contribution means this source/state pair is excluded from the stack map.
      if (contribution <= 0) return;

      // check if we are already tracking this passive state id.
      if (stackablePassiveStateIds.has(id))
      {
        // grab the running stack total for this passive state id.
        const stack = stackablePassiveStateIds.get(id);

        // add the source contribution to the running total.
        stackablePassiveStateIds.set(id, stack + contribution);
      }
      // we aren't tracking this passive state id yet.
      else
      {
        // start the stack at the contribution amount for this source.
        stackablePassiveStateIds.set(id, contribution);
      }
    }, this);
  });

  // return the completed stackable map.
  return stackablePassiveStateIds;
};

/**
 * Gets all sources from which this battler can derive passive state from.
 *
 * This does include a reference call to potentially getting passive states, but due
 * to control flows, this should always come back with no passive states in the list.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]}
 */
Game_Battler.prototype.getPassiveStateSources = function()
{
  // define all sources from which passive states can come from.
  const battlerSources = [
    // ones own data from the database, such as the actor or enemy data.
    this.databaseData(),

    // all states currently applied to the battler, including passive states via the allStates() override.
    ...this.allStates(),

    // all skills that currently qualify as passive state sources for this battler.
    ...this.getPassiveStateSourcedSkills(),

    // add all sources from events.
    ...this.passiveExternalStateSources(),
  ];

  // return this collection of stuff.
  return battlerSources;
};

/**
 * Gets the skills that currently qualify as passive state sources for this battler.
 * By default, every learned skill qualifies- this exists as its own seam so extensions
 * (such as one bridging to an equip-slot system) can narrow the list down to only skills
 * that are actually in play, without needing to override the whole of {@link #getPassiveStateSources}.
 * @returns {RPG_Skill[]}
 */
Game_Battler.prototype.getPassiveStateSourcedSkills = function()
{
  // by default, every learned skill is a passive state source.
  return this.skills();
};

/**
 * Determines whether or not the state id is a passive state or not.
 * @param {number} stateId The state id to check.
 * @returns {boolean} True if it is identified as passive, false otherwise.
 */
Game_Battler.prototype.isPassiveState = function(stateId)
{
  // then the answer lies in whether or not the given state id is in that list.
  return this._j._passive._stateIds.includes(stateId);
};

/**
 * Extends {@link #allStates}.<br/>
 * Includes states from passive skills as well.
 * @returns {RPG_State[]}
 */
J.PASSIVE.Aliased.Game_Battler.set('allStates', Game_Battler.prototype.allStates);
Game_Battler.prototype.allStates = function()
{
  // perform original logic.
  const states = J.PASSIVE.Aliased.Game_Battler.get('allStates')
    .call(this);

  // add in all passive skill states.
  states.push(...this.getPassiveStates());

  // return that combined collection.
  return states;
};

/**
 * Extends {@link #allStateIds}.<br/>
 * Includes state ids from passive skills as well.
 * @returns {number[]}
 */
J.PASSIVE.Aliased.Game_Battler.set('allStateIds', Game_Battler.prototype.allStateIds);
Game_Battler.prototype.allStateIds = function()
{
  // perform original logic.
  const ids = J.PASSIVE.Aliased.Game_Battler.get('allStateIds')
    .call(this);

  // add in all passive state ids, including stacks.
  ids.push(...this.getPassiveStateIds());

  // return that combined collection.
  return ids;
};

/**
 * Overrides {@link #getPurgeableStates}.<br/>
 * Excludes passive states from the pool so forced removal via {@code removeStatesByPriority}
 * can never strip states that are granted by passive skills.
 * @returns {RPG_State[]}
 */
Game_Battler.prototype.getPurgeableStates = function()
{
  // start from all states, then remove any that are passive-granted.
  return this.allStates()
    .filter(state => this.isPassiveState(state.id) === false);
};

/**
 * Extends {@link #isStateAddable}.<br/>
 * Prevents adding states if they are identified as passive.
 */
J.PASSIVE.Aliased.Game_Battler.set('isStateAddable', Game_Battler.prototype.isStateAddable);
Game_Battler.prototype.isStateAddable = function(stateId)
{
  // skip adding if it is a passive state.
  if (this.isPassiveState(stateId)) return false;

  // otherwise, check as normal.
  // perform original logic.
  return J.PASSIVE.Aliased.Game_Battler.get('isStateAddable')
    .call(this, stateId);
};

/**
 * Extends {@link #onStateAdded}.<br/>
 * Triggers a refresh of passive states when a state is added.
 * @param {number} stateId The state id being added.
 */
J.PASSIVE.Aliased.Game_Battler.set('onStateAdded', Game_Battler.prototype.onStateAdded);
Game_Battler.prototype.onStateAdded = function(stateId)
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_Battler.get('onStateAdded')
    .call(this, stateId);

  // refresh our passive state list.
  this.refreshPassiveStates();
};

/**
 * Extends {@link #removeState}.<br/>
 * Prevent removal of states if they are identified as passive.
 */
J.PASSIVE.Aliased.Game_Battler.set('removeState', Game_Battler.prototype.removeState);
Game_Battler.prototype.removeState = function(stateId)
{
  // skip removal if it is a passive state.
  if (this.isPassiveState(stateId)) return;

  // otherwise, remove as normal.
  // perform original logic.
  J.PASSIVE.Aliased.Game_Battler.get('removeState')
    .call(this, stateId);
};

/**
 * Extends {@link #onStateRemoval}.<br/>
 * Triggers a refresh of passive states when a state is removed.
 * @param {number} stateId The state id being removed.
 */
J.PASSIVE.Aliased.Game_Battler.set('onStateRemoval', Game_Battler.prototype.onStateRemoval);
Game_Battler.prototype.onStateRemoval = function(stateId)
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_Battler.get('onStateRemoval')
    .call(this, stateId);

  // refresh our passive state list.
  this.refreshPassiveStates();
};
//endregion Game_Battler