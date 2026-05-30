//region Game_Character
/**
 * The set of move route command codes that should be repeated per subcell when in pixel mode.
 * These correspond to the "Move X" commands in RPG Maker's event move route.
 * @type {number[]}
 */
Game_Character.pixelRepeatableMoveCommandCodes = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];

/**
 * Extends {@link processMoveCommand}.<br/>
 * Ensures when move routes are being processed, that we adjust the x,y coordinates.
 * @param {RPG_EventListCommand} command The commands associated with this movement.
 */
J.PIXEL.Aliased.Game_Character.set('processMoveCommand', Game_Character.prototype.processMoveCommand);
Game_Character.prototype.processMoveCommand = function(command)
{
  // move route commands are never triggered by held player input.
  this.setMovePressed(false);

  // perform the original logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_Character.get('processMoveCommand')
    .call(this, command);
};

/**
 * Overwrites {@link #searchLimit}.<br/>
 * Uses a different value to have a broader search distance.
 * @returns {number}
 */
Game_Character.prototype.searchLimit = function()
{
  return 40;
};

/**
 * Extends {@link #updateRoutineMove}.<br/>
 * Repeats move-route movement commands by the collision step count so that
 * scripted movement (event pages, move routes) covers the intended full-tile distance.
 * JABS actions are excluded and use default logic unchanged.
 */
J.PIXEL.Aliased.Game_Character.set('updateRoutineMove', Game_Character.prototype.updateRoutineMove);
Game_Character.prototype.updateRoutineMove = function()
{
  // JABS actions are not events with move routes; use default behavior for them.
  if (J.ABS && this.isJabsAction())
  {
    // perform original logic for action entities.
    J.PIXEL.Aliased.Game_Character.get('updateRoutineMove')
      .call(this);

    // stop processing.
    return;
  }

  // perform the pixel-aware route movement update.
  this.handlePixelRoutineMove();
};

/**
 * Handles updating event move routes with pixel-aware repetition.
 * Repeats each movement command by the collision step count before advancing
 * to the next command in the route, so scripted movement covers the full tile.
 */
Game_Character.prototype.handlePixelRoutineMove = function()
{
  // check if we are waiting in the move route.
  if (this._waitCount > 0)
  {
    // decrement wait count and stop processing.
    this._waitCount--;

    // stop processing while waiting.
    return;
  }

  // movement is always considered successful under a commanded route.
  this.setMovementSuccess(true);

  // extract the current move route command.
  const command = this._moveRoute.list[this._moveRouteIndex];

  // nothing to do if no command is present at this index.
  if (command === undefined) return;

  // start a fresh repeat cycle if this command supports repetition.
  if (this.canStartPixelRepeatMove(command))
  {
    // begin the repeat cycle.
    this.beginRepeatMove();

    // initialize the repeat counter.
    this.setRepeatMoveCount(this.pixelRepeatCountForRoute());
  }

  // process the move command.
  this.processMoveCommand(command);

  // decrement the repeat count if a repeat is active.
  if (this.isRepeatMoveActive())
  {
    // count down one tick.
    this.decrementRepeatMoveCount();

    // if the repeat counter reached zero, end the repeat cycle.
    if (this.getRepeatMoveCount() === 0)
    {
      // stop repeating this command.
      this.stopRepeatMove();
    }
  }

  // advance to the next command only when the repeat cycle has ended.
  if (this.isRepeatMoveActive() === false)
  {
    // move to the next command in the route.
    this.advanceMoveRouteIndex();
  }
};

/**
 * Determines whether a repeat cycle should be started for the given command.
 * @param {RPG_EventListCommand} command The current move route command.
 * @returns {boolean} True if a new repeat cycle should begin.
 */
Game_Character.prototype.canStartPixelRepeatMove = function(command)
{
  // do not start a new repeat if one is already active.
  if (this.isRepeatMoveActive()) return false;

  // only repeat commands that are movement codes.
  if (Game_Character.pixelRepeatableMoveCommandCodes.includes(command.code) === false) return false;

  // all checks passed; start repeating.
  return true;
};
//endregion Game_Character