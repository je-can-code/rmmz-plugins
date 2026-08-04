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

/**
 * Overwrites {@link Window_Selectable.drawItemBackground}.<br/>
 * Draws no backing behind a member's cell.
 *
 * The tinted rectangle behind a row exists to show which row the cursor is on. Nothing selects a
 * party member here- the two command columns own the cursor and this window is read-only- so the
 * tint marks nothing, and reads as a panel the player ought to be able to interact with. The engine
 * does the same for its own read-only {@link Window_StatusParams}.
 * @param {number} _index The index of the party member whose cell would have been backed.
 */
// eslint-disable-next-line no-unused-vars
Window_MenuStatus.prototype.drawItemBackground = function(_index)
{
};

//region header
/**
 * Overwrites {@link #drawItemImage}.<br/>
 * Draws the actor's name across the top, then their face and map sprite beneath it.
 *
 * The name leads because a cell without a header reads as a data row rather than as a person- the
 * player has to infer whose column this is from the artwork. Naming it first turns the column into a
 * card, which is the difference between a menu and a screen worth looking at.
 *
 * Two graphics rather than one because they answer different questions. The face is who this person
 * is in a conversation; the map sprite is who the player has been looking at for the last several
 * hours of play, and in an action game that is the stronger identification of the two.
 * @param {number} index The index of the party member being rendered.
 */
Window_MenuStatus.prototype.drawItemImage = function(index)
{
  // grab the member occupying this cell.
  const actor = this.actor(index);

  // grab the bounds of the cell.
  const rect = this.itemRect(index);

  // the name caps the cell, with what they are beneath what they are called.
  this.drawActorNameHeader(actor, rect);
  this.drawActorClassSubtitle(actor, rect);

  // the artwork begins beneath it.
  const artY = rect.y + this.headerHeight();

  // the face and the sprite are centered as a single unit rather than individually.
  const pairWidth = ImageManager.faceWidth + this.walkSpriteGap() + this.walkSpriteWidth();
  const pairX = rect.x + Math.floor((rect.width - pairWidth) / 2);

  // sit the face at the top of the artwork band.
  this.drawActorFace(actor, pairX, artY, ImageManager.faceWidth, ImageManager.faceHeight);

  // the sprite anchors bottom-center, so aim at the horizontal middle of its own share of the pair.
  const spriteCenterX = pairX + ImageManager.faceWidth + this.walkSpriteGap() + (this.walkSpriteWidth() / 2);

  // stand the sprite on the same baseline as the bottom of the face.
  this.drawActorWalkSprite(actor, Math.floor(spriteCenterX), artY + ImageManager.faceHeight);
};

/**
 * Draws the actor's name across the top of their cell, enlarged and centered.
 *
 * Enlarged because this is the one piece of text in the cell that identifies everything below it,
 * and centered because the artwork beneath it is centered- a left-aligned name over centered
 * portraits reads as a mistake rather than as a choice.
 * @param {Game_Actor} actor The actor being named.
 * @param {Rectangle} rect The bounds of the cell.
 */
Window_MenuStatus.prototype.drawActorNameHeader = function(actor, rect)
{
  // enlarge for the header, then hand the font back so nothing below inherits it.
  this.contents.fontSize = $gameSystem.mainFontSize() + this.headerFontBoost();

  // center the name across the full width of the cell.
  this.drawText(actor.name(), rect.x, rect.y, rect.width, 'center');

  // restore the ordinary font settings for everything drawn after this.
  this.resetFontSettings();
};

/**
 * Draws the actor's class beneath their name, as a subtitle.
 *
 * Upper-cased and shrunk because it is a category rather than a proper noun- the name is who this
 * person is and the class is what they currently are, and the two carrying identical weight would
 * make the header read as two names. Tinted for the same reason, so the eye can tell at a glance
 * which line is the one it was looking for.
 * @param {Game_Actor} actor The actor whose class is being named.
 * @param {Rectangle} rect The bounds of the cell.
 */
