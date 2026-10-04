//region Game_Event
//region init
/**
 * Extends {@link Game_Event.initMembers}.<br/>
 * Also seeds the area this event covers, which starts as its own tile and nothing more.
 */
J.PIXEL.Aliased.Game_Event.set('initMembers', Game_Event.prototype.initMembers);
Game_Event.prototype.initMembers = function()
{
  // perform original logic.
  J.PIXEL.Aliased.Game_Event.get('initMembers')
    .call(this);

  // initialize the area members.
  this.initAreaEventMembers();
};

/**
 * Initializes the members describing the area this event's active page covers.<br/>
 * None of it is ever saved: everything on an event's `_j` is map-session state, rebuilt with the event
 * at the next map setup, and every page re-reads its own area when it becomes active anyway.
 */
Game_Event.prototype.initAreaEventMembers = function()
{
  /**
   * How many tiles wide the area this event's active page covers, counted rightward from the tile
   * the event stands on.
   * @type {number}
   */
  this._j._pixel._areaEventWidth = 1;

  /**
   * How many tiles high the area this event's active page covers, counted downward from the tile the
   * event stands on.
   * @type {number}
   */
  this._j._pixel._areaEventHeight = 1;

  /**
   * Whether a transfer from this event's active page lands as far along its destination as the player
   * stood along the page's area.
   * @type {boolean}
   */
  this._j._pixel._relativeTransfer = false;
};
//endregion init

//region properties
/**
 * Gets how many tiles wide the area this event's active page covers.
 * @returns {number} The width, in tiles.
 */
Game_Event.prototype.areaEventWidth = function()
{
  // hand back the area's width.
  return this._j._pixel._areaEventWidth;
};

/**
 * Sets how many tiles wide the area this event's active page covers.
 * @param {number} areaEventWidth The width, in tiles.
 */
Game_Event.prototype.setAreaEventWidth = function(areaEventWidth)
{
  // assign the area's width.
  this._j._pixel._areaEventWidth = areaEventWidth;
};

/**
 * Gets how many tiles high the area this event's active page covers.
 * @returns {number} The height, in tiles.
 */
Game_Event.prototype.areaEventHeight = function()
{
  // hand back the area's height.
  return this._j._pixel._areaEventHeight;
};

/**
 * Sets how many tiles high the area this event's active page covers.
 * @param {number} areaEventHeight The height, in tiles.
 */
Game_Event.prototype.setAreaEventHeight = function(areaEventHeight)
{
  // assign the area's height.
  this._j._pixel._areaEventHeight = areaEventHeight;
};

/**
 * Gets whether a transfer from this event's active page lands relative to where the player crossed
 * its area.
 * @returns {boolean} True if the transfer's landing moves with the player's position.
 */
Game_Event.prototype.isRelativeTransfer = function()
{
  // hand back whether transfers from this page are relative.
  return this._j._pixel._relativeTransfer;
};

/**
 * Sets whether a transfer from this event's active page lands relative to where the player crossed
 * its area.
 * @param {boolean} isRelativeTransfer Whether the transfer's landing moves with the player's position.
 */
Game_Event.prototype.setRelativeTransfer = function(isRelativeTransfer)
{
  // assign whether transfers from this page are relative.
  this._j._pixel._relativeTransfer = isRelativeTransfer;
};
//endregion properties

/**
 * Extends {@link Game_Event.setupPage}.<br/>
 * Also reads the area the newly active page covers. An area belongs to a page rather than to the event,
 * so an exit that only opens once a switch flips can widen with the page that opens it.
 */
J.PIXEL.Aliased.Game_Event.set('setupPage', Game_Event.prototype.setupPage);
Game_Event.prototype.setupPage = function()
{
  // perform original logic.
  J.PIXEL.Aliased.Game_Event.get('setupPage')
    .call(this);

  // a new page can cover a different area, or none at all.
  this.refreshAreaEvent();
};

/**
 * Reads the area this event's active page covers, and whether a transfer from it remembers where the
 * player crossed. A page that declares no area covers the tile the event stands on and nothing else,
 * which is exactly what every event does when nothing says otherwise.
 *
 * Every comment line on the page is read, wherever it sits, the same as every other tag J-Base offers a
 * plugin. Should a page somehow declare its area twice, the last one written is the one that counts.
 */
