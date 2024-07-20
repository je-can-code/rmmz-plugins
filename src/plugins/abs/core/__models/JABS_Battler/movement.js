//region movement
/**
 * Gets whether or not this battler's movement is locked.
 * @returns {boolean} True if the battler's movement is locked, false otherwise.
 */
JABS_Battler.prototype.isMovementLocked = function()
{
  return this._movementLock;
};

/**
 * Sets the battler's movement lock.
 * @param {boolean} locked Whether or not the battler's movement is locked (default = true).
 */
JABS_Battler.prototype.setMovementLock = function(locked = true)
{
  this._movementLock = locked;
};

/**
 * Whether or not the battler is able to move.
 * A variety of things can impact the ability for a battler to move.
 * @returns {boolean} True if the battler can move, false otherwise.
 */
JABS_Battler.prototype.canBattlerMove = function()
{
  // battlers cannot move if they are movement locked by choice (rotating/guarding/etc).
  if (this.isMovementLocked()) return false;

  // battlers cannot move if they are movement locked by state.
  if (this.isMovementLockedByState()) return false;

  // battler can move!
  return true;
};

/**
 * Checks all states to see if any are movement-locking.
 * @returns {boolean} True if there is at least one locking movement, false otherwise.
 */
JABS_Battler.prototype.isMovementLockedByState = function()
{
  // grab the states to check for movement-blocking effects.
  const states = this.getBattler()
    .states();

  // if we have no states,
  if (!states.length) return false;

  // check all our states to see if any are blocking movement.
  const lockedByState = states.some(state => (state.jabsRooted || state.jabsParalyzed));

  // return what we found.
  return lockedByState;
};
//endregion movement