Window_MenuStatus.prototype.drawActorClassSubtitle = function(actor, rect)
{
  // the font modifier reads the size currently in effect, so this has to run against body text
  // rather than against whatever the name header left behind.
  this.resetFontSettings();

  // a class is a category, and categories are not capitalized like names are.
  const className = actor.currentClass().name.toUpperCase();

  // shrink and tint through escape codes, which drawTextEx honors and plain drawText does not.
  const shrunk = this.modFontSizeForText(this.classSubtitleFontShrink(), className);
  const subtitle = this.colorizeText(this.classSubtitleColorIndex(), shrunk);

  // drawTextEx has no alignment of its own, so centering means measuring it first.
  const subtitleWidth = this.textSizeEx(subtitle).width;
  const subtitleX = rect.x + Math.floor((rect.width - subtitleWidth) / 2);

  // sit it on the line beneath the name.
  this.drawTextEx(subtitle, subtitleX, rect.y + this.lineHeight(), rect.width);
};

/**
 * How much larger than body text the cell's name header is drawn.
 * @returns {number}
 */
Window_MenuStatus.prototype.headerFontBoost = function()
{
  return 8;
};

/**
 * How much smaller than body text the class subtitle is drawn.
 * @returns {number}
 */
Window_MenuStatus.prototype.classSubtitleFontShrink = function()
{
  return -6;
};

/**
 * The palette index the class subtitle is tinted with.
 * @returns {number}
 */
Window_MenuStatus.prototype.classSubtitleColorIndex = function()
{
  return 1;
};

/**
 * The vertical space the name and class claim before the artwork begins.
 * @returns {number}
 */
Window_MenuStatus.prototype.headerHeight = function()
{
  return this.lineHeight() * 2;
};

/**
 * Draws an actor's map sprite in its neutral standing pose, facing the player.
 *
 * The engine's own {@link Window_Base.drawCharacter} selects exactly this frame, but blits it at
 * native size, which leaves it dwarfed by the portrait beside it. This exists solely to draw that
 * same frame enlarged.
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
  // square would be stretched by trusting the reservation.
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
 * Matching the portrait's height is the wrong target. Chibi proportions spend most of a frame on the
 * head, so a sprite standing as tall as a face does not read as its equal- it reads as looming. Two
 * keeps the sprite a companion to the portrait rather than a competitor, which is the relationship
 * worth preserving even if these proportions are later replaced with something less top-heavy.
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

//endregion header

//region details
/**
 * Overwrites {@link #drawItemStatus}.<br/>
 * Draws a member's details beneath their portrait.
 *
 * Ordered by how often the answer is wanted rather than by how the data happens to be stored: how
 * far along they are, how they are holding up, what is currently wrong with them, and what they are
 * carrying. Each block is separated by a rule, because five stacks of text at one rhythm reads as a
 * single undifferentiated list no matter how well the individual rows are drawn.
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

  // begin beneath the header and the artwork, and walk downward from there.
  let y = rect.y + this.headerHeight() + ImageManager.faceHeight + this.sectionGap();

  // how far along they are, and whatever else counts toward advancement.
  this.drawLevelAndExperience(actor, x, y, width);
  y += this.lineHeight();
  y = this.drawExtensionData(actor, x, y, width);
  y = this.drawSectionBreak(x, y, width);

  // how they are holding up.
  y = this.drawActorResources(actor, x, y, width);
  y = this.drawSectionBreak(x, y, width);

  // what is currently wrong with them.
  this.drawActorStates(actor, x, y, width);
  y += this.lineHeight();
  y = this.drawSectionBreak(x, y, width);

  // what they are carrying.
  this.drawEquipment(actor, x, y, width);
};

/**
 * Clear air on either side of the rule dividing one block of details from the next.
 * @returns {number}
 */
Window_MenuStatus.prototype.sectionGap = function()
{
  return Math.floor(this.lineHeight() / 2);
};

/**
 * The thickness of the rule dividing one block of details from the next.
 *
 * Four rather than the two {@link Window_Base.drawHorizontalLine} defaults to, because that default
 * cannot draw its own color- see {@link #drawSectionBreak} for why.
 * @returns {number}
 */
Window_MenuStatus.prototype.sectionRuleHeight = function()
{
  return 4;
};

/**
 * Draws the rule dividing one block of details from the next.
 *
 * Returns the y the following block begins at rather than expecting the caller to add the gap twice
 * and get it right- a divider is one thing, and the space it occupies should be one number.
 * @param {number} x The left edge of the rule.
 * @param {number} y The top of the space the divider occupies.
 * @param {number} width The width available to the rule.
 * @returns {number}
 */
