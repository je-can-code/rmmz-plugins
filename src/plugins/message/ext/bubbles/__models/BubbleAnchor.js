//region BubbleAnchor
/**
 * A fixed point on screen for a bubble to sit above.
 *
 * Every other target a message can name is a character that walks around, and the bubble follows it
 * by asking where it is this frame. An author who names a literal coordinate instead is asking for
 * the one thing a character cannot give them: a bubble that does not move. Rather than teach the
 * rest of the ship to ask "is this a character or a pair of numbers" at every read, the pair of
 * numbers learns to answer the two questions a character answers, and the distinction stops
 * existing above this file.
 */
class BubbleAnchor
{
  /**
   * The horizontal position of this anchor, in screen pixels.
   * @type {number}
   */
  #x = 0;

  /**
   * The vertical position of this anchor, in screen pixels.
   * @type {number}
   */
  #y = 0;

  /**
   * Constructor.
   * @param {number} x The horizontal position, in screen pixels.
   * @param {number} y The vertical position, in screen pixels.
   */
  constructor(x, y)
  {
    this.#x = x;
    this.#y = y;
  }

  /**
   * The horizontal position this anchor holds.<br/>
   * Named for the method every `Game_Character` answers, because that is the whole point of it.
   * @returns {number}
   */
  screenX()
  {
    return this.#x;
  }

  /**
   * The vertical position this anchor holds.<br/>
   * Named for the method every `Game_Character` answers, because that is the whole point of it.
   * @returns {number}
   */
  screenY()
  {
    return this.#y;
  }

  /**
   * The point a bubble's tail should aim at.
   *
   * The same as this anchor's own position whichever side the bubble is on, and deliberately so. A
   * character answers this differently depending on the side, because a tail has to reach the end of
   * them nearest the bubble rather than cross their whole sprite - but an author who typed a
   * coordinate meant that coordinate, and moving it by the height of a sprite that is not there
   * would put the bubble somewhere they did not ask for.
   * @param {boolean} _preferBelow Whether the bubble is hanging below, which a fixed point ignores.
   * @returns {number}
   */
  bubbleAnchorY(_preferBelow)
  {
    return this.#y;
  }
}

export default BubbleAnchor;
//endregion BubbleAnchor