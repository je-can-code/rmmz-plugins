//region StateAfflictionHudLayoutSpec
/**
 * Layout coordinates for the HUD affliction presenter.<br/>
 * The defaults describe two rows of full-size icons- debuffs over buffs. A host that is short on room turns
 * on the compact settings instead: one shared row, smaller icons, and a colored square behind each icon to
 * say which side of the ledger it is on.
 */
class StateAfflictionHudLayoutSpec
{
  /**
   * The origin x coordinate for the first slot in each row.
   * @type {number}
   */
  originX = 0;

  /**
   * The origin y coordinate for the negative row.
   * @type {number}
   */
  originY = 0;

  /**
   * Horizontal distance between icon slots.
   * @type {number}
   */
  iconPitch = ImageManager.iconWidth + 2;

  /**
   * Vertical gap between the negative and positive rows.
   * @type {number}
   */
  rowGap = 8;

  /**
   * Whether buffs continue along the debuff row rather than starting a second row beneath it.<br/>
   * One row keeps a frame short; two rows keep debuffs and buffs apart without needing a color to do it.
   * @type {boolean}
   */
  singleRow = false;

  /**
   * The scale each state icon is drawn at, where 1 is the iconset's own size.
   * @type {number}
   */
  iconScale = 1;

  /**
   * Whether each icon sits on a square colored by which side it is on- red for a debuff, green for a
   * buff. Once debuffs and buffs share a row, this is what tells them apart.
   * @type {boolean}
   */
  polarityBacking = false;

  /**
   * How far the colored square reaches past its icon on every side.
   * @type {number}
   */
  backingPadding = 2;

  /**
   * How opaque the colored square is, from 0 to 255.<br/>
   * Short of solid, so the square reads as a tint behind the icon rather than a tile the icon sits on.
   * @type {number}
   */
  backingOpacity = 192;

  /**
   * How far below the top of its icon a timer is placed.
   * @type {number}
   */
  timerOffsetY = 20;

  /**
   * How much smaller than the main font the timers are drawn.
   * @type {number}
   */
  timerFontSizeReduction = 6;

  /**
   * How much smaller than the main font the stack counts are drawn.
   * @type {number}
   */
  stackFontSizeReduction = 4;

  /**
   * The y coordinate for the negative row.
   * @returns {number}
   */
  negativeRowY()
  {
    return this.originY;
  }

  /**
   * The y coordinate for the positive row.
   * @returns {number}
   */
  positiveRowY()
  {
    // sharing a row, buffs sit level with the debuffs.
    if (this.singleRow === true) return this.negativeRowY();

    // otherwise they get a row of their own, one icon and a gap below.
    return this.originY + this.scaledIconHeight() + this.rowGap;
  }

  /**
   * The x coordinate for a slot at the given index.
   * @param {number} index The slot index within a row.
   * @returns {number}
   */
  slotX(index)
  {
    return this.originX + (index * this.iconPitch);
  }

  /**
   * The x coordinate for the buff at the given index.<br/>
   * On a shared row the buffs pick up where the debuffs leave off, so their position depends on how many
   * debuffs came before them.
   * @param {number} index The buff's index among the buffs.
   * @param {number} negativeCount How many debuffs lead the row.
   * @returns {number}
   */
  positiveSlotX(index, negativeCount)
  {
    // sharing a row, buffs continue on past the last debuff.
    if (this.singleRow === true) return this.slotX(negativeCount + index);

    // on a row of their own, buffs start back at the left.
    return this.slotX(index);
  }

  /**
   * The width a state icon is drawn at.
   * @returns {number}
   */
  scaledIconWidth()
  {
    return ImageManager.iconWidth * this.iconScale;
  }

  /**
   * The height a state icon is drawn at.
   * @returns {number}
   */
  scaledIconHeight()
  {
    return ImageManager.iconHeight * this.iconScale;
  }

  /**
   * The x coordinate of the center of the icon in a slot.<br/>
   * The timer and stack count are centered on this, so they stay under their icon however large it is drawn.
   * @param {number} slotX The x coordinate of the slot.
   * @returns {number}
   */
  slotCenterX(slotX)
  {
    return slotX + (this.scaledIconWidth() / 2);
  }

  /**
   * The width and height of the colored square behind an icon.
   * @returns {number}
   */
  backingSize()
  {
    return this.scaledIconWidth() + (this.backingPadding * 2);
  }
}

export default StateAfflictionHudLayoutSpec;
//endregion StateAfflictionHudLayoutSpec