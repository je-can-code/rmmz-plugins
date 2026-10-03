//region Game_Interpreter
/**
 * Extends {@link Game_Interpreter#command201}.<br/>
 * A Transfer Player run from an area that remembers where the player crossed first hands the player how
 * far along that area they stand, so the landing can be moved just as far along once the destination has
 * loaded. The destination's size is not known until then, which is why the offset travels with the
 * player rather than being added to the coordinates here. Every other transfer passes straight through.
 *
 * This wraps whichever Transfer Player is already in place, including the one J-ABS swaps in while it
 * is enabled, which is why this plugin loads after J-ABS.
 * @param {any[]} params The Transfer Player command's parameters.
 * @returns {boolean} True once the transfer is reserved, false while it waits on a message to close.
 */
J.PIXEL.Aliased.Game_Interpreter.set('command201', Game_Interpreter.prototype.command201);
Game_Interpreter.prototype.command201 = function(params)
{
  // an area that remembers where the player crossed hands that position over first.
  if (this.isRelativeTransfer())
  {
    this.handOverRelativeTransferOffset();
  }

  // perform original logic.
  return J.PIXEL.Aliased.Game_Interpreter.get('command201')
    .call(this, params);
};

/**
 * Determines whether the transfer this interpreter is running comes from an area whose page remembers
 * where the player crossed it.
 * @returns {boolean} True if the transfer should land relative to the player's position.
 */
Game_Interpreter.prototype.isRelativeTransfer = function()
{
  // a common event running on its own belongs to no map event, so there is no area to measure.
  if (this.eventId() === 0) return false;

  // once a transfer has already carried this interpreter off its event's map, that area is gone too.
  if (this.isOnCurrentMap() === false) return false;

  // otherwise the event's active page decides.
  const areaEvent = $gameMap.event(this.eventId());
  return areaEvent.isRelativeTransfer();
};

/**
 * Hands the player how far along this interpreter's area they stand, for the landing to be moved by once
 * the destination has loaded.
 */
Game_Interpreter.prototype.handOverRelativeTransferOffset = function()
{
  // the area this transfer belongs to measures where along it the player stands.
  const areaEvent = $gameMap.event(this.eventId());
  const column = areaEvent.areaColumnOf($gamePlayer);
  const row = areaEvent.areaRowOf($gamePlayer);

  // the player carries the offset across until the destination is known.
  $gamePlayer.setTransferOffsetX(column);
  $gamePlayer.setTransferOffsetY(row);
};
//endregion Game_Interpreter