Window_MenuStatus.prototype.drawSectionBreak = function(x, y, width)
{
  // the gap is split evenly above and below the rule itself.
  const gap = this.sectionGap();

  // the engine fills a rule with whatever text color happens to be current, so a divider drawn
  // without setting one takes its appearance from whichever row was drawn last. Establish it.
  this.resetTextColor();

  // drawn thicker than the default two pixels, which cannot render at all. The engine's drawRect
  // paints the outline color across the whole rule and then the actual color inset by a pixel on
  // every side, so a height of two leaves the inner rect zero pixels tall- all that reaches the
  // screen is translucent black, which against a dark window is nothing. Four is the first height
  // that puts any of the intended color on the screen.
  this.drawHorizontalLine(x, y + Math.floor(gap / 2), width, this.sectionRuleHeight());

  // hand back where the next block begins.
  return y + gap;
};

/**
 * Draws the actor's level and the distance to their next one as a single row.
 *
 * These are one thought rather than two- a level means little without knowing how close the next one
 * is, and separating them by three gauges is what left the experience readout looking stranded when
 * it lived on its own. The divider between them is what keeps a left-aligned and a right-aligned
 * value from reading as two unrelated pieces of text that happen to share a line.
 * @param {Game_Actor} actor The actor whose progress is being drawn.
 * @param {number} x The left edge of the row.
 * @param {number} y The top of the row.
 * @param {number} width The width available to the row.
 */
Window_MenuStatus.prototype.drawLevelAndExperience = function(actor, x, y, width)
{
  // the readouts themselves, which the catalog decides and this window merely places.
  const levelValue = MenuStatusCatalog.levelValue(actor);
  const experienceLabel = MenuStatusCatalog.experienceLabel(actor);

  // the level leads, marked by its icon rather than by the word for it.
  const iconY = y + Math.floor((this.lineHeight() - ImageManager.iconHeight) / 2);
  this.drawIcon(IconManager.level(), x, iconY);

  // the number sits immediately past its icon.
  const levelMargin = ImageManager.standardIconWidth + 8;
  this.resetTextColor();
  this.drawText(levelValue, x + levelMargin, y, width - levelMargin, 'left');

  // the distance trails, in the ordinary text color.
  this.drawText(experienceLabel, x, y, width, 'right');

  // the divider belongs in the space the two values leave between them rather than at the middle of
  // the row- the row's midpoint sits underneath the right-hand value, which is what made the two
  // read as one collided string rather than as a pair.
  const levelWidth = levelMargin + this.textWidth(levelValue);
  const experienceWidth = this.textWidth(experienceLabel);
  const gapWidth = width - levelWidth - experienceWidth;

  // a row whose values already fill it has no room for a divider, and does not need one.
  if (gapWidth <= 0) return;

  // dimmed, so it separates the two without competing with either.
  this.changePaintOpacity(false);
  this.drawText(MenuStatusCatalog.LEVEL_DIVIDER, x + levelWidth, y, gapWidth, 'center');
  this.changePaintOpacity(true);
};

/**
 * Draws every resource this actor carries, one gauge per line.
 * @param {Game_Actor} actor The actor whose resources are being drawn.
 * @param {number} x The left edge of the block.
 * @param {number} y The top of the block.
 * @param {number} width The width available to each row.
 * @returns {number} The y coordinate immediately beneath the block.
 */
Window_MenuStatus.prototype.drawActorResources = function(actor, x, y, width)
{
  // whichever resources this actor and this database between them decide are worth showing.
  const rows = MenuStatusCatalog.resourceRows(actor);

  // stack the rows beneath one another.
  rows.forEach((row, index) =>
  {
    // the line this particular row occupies.
    const rowY = y + (this.lineHeight() * index);

    this.drawResourceRow(row, x, rowY, width);
  });

  // hand back where the block ended.
  return y + (this.lineHeight() * rows.length);
};

/**
 * Draws a single resource as a label, a gauge, and the numbers behind it.
 *
 * The three share one line rather than stacking, because a resource is one fact and three lines of
 * vertical space is more than one fact is worth in a cell that has five other blocks to fit.
 * @param {{key: string, label: string, current: number, max: number, rate: number}} row The row.
 * @param {number} x The left edge of the row.
 * @param {number} y The top of the row.
 * @param {number} width The width available to the row.
 */
