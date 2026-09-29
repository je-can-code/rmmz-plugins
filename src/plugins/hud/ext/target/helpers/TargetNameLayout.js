//region TargetNameLayout
/**
 * How the target's name fits its row: the size it is drawn at, and where it sits on the row.
 *
 * The name follows the target's icons and level on one row, so it has only the width they leave it. A name too
 * long for that is drawn a size smaller at a time until it fits, rather than being cut off at the frame's edge.
 */
class TargetNameLayout
{
  /**
   * The size the name is drawn at whenever it fits as it is.
   * @type {number}
   */
  static LARGEST_FONT_SIZE = 24;

  /**
   * The smallest size a long name shrinks to, still clearly larger than the level beside it, so the name keeps
   * reading as the row's headline. A name too long even at this size is cut off at the frame's edge.
   * @type {number}
   */
  static SMALLEST_FONT_SIZE = 16;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The largest size, from {@link #LARGEST_FONT_SIZE} down to {@link #SMALLEST_FONT_SIZE}, at which the name fits
   * the width it has- or the smallest size, when it fits at none of them.
   * @param {function(number): number} widthAt How wide the name draws at a given font size.
   * @param {number} availableWidth The width the name has.
   * @returns {number}
   */
  static fittingFontSize(widthAt, availableWidth)
  {
    // every size the name may take, largest first.
    const sizeCount = this.LARGEST_FONT_SIZE - this.SMALLEST_FONT_SIZE + 1;
    const sizes = Array.from({ length: sizeCount }, (unused, index) => this.LARGEST_FONT_SIZE - index);

    // the first size that fits is the largest that does.
    const fittingSize = sizes.find(fontSize => widthAt(fontSize) <= availableWidth);

    // a name that fits at no size takes the smallest, and is cut off at the edge.
    if (fittingSize === undefined) return this.SMALLEST_FONT_SIZE;

    return fittingSize;
  }

  /**
   * How far down the row a name drawn smaller moves, so it stays centered on the line a full-size name sits on,
   * which is where the icons and level beside it are centered.
   *
   * A smaller size draws on a shorter line from the same top, which would lift its middle by half the
   * difference; this puts it back, to the whole pixel, so the text stays crisp.
   * @param {number} fontSize The size the name is drawn at.
   * @returns {number}
   */
  static offsetY(fontSize)
  {
    return Math.floor((this.LARGEST_FONT_SIZE - fontSize) / 2);
  }
}

export default TargetNameLayout;
//endregion TargetNameLayout