//region MessageGlyphRunSplitter
import MessageGlyph from '../__models/MessageGlyph.js';

/**
 * Turns one buffered run of message text into individually addressable glyphs.
 *
 * The engine buffers characters as it walks a message and only draws when it hits a control
 * character, so what arrives here is a whole run in one piece- "the innkeeper says" rather than
 * sixteen separate letters. Splitting it is what makes per-letter motion possible at all, and
 * getting the arithmetic right is the difference between a pipeline nobody notices and one that
 * quietly reflows every line of dialogue in the game.
 *
 * **Positions come from cumulative prefix measurement, never from summing character widths.**
 * A canvas measures a string as it would actually render it, kerning included, so the width of
 * "AV" is not the width of "A" plus the width of "V"- the pair is tucked together and the real
 * answer is smaller. Sum the parts and every word in the game grows by a fraction of a pixel per
 * letter, which is invisible on any single word and obvious across a paragraph. Measuring the
 * prefix instead asks the same question the engine asks, so glyph three sits exactly where the
 * engine would have drawn it, and the run's total advance is unchanged.
 *
 * The measuring function is a parameter rather than a reach for `Bitmap.measureTextWidth` because
 * this is the one rule in the pipeline that cannot be confirmed by reading: an implementation that
 * sums and an implementation that measures prefixes agree on every one- and two-character run, and
 * only diverge from the third character of a kerned pair onward. Injecting the measurement is what
 * lets a test supply a font where kerning demonstrably exists.
 */
class MessageGlyphRunSplitter
{
  /**
   * Splits a run of text into one glyph per character.
   * @param {string} run The buffered run, exactly as the engine accumulated it.
   * @param {{x: number, y: number, index: number}} origin Where the run begins, and the message's
   * running glyph count at that point.
   * @param {MessageGlyphStyle} style The font, colour and effect state in force for this run.
   * @param {function(string): number} measure Measures a string's rendered width in logical pixels.
   * @returns {MessageGlyph[]} One glyph per character, in reading order.
   */
  static split(run, origin, style, measure)
  {
    // spread rather than split so an astral character stays one glyph instead of two halves.
    // an empty run needs no guard of its own - it spreads to an empty list and emits nothing, which
    // is the right answer for the back-to-back flushes the engine performs between two adjacent
    // text codes.
    const characters = [ ...run ];

    const glyphs = [];

    // the prefix grows one character at a time, and its measured width is both this glyph's
    // starting offset and the running total. measuring the prefix rather than the character is
    // what preserves kerning.
    let prefix = String.empty;
    let prefixWidth = 0;

    characters.forEach((character, offset) =>
    {
      const grownPrefix = prefix + character;
      const grownWidth = measure(grownPrefix);

      // the difference between two prefixes is this character's real advance in context.
      const advance = grownWidth - prefixWidth;

      const glyph = MessageGlyph.forCharacter(
        character,
        origin.x + prefixWidth,
        origin.y,
        advance,
        origin.index + offset,
        style);
      glyphs.push(glyph);

      prefix = grownPrefix;
      prefixWidth = grownWidth;
    });

    return glyphs;
  }
}

export default MessageGlyphRunSplitter;
//endregion MessageGlyphRunSplitter