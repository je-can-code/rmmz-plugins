//region Game_Map
//region properties
/**
 * Gets the raw event collection, nulls and all.
 *
 * This is deliberately not {@link Game_Map#events}, which filters the nulls out. A null is an
 * empty slot awaiting reuse, so any code adding or removing events by index needs to see them.
 * @returns {(Game_Event|null)[]} The raw, index-stable event collection.
 */
Game_Map.prototype.rawEvents = function()
{
  // hand back the collection with its empty slots intact.
  return this._events;
};

/**
 * Places an event into a specific slot of the event collection.
 * @param {number} index The slot to place the event into.
 * @param {Game_Event} newEvent The event being placed.
 */
Game_Map.prototype.setEventByIndex = function(index, newEvent)
{
  // drop the event into its slot.
  this._events[index] = newEvent;
};

/**
 * Empties a specific slot of the event collection, leaving it free for reuse.
 * @param {number} index The slot to empty.
 */
Game_Map.prototype.clearEventByIndex = function(index)
{
  // a null marks the slot as available rather than removing it, which would shift every index after it.
  this._events[index] = null;
};
//endregion properties

/**
 * Gets the note for the current map.
 * @returns {string|String.empty}
 */
Game_Map.prototype.note = function()
{
  if (!$dataMap)
  {
    console.warn(`attempted to get the note for a map that isn't available.`, this, $dataMap);
    return String.empty;
  }

  return $dataMap.note;
};
//endregion Game_Map