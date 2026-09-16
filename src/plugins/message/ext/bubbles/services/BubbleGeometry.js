//region BubbleGeometry
import BubbleBounds from '../__models/BubbleBounds.js';

/**
 * Measures how much room a message's text actually needs.
 *
 * The window already tracks `outputWidth` and `outputHeight` while it reveals, and both are the
 * wrong number for this. They describe where the *cursor* got to - the widest line's advance, and
 * the bottom of the last line - which is exactly the text's footprint and nothing else. A glyph is
 * drawn with an outline stroked around it, an italic leans out past its advance, and an effect can
 * throw the whole letter several pixels clear of where it was measured. Size a container from the
 * cursor box and every one of those gets its edge shaved off.
 *
 * So the measurement is taken from the glyphs themselves, one box each, unioned - and the glyphs are
 * asked what they are capable of rather than what they are doing this instant. A wave sampled at the
 * wrong moment is resting on its own centre line and reports needing nothing at all; half a second
 * later it is four pixels higher and clipped. What matters is the envelope, and only the effect
 * itself knows its own.
 *
 * Nothing here knows what "wave" means, and that is deliberate. It asks J-Message's registry for the
 * reach of whatever names a glyph is carrying, which is what keeps a bubble correct around an effect
 * this ship has never heard of.
 */
class BubbleGeometry
{
  /**
   * How much clear space to leave between the text and the bubble's border, in logical pixels.
   * @type {number}
   */
  static ContentMargin = 10;

  /**
   * The box the given glyphs occupy, including everything they might do to themselves.
   * @param {MessageGlyph[]} glyphs The glyphs making up the message.
   * @returns {BubbleBounds} The union of every glyph's reach, or an empty rectangle when there are
   * no glyphs to measure.
   */
  static contentBounds(glyphs)
  {
    // a message whose text has not begun revealing has nothing to measure, and unioning from a zero
    // rectangle instead would anchor every bubble to the window's top-left corner.
    if (glyphs.length === 0) return BubbleBounds.empty();

    const bounds = BubbleGeometry.glyphBounds(glyphs[ 0 ]);

    glyphs.forEach(glyph =>
    {
      bounds.union(BubbleGeometry.glyphBounds(glyph));
    });

    return bounds;
  }

  /**
   * The box one glyph occupies, at rest and at full reach.
   * @param {MessageGlyph} glyph The glyph to measure.
   * @returns {BubbleBounds}
   */
  static glyphBounds(glyph)
  {
    const bounds = BubbleGeometry.restingBounds(glyph);
    const excursion = MessageEffectRegistry.excursionOf(glyph.effects);

    // displacement pushes both ways: the glyph is at one extreme of a wave now and at the other in
    // twenty frames, and the container has to hold both without being resized in between.
    bounds.left -= excursion.offsetX;
    bounds.right += excursion.offsetX;
    bounds.top -= excursion.offsetY;
    bounds.bottom += excursion.offsetY;

    const swell = BubbleGeometry.swellOf(glyph, excursion.scale);
    bounds.left -= swell.horizontal;
    bounds.right += swell.horizontal;
    bounds.top -= swell.vertical;
    bounds.bottom += swell.vertical;

    return bounds;
  }

  /**
   * The box one glyph occupies with nothing acting on it.
   *
   * The advance the splitter measured, widened by the margin the raster reserves on each side for
   * the outline - the same margin the sprite then subtracts when it places itself, so this is the
   * glyph's real footprint rather than its contribution to the cursor.
   * @param {MessageGlyph} glyph The glyph to measure.
   * @returns {BubbleBounds}
   */
  static restingBounds(glyph)
  {
    const padding = TextRasterMetrics.padding(glyph.outlineWidth);

    return new BubbleBounds(
      glyph.x - padding,
      glyph.y,
      glyph.x + glyph.width + padding,
      glyph.y + glyph.lineHeight);
  }

  /**
   * How far a swelling glyph reaches past its own edges, on each axis.
   *
   * Measured against the raster rather than against the letter, because the raster is what actually
   * gets scaled: the sprite grows its whole bitmap and pulls back by half the growth to keep the
   * letter centred, so the distance anything travels is set by the size of the bitmap it lives in.
   * The bitmap is taller than the line by some margin, which makes this a little generous vertically
   * - and generous is the correct direction to be wrong in, because the cost is a few pixels of
   * bubble and the alternative is a shaved ascender.
   * @param {MessageGlyph} glyph The glyph to measure.
   * @param {number} scale The largest this glyph ever gets, as a multiple of its drawn size.
   * @returns {{horizontal: number, vertical: number}}
   */
  static swellOf(glyph, scale)
  {
    const growth = scale - 1;
    const padding = TextRasterMetrics.padding(glyph.outlineWidth);
    const rasterWidth = glyph.width + (padding * 2);
    const rasterHeight = TextRasterMetrics.canvasHeight(glyph.fontSize);

    return {
      horizontal: rasterWidth * growth / 2,
      vertical: rasterHeight * growth / 2,
    };
  }

  /**
   * The box the bubble's border encloses, given the text inside it.
   * @param {MessageGlyph[]} glyphs The glyphs making up the message.
   * @returns {BubbleBounds}
   */
  static bubbleBounds(glyphs)
  {
    const bounds = BubbleGeometry.contentBounds(glyphs);
    bounds.grow(BubbleGeometry.ContentMargin);

    return bounds;
  }
}

export default BubbleGeometry;
//endregion BubbleGeometry