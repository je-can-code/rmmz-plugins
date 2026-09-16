//region MessageGlyphModulation
/**
 * What one frame's worth of effects does to a single glyph.
 *
 * The deliberate shape here is that a modulation is a *difference*, never a position. A glyph
 * already knows where it belongs - the splitter measured that once and it does not change - so an
 * effect that returned coordinates would have to be told the layout in order to perturb it, and two
 * effects on the same glyph could not both be right. Offsets compose; positions do not.
 *
 * Tint is the exception and is deliberately nullable, which is the one place this class admits a
 * null at all. A glyph has a colour of its own from `\C[n]`, and most effects have no opinion about
 * it; "no opinion" has to be distinguishable from "black", and zero is a real colour.
 */
class MessageGlyphModulation
{
  /**
   * How far to displace the glyph horizontally this frame, in logical pixels.
   * @type {number}
   */
  offsetX = 0;

  /**
   * How far to displace the glyph vertically this frame, in logical pixels.
   * @type {number}
   */
  offsetY = 0;

  /**
   * The colour to override the glyph's own with this frame, or null to leave it alone.
   * @type {number|null}
   */
  tint = null;

  /**
   * How much larger or smaller than its drawn size the glyph appears this frame.
   *
   * A multiplier rather than a size, for the same reason the offsets are differences: two effects
   * that both have an opinion about size can be combined, where two absolute sizes could only
   * argue. One is "exactly as drawn", which is what a glyph nothing is acting on gets.
   * @type {number}
   */
  scale = 1;

  /**
   * Builds one frame's modulation.
   * @param {number} offsetX How far to displace the glyph horizontally.
   * @param {number} offsetY How far to displace the glyph vertically.
   * @param {?number} tint The colour to override with, or null to leave the glyph's own alone.
   * @param {number} scale How much larger or smaller than drawn the glyph appears.
   */
  constructor(offsetX = 0, offsetY = 0, tint = null, scale = 1)
  {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tint = tint;
    this.scale = scale;
  }

  /**
   * The modulation that changes nothing.
   *
   * What a glyph carrying no effects at all receives, and the seed every composition starts from.
   * @returns {MessageGlyphModulation}
   */
  static none()
  {
    return new MessageGlyphModulation(0, 0, null, 1);
  }

  /**
   * Combines several modulations into the one the renderer actually applies.
   *
   * Offsets sum, because two effects displacing the same glyph both mean it - a character that
   * waves *and* trembles should do both, and summing is the only combination where neither effect
   * silently wins. Tint does not sum: colours are not displacements, and averaging two of them
   * produces a third that neither effect asked for. The last opinion expressed takes it, which
   * makes the order effects were resolved in the tiebreaker.
   *
   * Scale multiplies rather than sums, because it is a ratio: two effects each swelling a glyph by
   * a tenth should arrive at a fifth larger, and summing multipliers would double the glyph before
   * either effect had done anything at all.
   * @param {MessageGlyphModulation[]} modulations The modulations to combine, in resolution order.
   * @returns {MessageGlyphModulation}
   */
  static compose(modulations)
  {
    const combined = MessageGlyphModulation.none();

    modulations.forEach(modulation =>
    {
      combined.offsetX += modulation.offsetX;
      combined.offsetY += modulation.offsetY;
      combined.scale *= modulation.scale;

      // a modulation with no colour opinion leaves whatever opinion came before it standing.
      if (modulation.tint !== null)
      {
        combined.tint = modulation.tint;
      }
    });

    return combined;
  }
}

export default MessageGlyphModulation;
//endregion MessageGlyphModulation