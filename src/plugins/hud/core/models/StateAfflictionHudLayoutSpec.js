//region StateAfflictionHudLayoutSpec
/**
 * Layout coordinates for the dual-row HUD affliction presenter.
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
    return this.originY + ImageManager.iconHeight + this.rowGap;
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
}

export default StateAfflictionHudLayoutSpec;
//endregion StateAfflictionHudLayoutSpec