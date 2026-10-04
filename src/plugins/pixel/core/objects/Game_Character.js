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
 * Overwrites {@link Game_Character#findDirectionTo}.<br/>
 * Searches between the tiles both ends actually stand on, through J-Base's {@link TilePathSearch}.
 *
 * The engine's search starts from the character's own coordinates and treats them as a tile, which
 * only holds while coordinates are whole numbers. Under pixel movement they rarely are, and a search
 * starting from 30.6 explores 30.6, 31.6, 32.6 and onward, so it can never arrive at a whole-numbered
 * goal. Every search then runs to its limit - with forty steps, the whole neighborhood - and settles
 * for whichever point it explored came closest. Rounding both ends onto the grid lets it arrive.
 *
 * Everything else is the engine's own: standing exactly on the goal answers nothing, the four
 * directions are tried in its order, and when no step gets any closer - which includes both ends
 * sharing a tile - it heads straight for the goal along whichever axis is farther off.
 *
 * Two things keep it cheap. A search that has just failed from the same tile toward the same goal is
 * answered from {@link PathSearchMemory} rather than asked again, and a search that does run looks
 * events up by tile through {@link Game_Map#searchWithEventIndex} instead of walking all of them at
 * every step it considers.
 * @param {number} goalX The x coordinate to reach.
 * @param {number} goalY The y coordinate to reach.
 * @returns {number} The direction to step in, or 0 when there is nowhere to go.
 */
Game_Character.prototype.findDirectionTo = function(goalX, goalY)
{
  // standing exactly on the goal, there is nowhere to go. The fallback below would say so too, after
  // a search; this only spares the search.
  if (this.x === goalX && this.y === goalY) return 0;

  // search the grid between the tiles both ends stand on.
  const startX = Math.round(this.x);
  const startY = Math.round(this.y);
  const request = {
    startX,
    startY,
    goalX: Math.round(goalX),
    goalY: Math.round(goalY),
    searchLimit: this.searchLimit(),
    mapWidth: $gameMap.width(),
    directions: [ 2, 4, 6, 8 ],
    stepFrom: (x, y, direction) => ({
      x: $gameMap.roundXWithDirection(x, direction),
      y: $gameMap.roundYWithDirection(y, direction),
    }),
    canStep: (x, y, direction) => this.canPass(x, y, direction),
    distance: (x1, y1, x2, y2) => $gameMap.distance(x1, y1, x2, y2),
  };

  // a search that just failed from this tile toward this goal is not asked again for a moment, and one
  // that runs looks events up by tile instead of walking all of them at every step.
  const { x: stepX, y: stepY } = PathSearchMemory.firstStep(
    this,
    'straight',
    Graphics.frameCount,
    request,
    search => $gameMap.searchWithEventIndex(() => TilePathSearch.firstStep(search)));

  // the direction of the first step, in the engine's order of preference.
  const deltaX = $gameMap.deltaX(stepX, startX);
  const deltaY = $gameMap.deltaY(stepY, startY);
  if (deltaY > 0) return 2;
  if (deltaX < 0) return 4;
  if (deltaX > 0) return 6;
  if (deltaY < 0) return 8;

  // no step gets any closer, so head straight for the goal along whichever axis is farther off.
  const deltaToGoalX = this.deltaXFrom(goalX);
  const deltaToGoalY = this.deltaYFrom(goalY);
  if (Math.abs(deltaToGoalX) > Math.abs(deltaToGoalY))
  {
    return deltaToGoalX > 0 ? 4 : 6;
  }

  // the vertical half, which on a looping map can measure nothing even off the goal.
  if (deltaToGoalY !== 0)
  {
    return deltaToGoalY > 0 ? 8 : 2;
  }

  return 0;
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
  if (this.waitCount() > 0)
  {
    // decrement wait count and stop processing.
    this.setWaitCount(this.waitCount() - 1);

    // stop processing while waiting.
    return;
  }

  // movement is always considered successful under a commanded route.
  this.setMovementSuccess(true);

  // extract the current move route command.
  const command = this.moveRoute().list[this.moveRouteIndex()];

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

/**
 * Overwrites {@link Game_Character.moveRandom}.<br/>
 * Vanilla rolls a brand-new random cardinal direction on every single call. Under pixel
 * movement, {@link Game_Character#handlePixelRoutineMove} repeats a "Move Random" route
 * command every frame to cover a full tile's worth of sub-pixel distance, so the vanilla
 * version re-rolls dozens of times before a tile is crossed - visibly twitching in place
 * instead of travelling. This caches the rolled direction using the same micro-route hold
 * primitives ({@link Game_CharacterBase#setMicroRouteDirection} etc.) already used by JABS'
 * AI idle-wander/retreat logic, and reuses it for one full tile's worth of frames.
 */
Game_Character.prototype.moveRandom = function()
{
  // reuse a still-active cached direction rather than rolling a new one every frame.
  if (this.isMicroRouting())
  {
    // step in the cached direction; moveStraight re-validates passability every frame,
    // so a direction that becomes blocked mid-hold simply stops the character in place.
    this.moveStraight(this.getMicroRouteDirection());

    // count down the remaining frames this cached direction should be held for.
    this.decrementMicroRouteFrames();

    // stop here; do not roll a new direction while the cache is still active.
    return;
  }

  // roll a fresh random cardinal direction, matching vanilla's own algorithm.
  const direction = 2 + (Math.floor(Math.random() * 4) * 2);

  // cache it for one full tile's worth of frames so the repeat cycle above keeps
  // moving the same way instead of re-rolling and twitching in place.
  this.setMicroRouteDirection(direction);
  this.setMicroRouteFrames(this.pixelRepeatCountForRoute());

  // take the first step immediately in the newly-rolled direction.
  this.moveStraight(direction);
};
//endregion Game_Character