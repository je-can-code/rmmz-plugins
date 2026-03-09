//region JABS_State
/**
 * Extends {@link #removeFromBattler}.<br/>
 * Also removes the shield when the state expires.
 */
J.ABS.EXT.SHIELD.Aliased.JABS_State.set('removeFromBattler', JABS_State.prototype.removeFromBattler);
JABS_State.prototype.removeFromBattler = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.JABS_State.get('removeFromBattler')
    .call(this);

  // also remove the shield.
  this.removeShield();
};

/**
 * An event hook fired when a shield is broken.
 */
JABS_State.prototype.onShieldBreak = function()
{
  // trigger the battler's shield break hook.
  this.battler.onShieldBreak();

  // force a decrement of stacks.
  this.decrementStacks(1);

  // check if we ran out of stacks.
  if (this.stackCount === 0)
  {
    // remove the state.
    this.removeFromBattler();

    // no more processing.
    return;
  }

  // we still have stacks, so refresh the shield.
  this.refreshShield();
};

/**
 * Zeroes out the shield for this state.
 * This does not count as "breaking" the shield.
 */
JABS_State.prototype.removeShield = function()
{
  // validate we have a shield to remove.
  if (this.shield === null || this.shield === undefined) return;

  // zero out the shield.
  this.shield.setCurrent(0);
};

/**
 * Recalculates the shield based on the current state of the battler.
 */
JABS_State.prototype.recalculateShield = function()
{
  // recalculates the shield based on the current state.
  const updatedShield = JABS_Shield.fromStateId(this.stateId, this.battler, this.source);

  // validate we have a shield to update.
  if (updatedShield === null || updatedShield === undefined) return;

  // update the updated shield with the current shield's current value.
  updatedShield.setCurrent(this.shield?.getCurrent() ?? 0);

  // updates the shield.
  this.shield = updatedShield;
};

/**
 * Refreshes the shield back to its original amount.
 */
JABS_State.prototype.refreshShield = function()
{
  // check if we can refresh the shield.
  if (this.canRefreshShield() === false) return;

  // pass-through to refresh the shield back to its original amount.
  this.shield.refresh();
};

/**
 * Determines whether or not this state can refresh its shield.
 * @returns {boolean} True if the shield can be refreshed, false otherwise.
 */
JABS_State.prototype.canRefreshShield = function()
{
  // if we don't have a shield, obviously don't try to refresh it.
  if (this.shield === null || this.shield === undefined) return false;

  // refresh that shield!
  return true;
};
//endregion JABS_State