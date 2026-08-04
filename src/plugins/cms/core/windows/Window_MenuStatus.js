import MenuStatusCatalog from './../helpers/MenuStatusCatalog.js';

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

//region imagery
/**
 * Overwrites {@link #drawItemImage}.<br/>
 * Draws the actor's face and map sprite side by side at the top of their column.
 *
 * Two graphics rather than one because they answer different questions. The face is who this person
 * is in a conversation; the map sprite is who the player has actually been looking at for the last
 * several hours of play, and in an action game that is the stronger identification of the two.
 * Showing them together is what makes the cell read as a specific character rather than a data row.
 * @param {number} index The index of the party member being rendered.
 */
Window_MenuStatus.prototype.drawItemImage = function(index)
{
  // grab the member occupying this cell.
  const actor = this.actor(index);

  // grab the bounds of the cell.
  const rect = this.itemRect(index);

  // the face and the sprite are centered as a single unit rather than individually.
  const pairWidth = ImageManager.faceWidth + this.walkSpriteGap() + this.walkSpriteWidth();
  const pairX = rect.x + Math.floor((rect.width - pairWidth) / 2);

  // sit the face at the top of the cell.
  this.drawActorFace(actor, pairX, rect.y, ImageManager.faceWidth, ImageManager.faceHeight);

  // the sprite anchors bottom-center, so aim at the horizontal middle of its own share of the pair.
  const spriteCenterX = pairX + ImageManager.faceWidth + this.walkSpriteGap() + (this.walkSpriteWidth() / 2);

  // stand the sprite on the same baseline as the bottom of the face.
  this.drawActorWalkSprite(actor, Math.floor(spriteCenterX), rect.y + ImageManager.faceHeight);
};

/**
 * Draws an actor's map sprite in its neutral standing pose, facing the player.
 *
 * The engine's own {@link Window_Base.drawCharacter} selects exactly this frame, but blits it at
 * native size- and a 48 pixel sprite beside a 144 pixel portrait reads as an afterthought rather than
 * a companion. This exists solely to draw that same frame enlarged, so the pair carries equal weight.
 *
 * Nothing here requests the sheet in advance. The party's own map sprites are necessarily cached by
 * the time a menu can be opened at all, and the scene refreshes this window again on start, which is
 * the same safety net the face graphics beside them have always relied on.
 * @param {Game_Actor} actor The actor whose map sprite is being drawn.
 * @param {number} x The horizontal center of the drawn sprite.
 * @param {number} y The baseline the sprite stands on.
 */
Window_MenuStatus.prototype.drawActorWalkSprite = function(actor, x, y)
{
  // the sheet holding this actor's map graphic.
  const characterName = actor.characterName();
  const bitmap = ImageManager.loadCharacter(characterName);

  // a "$" sheet holds a single character in a 3x4 grid; an ordinary sheet holds eight in a 12x8 one.
  const isBig = ImageManager.isBigCharacter(characterName);
  const frameWidth = bitmap.width / (isBig ? 3 : 12);
  const frameHeight = bitmap.height / (isBig ? 4 : 8);

  // a big sheet's lone occupant always sits at position zero, whatever index the actor claims.
  const position = isBig ? 0 : actor.characterIndex();

  // the middle of the three walk frames, which is the neutral standing pose rather than a stride.
  const sourceX = ((position % 4) * 3 + 1) * frameWidth;

  // the first of the four direction rows, which is the one facing the player.
  const sourceY = Math.floor(position / 4) * 4 * frameHeight;

  // enlarge both axes off the frame's own measurements rather than off the width the layout
  // reserved. The two agree for any sheet built to the tile grid, but a sheet whose frames are not
  // square would be stretched by trusting the reservation, and a stretched sprite is worse than one
  // that overhangs the space set aside for it by a few pixels.
  const scale = this.walkSpriteScale();
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;

  // anchor bottom-center, matching the convention of the engine's own character drawing.
  const destinationX = x - Math.floor(drawWidth / 2);
  const destinationY = y - drawHeight;

  // the enlargement happens through the 2d canvas, which interpolates by default- and bilinear
  // smoothing is exactly wrong for pixel art, so the destination is switched to nearest-neighbor for
  // the duration of the blit and handed back afterward for everything else drawn into this window.
  const { context } = this.contents;
  context.imageSmoothingEnabled = false;

  // blit the single frame at its enlarged size.
  this.contents.blt(
    bitmap,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    destinationX,
    destinationY,
    drawWidth,
    drawHeight);

  // restore interpolation for whatever is drawn next.
  context.imageSmoothingEnabled = true;
};

/**
 * How much larger than native the map sprite is drawn.
 *
 * Whole numbers only- these are pixel art, and a fractional scale resamples them into mush.
 * @returns {number}
 */
Window_MenuStatus.prototype.walkSpriteScale = function()
{
  return 2;
};

/**
 * The horizontal space the drawn map sprite claims.
 *
 * Derived from the map's tile size rather than measured off the sheet, because the layout has to
 * know this width before the sheet has necessarily finished loading.
 * @returns {number}
 */
Window_MenuStatus.prototype.walkSpriteWidth = function()
{
  return $gameMap.tileWidth() * this.walkSpriteScale();
};

/**
 * Clear air between the face and the map sprite.
 * @returns {number}
 */
