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

//endregion Game_Event