//region aggro
/**
 * Adjust the currently engaged target based on aggro.
 */
JABS_Battler.prototype.adjustTargetByAggro = function()
{
  // don't process aggro for inanimate battlers.
  if (this.isInanimate()) return;

  // extract the uuid of the current highest aggro.
  const highestAggroUuid = this.getHighestAggro()
    .uuid();

  // check if we currently don't have a target.
  if (!this.getTarget())
  {
    // grab the battler for that uuid.
    const newTarget = JABS_AiManager.getBattlerByUuid(highestAggroUuid);

    // make sure the battler exists before setting it.
    if (newTarget)
    {
      // set it.
      this.setTarget(newTarget);
    }

    // stop processing .
    return;
  }

  // if the target is no longer valid, disengage and end combat.
  this.removeAggroIfInvalid(this.getTarget()
    .getUuid());

  const allAggros = this.getAggrosSortedHighestToLowest();

  // if there is no aggros remaining, disengage.
  if (allAggros.length === 0)
  {
    this.disengageTarget();
    return;
  }

  // if there is only 1 aggro remaining
  if (allAggros.length === 1)
  {
    // if there is no target, just stop that shit.
    if (!this.getTarget()) return;

    // grab the uuid of the first aggro in the list.
    const zerothAggroUuid = allAggros.at(0)
      .uuid();

    // check to see if the last aggro in the list belongs to the current target.
    if (!(this.getTarget()
      .getUuid() === zerothAggroUuid))
    {
      // if it doesn't, then get that battler.
      const newTarget = JABS_AiManager.getBattlerByUuid(zerothAggroUuid);
      if (newTarget)
      {
        // then switch to that target!
        this.setTarget(newTarget);
      }
      else
      {
        // if the battler doesn't exist but the aggro does, purge it.
        this.removeAggro(zerothAggroUuid);
      }
    }

    // stop processing.
    return;
  }

  // if you still don't have a target but have multiple aggros, then just give up.
  if (!this.getTarget()) return;

  // filtered aggros containing only aggros of enemies that are nearby.
  const filteredAggros = allAggros.filter(aggro =>
  {
    // the battler associated with the aggro.
    const potentialTarget = JABS_AiManager.getBattlerByUuid(aggro.uuid());

    // if the target is invalid somehow, then it is not a valid aggro.
    if (!potentialTarget) return false;

    // if the target is too far away, don't consider it.
    if (this.getPursuitRadius() < this.distanceToDesignatedTarget(potentialTarget)) return false;

    // this aggro target is fine!
    return true;
  });

  // all aggro'd targets are too far, don't adjust targets.
  if (filteredAggros.length === 0) return;

  // find the highest aggro target currently being tracked.
  const highestAggroTargetUuid = filteredAggros.at(0)
    .uuid();

  // grab the current target of this battler at the moment.
  const currentTargetUuid = this.getTarget()
    .getUuid();

  // if the current target isn't the highest target, then switch!
  if (highestAggroTargetUuid !== currentTargetUuid)
  {
    // find the new target to change to that has more aggro than the current target.
    const newTarget = JABS_AiManager.getBattlerByUuid(highestAggroTargetUuid);

    // if we can't find the target on the map somehow, then try to remove it from the list of aggros.
    if (!newTarget)
    {
      // get the index to remove...
      this.removeAggro(highestAggroTargetUuid);
    }
    else
    {
      // we found it, let's engage!
      this.engageTarget(newTarget);
    }
  }

  // the current target IS the highest aggro! Continue as-usual.
};

/**
 * Gets all aggros on this battler.
 * @returns {JABS_Aggro[]}
 */
JABS_Battler.prototype.getAllAggros = function()
{
  return this._aggros;
};

/**
 * Gets the highest aggro currently tracked by this battler.
 * If the top two highest aggros are the same, this will add +1 to one of them
 * and use that instead to prevent infinite looping.
 * @returns {JABS_Aggro}
 */
JABS_Battler.prototype.getHighestAggro = function()
{
  // grab the aggros pre-sorted.
  const sortedAggros = this.getAggrosSortedHighestToLowest();

  // validate we have aggros.
  if (sortedAggros.length === 0)
  {
    // no aggros means no highest.
    return null;
  }

  // check if we only have a single aggro tracked.
  if (sortedAggros.length === 1)
  {
    // return that one aggro.
    return sortedAggros.at(0);
  }

  // otherwise, grab the first and second highest aggros.
  const [ highestAggro, secondHighestAggro, ] = sortedAggros;

  // check if the top two aggros are the same.
  if (highestAggro.aggro === secondHighestAggro.aggro)
  {
    // modify the first one by 1 to actually be higher.
    highestAggro.modAggro(1, true);
  }

  // return the result.
  return highestAggro;
};

/**
 * Gets all the aggros for this battler, sorted from highest to lowest.
 * @returns {JABS_Aggro[]}
 */
