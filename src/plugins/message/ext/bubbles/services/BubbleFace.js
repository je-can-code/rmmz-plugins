//region BubbleFace
/**
 * Everything about fitting a speaker's portrait into a floating message.
 *
 * The engine draws a face by cropping rather than scaling. `Window_Base.drawFace` takes the height it
 * is given, clamps it against the source tile with `Math.min`, and blits that many rows straight
 * across - centred on the tile, so a window shorter than a face shows a horizontal band out of the
 * middle of it. In the bottom box that never surfaces, because the box is 152 pixels of inner height
 * against a 144 pixel face and the clamp never bites. A bubble is as tall as the words inside it, so a
 * two-line bubble shows a speaker from eyebrows to chin and a one-line bubble shows their eyes.
 *
 * So a bubble draws its own portrait, scaled down to {@link BubbleFace.DrawSize} rather than cropped,
 * and the whole message is laid out around that size: the text is indented past it, the bubble is
 * floored at it, and a message too short to reach it is nudged down to sit level with it.
 *
 * Nothing here touches a window or a sprite. The live message and the spent bubble it leaves behind
 * are both callers, and they have to agree exactly - a portrait that moved by four pixels at the
 * moment a character stopped talking would read as the bubble twitching.
 */
class BubbleFace
{
  /**
   * How large a portrait is drawn inside a bubble, in logical pixels.
   *
   * Half the source tile, which is exactly two lines of text at the engine's 36 pixel line height.
   * That is what keeps the floor below from ever mattering in practice: almost nothing anybody writes
   * is a single line, so a bubble is already taller than this before the portrait has any say, and
   * the sizes above are the rare case rather than the normal one.
   * @type {number}
   */
  static DrawSize = 72;

  /**
   * How much clear space sits between the portrait and the first letter beside it.
   *
   * The engine's own gap, kept rather than rescaled alongside the portrait. It is breathing room
   * between two things, not part of either of them.
   * @type {number}
   */
  static Spacing = 20;

  /**
   * How far in from the contents edge the portrait is drawn.
   * @type {number}
   */
  static EdgeMargin = 4;

  /**
   * How many portraits sit across one face sheet.
   * @type {number}
   */
  static SheetColumns = 4;

  /**
   * Whether this message has a portrait at all.
   *
   * Most messages in any project do not, and an idle chatterer never does. Everything below answers
   * with a zero for those, so a bubble with no face is sized by its text and nothing else.
   * @param {string} faceName The face image the message named, or empty when it named none.
   * @returns {boolean}
   */
  static isPresent(faceName)
  {
    return faceName !== String.empty;
  }

  /**
   * Where the first letter of a line starts, measured from the inside of the contents.
   * @param {string} faceName The face image the message named, or empty when it named none.
   * @returns {number} The indent, in logical pixels.
   */
  static indent(faceName)
  {
    if (BubbleFace.isPresent(faceName) === false) return BubbleFace.EdgeMargin;

    return BubbleFace.DrawSize + BubbleFace.Spacing;
  }

  /**
   * The least tall a bubble's contents may be, so the portrait inside it is never cut off.
   * @param {string} faceName The face image the message named, or empty when it named none.
   * @returns {number} The floor, in logical pixels, or zero when there is no portrait to clear.
   */
  static floor(faceName)
  {
    if (BubbleFace.isPresent(faceName) === false) return 0;

    return BubbleFace.DrawSize;
  }

  /**
   * How far down a message's letters move to sit level with the portrait beside them.
   *
   * Text starts at the top of the contents, so a single line next to a portrait twice its height
   * would sit against the speaker's hairline with the rest of the bubble empty underneath. Half the
   * leftover puts the line across the middle of the portrait instead.
   * @param {string} faceName The face image the message named, or empty when it named none.
   * @param {number} textHeight How tall the message's own text is, in logical pixels.
   * @returns {number} The offset, in logical pixels, or zero when the text is already the taller one.
   */
  static slack(faceName, textHeight)
  {
    const floor = BubbleFace.floor(faceName);

    // the ordinary case the moment a message reaches two lines, and every case without a portrait.
    if (textHeight >= floor) return 0;

    return (floor - textHeight) / 2;
  }

  /**
   * How far down the portrait moves to sit level with the words beside it.
   *
   * The other half of {@link BubbleFace.slack}, and the same rule read the other way round: whichever
   * of the portrait and the text is shorter centres against the taller. A three line message is half
   * again the height of the portrait, so leaving the portrait at the top of it strands it against the
   * first line with a band of empty bubble underneath.
   * @param {string} faceName The face image the message named, or empty when it named none.
   * @param {number} contentHeight How tall the bubble's contents are, in logical pixels.
   * @returns {number} The offset, in logical pixels, or zero when the portrait already fills it.
   */
  static faceOffset(faceName, contentHeight)
  {
    // no portrait to place.
    if (BubbleFace.isPresent(faceName) === false) return 0;

    // a message of two lines or fewer, where the portrait is the taller of the two and the text is
    // what moved instead.
    if (contentHeight <= BubbleFace.DrawSize) return 0;

    return (contentHeight - BubbleFace.DrawSize) / 2;
  }

  /**
   * Where in a face sheet the given portrait begins.
   * @param {number} faceIndex Which portrait on the sheet the message named.
   * @returns {{x: number, y: number}} The top-left of that portrait's tile, in source pixels.
   */
  static sourceOrigin(faceIndex)
  {
    const column = faceIndex % BubbleFace.SheetColumns;
    const row = Math.floor(faceIndex / BubbleFace.SheetColumns);

    return {
      x: column * ImageManager.faceWidth,
      y: row * ImageManager.faceHeight,
    };
  }
}

export default BubbleFace;
//endregion BubbleFace