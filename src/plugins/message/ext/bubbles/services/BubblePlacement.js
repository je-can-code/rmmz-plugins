//region BubblePlacement
/**
 * Where on screen a bubble sits, given who it belongs to.
 *
 * Two rules, and they disagree with each other constantly. A bubble wants to be centred above its
 * speaker, because that is what makes it read as theirs; and it wants to be entirely on screen,
 * because half a bubble is worse than a slightly misplaced one. Whenever those conflict the screen
 * wins and the tail takes up the slack - it leans, which is the whole reason it can.
 *
 * Nothing here knows about windows or sprites. It is given a size and a point and answers with a
 * corner, which is the part of placement that can be checked without a running game.
 */
class BubblePlacement
{
  /**
   * How much clear screen to leave around a bubble, in logical pixels.
   * @type {number}
   */
  static ScreenMargin = 6;

  /**
   * How far above the point it is pointing at a bubble floats, in logical pixels.
   *
   * Enough for the tail plus a little air. A bubble resting directly on a character's head reads as
   * a hat rather than as speech.
   * @type {number}
   */
  static AnchorGap = 20;

  /**
   * Where a bubble's top-left corner goes.
   * @param {number} width How wide the bubble is.
   * @param {number} height How tall the bubble is.
   * @param {number} anchorX The horizontal position of whoever is speaking, in screen pixels.
   * @param {number} anchorY The vertical position of whoever is speaking, in screen pixels.
   * @param {number} screenWidth How wide the visible area is.
   * @param {number} screenHeight How tall the visible area is.
   * @returns {{x: number, y: number}}
   */
  static place(width, height, anchorX, anchorY, screenWidth, screenHeight, preferBelow)
  {
    const centred = anchorX - (width / 2);

    return {
      x: BubblePlacement.holdOnScreen(centred, width, screenWidth),
      y: BubblePlacement.verticalFor(height, anchorY, screenHeight, preferBelow),
    };
  }

  /**
   * Which side of its speaker a bubble ends up on, and where.
   *
   * The side an author asked for is honoured wherever it fits, and abandoned where it does not - a
   * bubble squashed against the ceiling sits over its own speaker's head with its tail folded back
   * into itself, which is worse than being on the side nobody asked for. The fallback is checked
   * rather than assumed, so a bubble taller than the room on either side still lands somewhere
   * predictable instead of bouncing between two impossible answers.
   * @param {number} height How tall the bubble is.
   * @param {number} anchorY The vertical position of whoever is speaking.
   * @param {number} screenHeight How tall the visible area is.
   * @param {boolean} preferBelow Whether the author asked for this one to sit under its speaker.
   * @returns {number}
   */
  static verticalFor(height, anchorY, screenHeight, preferBelow)
  {
    const above = anchorY - BubblePlacement.AnchorGap - height;
    const below = anchorY + BubblePlacement.AnchorGap;

    const wanted = preferBelow === true
      ? below
      : above;
    const other = preferBelow === true
      ? above
      : below;

    if (BubblePlacement.fitsOnScreen(wanted, height, screenHeight) === true)
    {
      return BubblePlacement.holdOnScreen(wanted, height, screenHeight);
    }

    return BubblePlacement.holdOnScreen(other, height, screenHeight);
  }

  /**
   * Whether a bubble placed here would be entirely visible.
   * @param {number} position Where the bubble would sit.
   * @param {number} extent How far it reaches.
   * @param {number} available How much room there is.
   * @returns {boolean}
   */
  static fitsOnScreen(position, extent, available)
  {
    if (position < BubblePlacement.ScreenMargin) return false;

    return position + extent <= available - BubblePlacement.ScreenMargin;
  }

  /**
   * Holds one axis of a bubble inside the visible area.
   * @param {number} position Where the bubble would like to sit on this axis.
   * @param {number} extent How far the bubble reaches along this axis.
   * @param {number} available How much room there is along this axis.
   * @returns {number}
   */
  static holdOnScreen(position, extent, available)
  {
    const lastFittingPosition = available - extent - BubblePlacement.ScreenMargin;

    // a bubble wider or taller than the screen itself cannot satisfy both edges, and the two limits
    // cross. Pinning the near edge is the readable failure: the text starts where text starts, and
    // what falls off is the end of it rather than the beginning.
    if (lastFittingPosition < BubblePlacement.ScreenMargin) return BubblePlacement.ScreenMargin;

    const notTooFarBack = Math.max(position, BubblePlacement.ScreenMargin);

    return Math.min(notTooFarBack, lastFittingPosition);
  }
}

export default BubblePlacement;
//endregion BubblePlacement