Window_MenuStatus.prototype.drawResourceRow = function(row, x, y, width)
{
  // the icon claims the left, centered against the line beside it.
  const iconY = y + Math.floor((this.lineHeight() - ImageManager.iconHeight) / 2);
  this.drawIcon(this.resourceIconIndex(row.key), x, iconY);

  // the numbers claim the right, in the ordinary text color.
  this.resetTextColor();
  this.drawText(`${row.current} / ${row.max}`, x, y, width, 'right');

  // the gauge claims everything between them.
  const gaugeX = x + this.resourceLabelWidth();
  const gaugeWidth = width - this.resourceLabelWidth() - this.resourceValueWidth();

  // center the gauge vertically within the line, since it is far shorter than the text beside it.
  const gaugeY = y + Math.floor((this.lineHeight() - this.gaugeHeight()) / 2);

  // build the bounds the gauge fills.
  const gaugeRect = new Rectangle(gaugeX, gaugeY, gaugeWidth, this.gaugeHeight());

  // draw it in whatever style this window has settled on.
  this.drawGauge(gaugeRect, row.rate, this.resourceGaugeOptions(row));
};

/**
 * Overwrites {@link Window_Base.gaugeHeight}.<br/>
 * The thickness of a gauge drawn in this window.
 *
 * J-Base's default of ten is sized for the tighter windows it was written against, and a ten pixel
 * bar sitting in a thirty-six pixel line reads as a hairline rather than as a measure of anything.
 * This window has the room to draw a gauge that looks like a gauge.
 * @returns {number}
 */
Window_MenuStatus.prototype.gaugeHeight = function()
{
  return 18;
};

/**
 * The space reserved for a resource's icon before its gauge begins.
 * @returns {number}
 */
Window_MenuStatus.prototype.resourceLabelWidth = function()
{
  return ImageManager.standardIconWidth + 12;
};

/**
 * The icon standing for a given resource.
 *
 * An icon rather than the database's abbreviation, because the abbreviations are two letters that
 * differ by one character and the icons are distinguishable at a glance- which is the whole job of
 * the leftmost thing on a row the player is scanning rather than reading.
 *
 * Resolved through IconManager for the same reason the colors are resolved through ColorManager: a
 * resource should look the way it looks everywhere else in the game, and neither decision belongs
 * to this window.
 * @param {string} key Which resource is being marked, being one of 'hp', 'mp', or 'tp'.
 * @returns {number}
 */
Window_MenuStatus.prototype.resourceIconIndex = function(key)
{
  switch (key)
  {
    case 'mp':
      return IconManager.param(1);
    case 'tp':
      return IconManager.maxTp();
    default:
      return IconManager.param(0);
  }
};

/**
 * The space reserved for a resource's current and maximum values.
 * @returns {number}
 */
Window_MenuStatus.prototype.resourceValueWidth = function()
{
  return 160;
};

/**
 * Builds the styling for a resource gauge.
 *
 * Kept as one method taking the whole row so that changing the house style is a single edit- these
 * four gauge shapes are trivially interchangeable, and settling on one is a matter of looking at
 * them rather than of reasoning about them.
 *
 * Segmented rather than solid because a solid bar answers "how full" and a segmented one also
 * answers "how much", which is the more useful question when the number beside it is the thing the
 * player is actually budgeting against.
 * @param {{key: string, label: string, current: number, max: number, rate: number}} row The row.
 * @returns {WindowGaugeOptions}
 */
Window_MenuStatus.prototype.resourceGaugeOptions = function(row)
{
  // the gradient this particular resource is drawn in.
  const [ leftColor, rightColor ] = this.resourceGaugeColors(row.key);

  // one notch per fixed quantity, so a bigger pool reads as a longer ladder rather than as the same
  // bar with finer divisions- the segments mean something rather than merely decorating.
  const segments = Math.max(1, Math.ceil(row.max / this.resourceSegmentValue()));

  // build the styling.
  return WindowGaugeOptions.Builder()
    .gaugeType(Window_Base.GAUGE_TYPES.Segmented)
    .segments(segments)
    .gap(2)
    .leftGradientColor(leftColor)
    .rightGradientColor(rightColor)
    .backColor(this.gaugeBackColor())
    .build();
};

