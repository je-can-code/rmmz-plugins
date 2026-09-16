//region BubbleLayout
import BubbleBounds from '../__models/BubbleBounds.js';
import BubblePlacement from './BubblePlacement.js';
import BubbleShape from './BubbleShape.js';

/**
 * Everything about where a bubble goes, answered in one call.
 *
 * Two things place bubbles and they must agree exactly: the live message window, and a spent bubble
 * left behind by whoever spoke last. If those drifted apart by a pixel, two characters talking would
 * show one bubble sitting slightly differently from the other for no reason a player could name -
 * and the drift would only appear once somebody edited one of the two.
 *
 * So the arithmetic lives here and both of them are callers. Nothing in it touches a window, a
 * sprite or the engine, which also means the whole of it can be checked without a running game.
 */
class BubbleLayout
{
  /**
   * How far inside its own rectangle a bubble's border is drawn, in logical pixels.
   *
   * A stroke is centred on the line it follows, so a border drawn at zero would hang half its
   * thickness outside the box. Nothing clips it, but the bubble and the thing holding it would
   * disagree about where they end.
   * @type {number}
   */
  static BorderInset = 2;

  /**
   * Where a bubble goes and what shape it is, given its text and who it belongs to.
   * @param {BubbleBounds} content How much room the text needs, measured from the contents origin.
   * @param {number} padding How much clear space sits between the contents and the window edge.
   * @param {number} anchorX The horizontal position of whoever is speaking, in screen pixels.
   * @param {number} anchorY The vertical position of whoever is speaking, in screen pixels.
   * @param {number} screenWidth How wide the visible area is.
   * @param {number} screenHeight How tall the visible area is.
   * @param {boolean} preferBelow Whether this one was asked to sit under its speaker rather than over.
   * @returns {{x: number, y: number, width: number, height: number, bounds: BubbleBounds, tail: object}}
   */
  static solve(content, padding, anchorX, anchorY, screenWidth, screenHeight, preferBelow)
  {
    // measured from the contents origin, so the far edges are the size and the near ones are slack
    // the padding already covers.
    const width = Math.ceil(content.right) + (padding * 2);
    const height = Math.ceil(content.bottom) + (padding * 2);

    const placed = BubblePlacement.place(
      width,
      height,
      anchorX,
      anchorY,
      screenWidth,
      screenHeight,
      preferBelow);

    const bounds = new BubbleBounds(
      BubbleLayout.BorderInset,
      BubbleLayout.BorderInset,
      width - BubbleLayout.BorderInset,
      height - BubbleLayout.BorderInset);

    // the tail is drawn in the bubble's own coordinates, so the speaker has to be described in them
    // too - the bubble has just been placed, and the placement is what the two differ by.
    const tail = BubbleShape.tailFor(bounds, anchorX - placed.x, anchorY - placed.y);

    return {
      x: placed.x,
      y: placed.y,
      width,
      height,
      bounds,
      tail,
    };
  }
}

export default BubbleLayout;
//endregion BubbleLayout