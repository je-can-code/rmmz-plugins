//region BubbleBounds
/**
 * A rectangle in the window's own coordinates, described by its edges rather than by a corner.
 *
 * Edges because this is built by union: every glyph pushes whichever sides it sticks out past, and
 * a left-and-size rectangle has to be unpacked and repacked at each of those steps. The width and
 * height nobody accumulates are derived at the end, once, from edges that are already correct.
 *
 * The coordinates are the ones glyphs are emitted in - measured from the inside of the message
 * window, before any of the padding a bubble adds around them.
 */
class BubbleBounds
{
  /**
   * The leftmost pixel the content reaches.
   * @type {number}
   */
  left = 0;

  /**
   * The topmost pixel the content reaches.
   * @type {number}
   */
  top = 0;

  /**
   * The pixel just past the rightmost the content reaches.
   * @type {number}
   */
  right = 0;

  /**
   * The pixel just past the bottommost the content reaches.
   * @type {number}
   */
  bottom = 0;

  /**
   * Constructor.
   * @param {number} left The leftmost pixel the content reaches.
   * @param {number} top The topmost pixel the content reaches.
   * @param {number} right The pixel just past the rightmost the content reaches.
   * @param {number} bottom The pixel just past the bottommost the content reaches.
   */
  constructor(left, top, right, bottom)
  {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  /**
   * The rectangle enclosing nothing.
   *
   * What a message with no glyphs in it measures to, which is a real situation rather than an error
   * case - a bubble is sized before its text has finished revealing, and a page that is all icons
   * and text codes can genuinely contain no characters at all.
   * @returns {BubbleBounds}
   */
  static empty()
  {
    return new BubbleBounds(0, 0, 0, 0);
  }

  /**
   * How wide this rectangle is.
   * @returns {number}
   */
  width()
  {
    return this.right - this.left;
  }

  /**
   * How tall this rectangle is.
   * @returns {number}
   */
  height()
  {
    return this.bottom - this.top;
  }

  /**
   * Grows this rectangle to also enclose another.
   *
   * Mutates rather than returning a new rectangle, because the caller building it is walking a list
   * of ninety glyphs and allocating ninety intermediate rectangles to throw away is the kind of
   * thing that turns a per-message cost into a per-frame one the first time somebody moves the call.
   * @param {BubbleBounds} other The rectangle to swallow.
   */
  union(other)
  {
    this.left = Math.min(this.left, other.left);
    this.top = Math.min(this.top, other.top);
    this.right = Math.max(this.right, other.right);
    this.bottom = Math.max(this.bottom, other.bottom);
  }

  /**
   * Pushes every edge of this rectangle outward by the same amount.
   * @param {number} margin How far to push each edge out, in logical pixels.
   */
  grow(margin)
  {
    this.left -= margin;
    this.top -= margin;
    this.right += margin;
    this.bottom += margin;
  }
}

export default BubbleBounds;
//endregion BubbleBounds