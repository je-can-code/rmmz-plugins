/**
 * Overwrites {@link #maxCols}.<br/>
 * Renders one column per party member rather than one row.
 *
 * The party is a permanently fixed pair, so the center of the menu can afford to show every member at
 * once side by side. Six stacked rows was the correct shape for a variable-size party filling a narrow
 * strip; it wastes most of a wide center column and answers nothing the player was asking.
 * @returns {number}
 */
Window_MenuStatus.prototype.maxCols = function()
{
  return Math.max(1, $gameParty.size());
};

/**
 * Overwrites {@link #numVisibleRows}.<br/>
 * Every member is visible at once, so there is only ever one row of them.
 * @returns {number}
 */
Window_MenuStatus.prototype.numVisibleRows = function()
{
  return 1;
};

/**
 * Overwrites {@link #itemHeight}.<br/>
 * Each member's cell claims the full height of the window.
 * @returns {number}
 */
Window_MenuStatus.prototype.itemHeight = function()
{
  return this.innerHeight;
};

/**
 * Overwrites {@link #drawItemImage}.<br/>
 * Draws the actor's face at the top of their column.
 *
 * This is the only place in the game a full-size portrait appears. Concentrating it here is what
 * permits every other actor-scoped scene to carry a compact ribbon instead of re-rendering the same
 * artwork in a layout that has better uses for the space.
 * @param {number} index The index of the party member being rendered.
 */
Window_MenuStatus.prototype.drawItemImage = function(index)
{
  // grab the member occupying this cell.
  const actor = this.actor(index);

  // grab the bounds of the cell.
  const rect = this.itemRect(index);

  // center the face horizontally within the cell.
  const faceX = rect.x + Math.floor((rect.width - ImageManager.faceWidth) / 2);

  // sit the face at the top of the cell.
  this.drawActorFace(actor, faceX, rect.y, ImageManager.faceWidth, ImageManager.faceHeight);
};

/**
 * Overwrites {@link #drawItemStatus}.<br/>
 * Draws a member's details beneath their portrait.
 *
 * Deliberately sparse for now- name, level, class, and the basic gauges. What else belongs here is a
 * question better answered against a working skeleton than guessed at in advance.
 * @param {number} index The index of the party member being rendered.
 */
Window_MenuStatus.prototype.drawItemStatus = function(index)
{
  // grab the member occupying this cell.
  const actor = this.actor(index);

  // grab the bounds of the cell.
  const rect = this.itemRect(index);

  // begin immediately beneath the portrait.
  const y = rect.y + ImageManager.faceHeight + this.lineHeight();

  // inset the details slightly from the cell edges.
  const padding = this.itemPadding();
  const x = rect.x + padding;
  const width = rect.width - (padding * 2);

  // render the details, one line apiece.
  this.drawActorName(actor, x, y, width);
  this.drawActorLevel(actor, x, y + this.lineHeight());
  this.drawActorClass(actor, x, y + (this.lineHeight() * 2), width);

  // place the gauges below the text.
  this.placeBasicGauges(actor, x, y + (this.lineHeight() * 3));
};