Window_MenuStatus.prototype.walkSpriteGap = function()
{
  return 16;
};

//endregion imagery

//region details
/**
 * Overwrites {@link #drawItemStatus}.<br/>
 * Draws a member's details beneath their portrait.
 *
 * Ordered by how often the answer is wanted rather than by how the data happens to be stored: who
 * this is, how they are holding up, how close the next level is, and what they are carrying into it.
 * @param {number} index The index of the party member being rendered.
 */
Window_MenuStatus.prototype.drawItemStatus = function(index)
{
  // grab the member occupying this cell.
  const actor = this.actor(index);

  // grab the bounds of the cell.
  const rect = this.itemRect(index);

  // inset the details slightly from the cell edges.
  const padding = this.itemPadding();
  const x = rect.x + padding;
  const width = rect.width - (padding * 2);

  // begin immediately beneath the portrait, and walk downward from there.
  const lineHeight = this.lineHeight();
  let y = rect.y + ImageManager.faceHeight + lineHeight;

  // who this is.
  this.drawActorName(actor, x, y, width);
  y += lineHeight;
  this.drawActorLevel(actor, x, y);
  y += lineHeight;
  this.drawActorClass(actor, x, y, width);
  y += lineHeight;

  // how they are holding up.
  this.placeBasicGauges(actor, x, y);
  y += this.basicGaugesHeight();

  // how close the next level is.
  this.drawExperience(actor, x, y, width);
  y += lineHeight + this.detailBlockGap();

  // what they are carrying into it.
  this.drawEquipment(actor, x, y, width);
};

/**
 * The vertical space the three basic gauges occupy.
 *
 * The gauges are sprites rather than drawn content, so the window cannot measure them after placing
 * them and has to reserve their space up front instead.
 * @returns {number}
 */
Window_MenuStatus.prototype.basicGaugesHeight = function()
{
  // two gaps between the three gauges, plus a full line for the last of them to occupy.
  return (this.gaugeLineHeight() * 2) + this.lineHeight();
};

/**
 * Clear air separating one block of details from the next.
 * @returns {number}
 */
Window_MenuStatus.prototype.detailBlockGap = function()
{
  return 12;
};

/**
 * Draws how much further this actor must earn to reach their next level.
 *
 * Phrased as the remaining distance rather than a position along a curve, because that is the form
 * the question actually takes- nobody opens a menu wondering what their cumulative experience total
 * is. The label mirrors the level row above it so that the two read as a pair.
 * @param {Game_Actor} actor The actor whose progress is being drawn.
 * @param {number} x The left edge of the row.
 * @param {number} y The top of the row.
 * @param {number} width The width available to the row.
 */
Window_MenuStatus.prototype.drawExperience = function(actor, x, y, width)
{
  // the readout itself, which the catalog decides and this window merely places.
  const label = MenuStatusCatalog.experienceLabel(actor);

  // lead with the system-colored abbreviation, matching how the level row above is drawn.
  this.changeTextColor(ColorManager.systemColor());
  this.drawText(TextManager.expA, x, y, width);

  // trail with the value in the ordinary text color, right-aligned against the far edge.
  this.resetTextColor();
  this.drawText(label, x, y, width, 'right');
};

/**
 * Draws everything this actor is wearing, one slot per line.
 * @param {Game_Actor} actor The actor whose loadout is being drawn.
 * @param {number} x The left edge of the block.
 * @param {number} y The top of the block.
 * @param {number} width The width available to each row.
 */
Window_MenuStatus.prototype.drawEquipment = function(actor, x, y, width)
{
  // what this actor is wearing, including whichever slots they have left empty.
  const rows = MenuStatusCatalog.equipmentRows(actor);

  // stack the rows beneath one another.
  rows.forEach((row, index) =>
  {
    // the line this particular row occupies.
    const rowY = y + (this.lineHeight() * index);

    this.drawEquipmentRow(row, x, rowY, width);
  });
};

/**
 * Draws a single equipment slot.
 *
 * A filled slot needs no label- the item's own icon and name identify it more precisely than the slot
 * name ever could. An empty one has neither, so it borrows the name of the slot it stands for and is
 * drawn dimmed, which is what keeps a run of empty slots reading as absences rather than as more gear.
 * @param {{item: RPG_EquipItem, slotName: string, isEquipped: boolean}} row The row to draw.
 * @param {number} x The left edge of the row.
 * @param {number} y The top of the row.
 * @param {number} width The width available to the row.
 */
Window_MenuStatus.prototype.drawEquipmentRow = function(row, x, y, width)
{
  // a filled slot draws as the item it holds.
  if (row.isEquipped)
  {
    this.drawItemName(row.item, x, y, width);

    return;
  }

  // indent to where an item name would have begun, so the column of text stays aligned whether or
  // not the slot beside it happens to be filled.
  const textMargin = ImageManager.standardIconWidth + 4;
  const textX = x + textMargin;
  const textWidth = Math.max(0, width - textMargin);

  // dim the row so that an absence never competes with the gear around it for attention.
  this.changePaintOpacity(false);
  this.drawText(`${row.slotName} - ${MenuStatusCatalog.EMPTY_SLOT_TEXT}`, textX, y, textWidth);
  this.changePaintOpacity(true);
};

//endregion details