Game_Event.prototype.refreshAreaEvent = function()
{
  // one view of the page's comments serves both tags.
  const commentNote = this.commentNote();

  // the page's area, or the event's own tile when it declares none.
  const declaredArea = RPGManager.getArrayFromNotesByRegex(commentNote, J.PIXEL.RegExp.AreaEvent, true);
  const [ width, height ] = declaredArea ?? [ 1, 1 ];
  this.setAreaEventWidth(width);
  this.setAreaEventHeight(height);

  // whether a transfer from this page lands relative to where the player crossed.
  const isRelativeTransfer = RPGManager.checkForBooleanFromNoteByRegex(commentNote, J.PIXEL.RegExp.RelativeTransfer);
  this.setRelativeTransfer(isRelativeTransfer);
};

/**
 * Overwrites {@link Game_CharacterBase#pos}.<br/>
 * An event stands on every tile of the area its active page covers: a rectangle of
 * {@link Game_Event#areaEventWidth} by {@link Game_Event#areaEventHeight} tiles whose top-left corner is
 * the tile its body occupies. Without an area that rectangle is the one occupied tile, which is exactly
 * the rule every other character answers with.
 *
 * Every question the engine asks about where an event is comes through here- the triggers in
 * {@link Game_Player#startMapEvent}, the collision checks pathfinding makes, Get Location Info- so they
 * all see the same area at once, and none of them has to know that areas exist. The area only ever
 * changes where an event counts as standing, never its body: pixel movement blocks against hitboxes,
 * which never ask this.
 * @param {number} x The x tile coordinate to compare against (expected to be an integer).
 * @param {number} y The y tile coordinate to compare against (expected to be an integer).
 * @returns {boolean} True if the tile lies inside this event's area.
 */
Game_Event.prototype.pos = function(x, y)
{
  const { left, top, width, height } = this.areaBounds();

  // the area runs rightward and downward from its corner.
  const isWithinColumns = x >= left && x < left + width;
  const isWithinRows = y >= top && y < top + height;

  // the event stands on the tile when the tile lies inside both.
  return isWithinColumns && isWithinRows;
};

/**
 * Gets the rectangle of tiles this event stands on: its active page's area, with the tile its body
 * occupies as the top-left corner.<br/>
 * The one statement of that rule. {@link Game_Event#pos} answers from it a tile at a time, and the
 * lookup a path search builds answers from it for every tile at once, so the two cannot drift apart.
 * @returns {{left: number, top: number, width: number, height: number}} The area, in tiles.
 */
Game_Event.prototype.areaBounds = function()
{
  return {
    left: this.occupiedTileX(),
    top: this.occupiedTileY(),
    width: this.areaEventWidth(),
    height: this.areaEventHeight(),
  };
};

/**
 * Measures how far across this event's area a character stands, in whole tiles from its left edge.<br/>
 * A character outside the area is measured from whichever edge is nearest, so the answer is always a
 * column the area actually has- which is also what makes a character facing the area from beside it
 * count as standing at its end.
 * @param {Game_Character} character The character to measure.
 * @returns {number} The column, from 0 up to one less than the area's width.
 */
Game_Event.prototype.areaColumnOf = function(character)
{
  // how many tiles to the right of this event's own column the character stands.
  const column = character.occupiedTileX() - this.occupiedTileX();

  // a character beyond either side is measured from the nearest edge.
  return column.clamp(0, this.areaEventWidth() - 1);
};

/**
 * Measures how far down this event's area a character stands, in whole tiles from its top edge.<br/>
 * See {@link Game_Event#areaColumnOf}, which this mirrors for the other axis.
 * @param {Game_Character} character The character to measure.
 * @returns {number} The row, from 0 up to one less than the area's height.
 */
Game_Event.prototype.areaRowOf = function(character)
{
  // how many tiles below this event's own row the character stands.
  const row = character.occupiedTileY() - this.occupiedTileY();

  // a character beyond either end is measured from the nearest edge.
  return row.clamp(0, this.areaEventHeight() - 1);
};

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