JABS_Battler.prototype.getAggrosSortedHighestToLowest = function()
{
  // a sorting function for determining the highest aggro from a collection.
  const sorting = (a, b) =>
  {
    if (a.aggro < b.aggro)
    {
      return 1
    }
    else if (a.aggro > b.aggro)
    {
      return -1;
    }

    return 0;
  };

  // grab the aggros.
  const aggros = this.getAllAggros();

  // sort them by their aggro rating.
  aggros.sort(sorting);

  // return the sorted aggros.
  return aggros;
};

/**
 * If the target is invalid somehow, then stop tracking its aggro.
 * @param {string} uuid The uuid of the target to potentially invalidate aggro for.
 */
JABS_Battler.prototype.removeAggroIfInvalid = function(uuid)
{
  // check if any of the captured conditions are true.
  if (this.isAggroInvalid(uuid))
  {
    // remove the aggro from this battler's tracking.
    this.removeAggro(uuid);
  }
};

/**
 * Determines whether or not this battler's aggro against a given target is invalid.
 * @param {string} uuid The uuid of the target to potentially invalidate aggro for.
 * @returns {boolean} True if the aggro is invalid, false otherwise.
 */
JABS_Battler.prototype.isAggroInvalid = function(uuid)
{
  // grab the battler from tracking.
  const battler = JABS_AiManager.getBattlerByUuid(uuid);

  // if the battler doesn't exist, then the aggro is invalid.
  if (!battler) return true;

  // if the battler is actually dead, then the aggro is invalid.
  if (battler.isDead()) return true;

  // if the battler is too far from this battler, then the aggro is invalid.
  if (battler.outOfRange(this)) return true;

  // the aggro must be valid.
  return false;
};

/**
 * Removes a single aggro by its `uuid`.
 * @param {string} uuid The `uuid` of the aggro to remove.
 */
JABS_Battler.prototype.removeAggro = function(uuid)
{
  // get the index to remove...
  const indexToRemove = this._aggros.findIndex(aggro => aggro.uuid() === uuid);
  if (indexToRemove > -1)
  {
    // if currently engaged with the dead target, then disengage.
    if (this.getTarget()
      .getUuid() === uuid)
    {
      this.disengageTarget();
    }

    // ...and remove it.
    this._aggros.splice(indexToRemove, 1);
  }
};

/**
 * Adds a new aggro tracker to this battler, or updates an existing one.
 * @param {string} uuid The unique identifier of the target.
 * @param {number} aggroValue The amount of aggro being modified.
 * @param {boolean} forced If provided, then this application will bypass locks.
 */
JABS_Battler.prototype.addUpdateAggro = function(uuid, aggroValue, forced = false)
{
  // if the aggro is locked, don't adjust it.
  if (this.getBattler()
    .isAggroLocked() && !forced)
  {
    return;
  }

  const foundAggro = this.aggroExists(uuid);
  if (foundAggro)
  {
    foundAggro.modAggro(aggroValue, forced);
  }
  else
  {
    const newAggro = new JABS_Aggro(uuid);
    newAggro.setAggro(aggroValue, forced);
    this._aggros.push(newAggro);
  }
};

/**
 * Resets the aggro for a particular target.
 * @param {string} uuid The unique identifier of the target to reset.
 * @param {boolean} forced If provided, then this application will bypass locks.
 */
JABS_Battler.prototype.resetOneAggro = function(uuid, forced = false)
{
  // if the aggro is locked, don't adjust it.
  if (this.getBattler()
    .isAggroLocked() && !forced)
  {
    return;
  }

  const foundAggro = this.aggroExists(uuid);
  if (foundAggro)
  {
    foundAggro.resetAggro(forced);
  }
  else
  {
    // if the uuid provided is empty, then do nothing with it.
    if (!uuid) return;

    // otherwise, create a new aggro for this battler.
    this.addUpdateAggro(uuid, 0, forced);
  }
};

/**
 * Resets all aggro on this battler.
 * @param {string} uuid The unique identifier of the target resetting this battler's aggro.
 * @param {boolean} forced If provided, then this application will bypass locks.
 */
JABS_Battler.prototype.resetAllAggro = function(uuid, forced = false)
{
  // if the aggro is locked, don't adjust it.
  if (this.getBattler()
    .isAggroLocked() && !forced)
  {
    return;
  }

  // reset the aggro of the battler that triggered this reset to prevent pursuit.
  this.resetOneAggro(uuid, forced);

  // and reset all aggros this battler has.
  this._aggros.forEach(aggro => aggro.resetAggro(forced));
};

/**
 * Gets an aggro by its unique identifier.
 * If the aggro doesn't exist, then returns undefined.
 * @param {string} uuid The unique identifier of the target resetting this battler's aggro.
 * @returns {JABS_Aggro}
 */
JABS_Battler.prototype.aggroExists = function(uuid)
{
  return this._aggros.find(aggro => aggro.uuid() === uuid);
};
//endregion aggro