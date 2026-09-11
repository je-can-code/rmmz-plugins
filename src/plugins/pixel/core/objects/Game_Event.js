//region Game_Event
/**
 * Determines whether or not one this event is collided with other events given the point.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @returns {boolean}
 */
Game_Event.prototype.isCollidedWithEvents = function(x, y)
{
  // Gather events at the target tile without through consideration.
  const events = $gameMap.eventsXyNt(x, y);

  // Filter out this event, erased events, and those set to through.
  const colliders = events.filter(ev =>
  {
    // Exclude self.
    if (ev === this) return false;

    // Exclude erased events.
    if (ev.isErased()) return false;

    // Exclude through events.
    if (ev.isThrough()) return false;

    // Include otherwise.
    return true;
  });

  // Determine if any valid colliders remain.
  return colliders.length > 0;
};

/**
 * Overwrites {@link Game_CharacterBase.getCollisionPivotY}.<br/>
 * Anchors NPC and enemy event collision near their feet for natural depth feel.
 * JABS action events (projectiles) are flagged as through and bypass tile collision
 * entirely, so this override does not affect them.
 * @returns {number} The Y pivot offset in tile units.
 */
Game_Event.prototype.getCollisionPivotY = function()
{
  return 0.70;
};

/**
 * Overwrites {@link Game_CharacterBase.checkEventTriggerTouchFront}.<br/>
 * Vanilla computes the front tile from this event's raw `_x`/`_y`, which are fractional under
 * pixel movement — the downstream `$gamePlayer.pos(x2, y2)` integer-tile comparison could never
 * match. Derives the front tile from this event's occupied tile instead, so an Event Touch (NPC
 * bumps into the player) trigger fires correctly regardless of where mid-step this event is.
 * @param {number} d The direction this event is moving.
 */
Game_Event.prototype.checkEventTriggerTouchFront = function(d)
{
  const x2 = $gameMap.roundXWithDirection(this.occupiedTileX(), d);
  const y2 = $gameMap.roundYWithDirection(this.occupiedTileY(), d);

  this.checkEventTriggerTouch(x2, y2);
};

/**
 * Extends {@link Game_Event.stopCountThreshold}.<br/>
 * Vanilla pauses a page-level custom move route between commands by making the event wait out
 * the frequency threshold each time it comes to a stop, on the assumption that a stop means a
 * command has finished. Under pixel movement a single "Move X" command is repeated once per pixel
 * step to cover the tile ({@link Game_Character#handlePixelRoutineMove}), and every one of those
 * steps ends in a stop, so the pause was landing sixteen times per tile instead of once. While a
 * repeat cycle is active the command is still in progress, so the threshold is zero; once the
 * cycle ends the frequency pause applies exactly as the editor implies, between commands.
 * @returns {number}
 */
J.PIXEL.Aliased.Game_Event.set('stopCountThreshold', Game_Event.prototype.stopCountThreshold);
Game_Event.prototype.stopCountThreshold = function()
{
  // a route command mid-repeat has not finished, so no pause belongs here.
  if (this.isRepeatMoveActive())
  {
    return 0;
  }

  // perform original logic.
  return J.PIXEL.Aliased.Game_Event.get('stopCountThreshold')
    .call(this);
};

//endregion Game_Event