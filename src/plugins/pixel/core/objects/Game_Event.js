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
 * Overrides {@link Game_CharacterBase.getCollisionPivotY}.<br>
 * Anchors NPC and enemy event collision near their feet for natural depth feel.
 * JABS action events (projectiles) are flagged as through and bypass tile collision
 * entirely, so this override does not affect them.
 * @returns {number} The Y pivot offset in tile units.
 */
Game_Event.prototype.getCollisionPivotY = function()
{
  return 0.70;
};

//endregion Game_Event