/**
 * How much of a resource one segment of its gauge stands for.
 * @returns {number}
 */
Window_MenuStatus.prototype.resourceSegmentValue = function()
{
  return 20;
};

/**
 * The gradient a given resource's gauge is drawn in.
 *
 * Deferred to the engine's own gauge colors rather than chosen here, so a resource looks the same in
 * this menu as it does everywhere else the player has already learned to read it.
 * @param {string} key Which resource the gauge renders, being one of 'hp', 'mp', or 'tp'.
 * @returns {[string, string]}
 */
Window_MenuStatus.prototype.resourceGaugeColors = function(key)
{
  switch (key)
  {
    case 'mp':
      return [ ColorManager.mpGaugeColor1(), ColorManager.mpGaugeColor2() ];
    case 'tp':
      return [ ColorManager.tpGaugeColor1(), ColorManager.tpGaugeColor2() ];
    default:
      return [ ColorManager.hpGaugeColor1(), ColorManager.hpGaugeColor2() ];
  }
};

/**
 * Draws the icons of every state currently afflicting this actor.
 *
 * An actor suffering nothing says so in words rather than leaving the row blank. A blank row reads
 * as something that failed to load; "Unafflicted" reads as good news, and good news is worth the
 * line it costs.
 * @param {Game_Actor} actor The actor whose afflictions are being drawn.
 * @param {number} x The left edge of the row.
 * @param {number} y The top of the row.
 * @param {number} width The width available to the row.
 */
Window_MenuStatus.prototype.drawActorStates = function(actor, x, y, width)
{
  // whatever is currently wrong with this actor.
  const iconIndices = MenuStatusCatalog.stateIcons(actor);

  // an actor in the clear says as much, dimmed, since it is the absence of news.
  if (iconIndices.length === 0)
  {
    this.changePaintOpacity(false);
    this.drawText(MenuStatusCatalog.UNAFFLICTED_TEXT, x, y, width, 'left');
    this.changePaintOpacity(true);

    return;
  }

  // lay the icons out left to right along the row.
  const iconY = y + Math.floor((this.lineHeight() - ImageManager.iconHeight) / 2);
  iconIndices.forEach((iconIndex, index) =>
  {
    // the slot this particular icon occupies.
    const iconX = x + (index * (ImageManager.standardIconWidth + 4));

    this.drawIcon(iconIndex, iconX, iconY);
  });
};

/**
 * Draws everything this actor is wearing, one slot per line.
 * @param {Game_Actor} actor The actor whose loadout is being drawn.
 * @param {number} x The left edge of the block.
 * @param {number} y The top of the block.
 * @param {number} width The width available to each row.
 * @returns {number} The y coordinate immediately beneath the block.
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

  // hand back where the block ended.
  return y + (this.lineHeight() * rows.length);
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

/**
 * Draws whatever other plugins have to contribute about this actor's advancement.
 *
 * Deliberately empty. J-CMS knows nothing about the systems layered on top of it, and the things
 * genuinely worth a row here- unspent node points, for one- belong to the plugins that own them.
 * Those plugins alias this method rather than J-CMS reaching across for data it has no business
 * knowing about.
 *
 * Positioned alongside level and experience rather than at the foot of the cell, because what an
 * extension has to say about a character is almost always another measure of how far along they
 * are, and a currency waiting to be spent belongs beside the two numbers it will be spent on- not
 * stranded beneath their gear.
 *
 * An implementation must return the y its own drawing ended at, so that several extensions can each
 * claim a row without any of them knowing what the others drew. Doing nothing returns the y it was
 * given, which costs the cell no space at all.
 * @param {Game_Actor} _actor The actor being described.
 * @param {number} _x The left edge of the space available.
 * @param {number} y The top of the space available.
 * @param {number} _width The width available.
 * @returns {number}
 */
// eslint-disable-next-line no-unused-vars
Window_MenuStatus.prototype.drawExtensionData = function(_actor, _x, y, _width)
{
  // nothing to add, so the cell resumes exactly where it left off.
  return y;
};

//endregion details