//region TextWrapper
/**
 * Breaks a run of text into lines that fit a given width.
 *
 * Windows draw text; they do not decide where a sentence should break, and a window that measured and
 * split inline would put layout logic somewhere no test can reach. The measuring itself stays with the
 * caller, passed in, because only the window knows its own font.
 *
 * Words longer than the width are not broken. A word that cannot fit gets a line to itself and
 * overflows it, which is visibly wrong at a glance and therefore fixable, where a silently chopped
 * word would read as a typo in the content.
 *
 * Text codes ride along with the word they are written against, since none of them holds a space. Every
 * line is drawn on its own and starts plain, so {@link TextWrapper.wrapStyled} picks a color or bold back
 * up on the line after the break that cut through it.
 */
class TextWrapper
{
  /**
   * A text code setting the color of what follows it.
   *
   * <pre>
   * Structure:
   *  \C[COLOR_INDEX]
   *
   * Example:
   *  \C[2]critical hits\C[0]
   *
   * Translation:
   *  "critical hits" in color 2, then the default color again.
   * </pre>
   * @type {RegExp}
   */
  static ColorCodePattern = /\\C\[(\d+)]/gi;

  /**
   * The text code toggling bold on or off.
   *
   * <pre>
   * Structure:
   *  \*
   *
   * Example:
   *  \*GUARANTEED\*
   *
   * Translation:
   *  "GUARANTEED" in bold, then regular weight again.
   * </pre>
   * @type {RegExp}
   */
  static BoldCodePattern = /\\\*/g;

  /**
   * The text code toggling bold, as it is written.
   * @type {string}
   */
  static BoldCode = '\\*';

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Breaks the given text into lines no wider than the given width.
   * @param {string} text The text being wrapped.
   * @param {number} maxWidth The width a line may occupy.
   * @param {function(string): number} measure Answers the rendered width of a candidate line.
   * @returns {string[]} One entry per line; empty when there was nothing to wrap.
   */
  static wrap(text, maxWidth, measure)
  {
    const trimmed = text.trim();

    if (trimmed === String.empty) return [];

    const words = trimmed.split(/\s+/);
    const lines = [];
    let current = String.empty;

    words.forEach(word =>
    {
      const candidate = current === String.empty
        ? word
        : `${current} ${word}`;

      if (measure(candidate) <= maxWidth)
      {
        current = candidate;

        return;
      }

      // the word does not fit beside what is already here, so it starts the next line instead.
      if (current !== String.empty) lines.push(current);

      current = word;
    });

    lines.push(current);

    return lines;
  }

  /**
   * Breaks the given text into at most the given number of lines, shrinking nothing and dropping
   * nothing: any remainder is folded onto the final line, which will overflow.
   *
   * Overflowing is the deliberate choice over truncating. A clipped sentence reads as finished and
   * misinforms, where a line running past its window reads as a layout problem and gets fixed.
   * @param {string} text The text being wrapped.
   * @param {number} maxWidth The width a line may occupy.
   * @param {number} maxLines The number of lines available.
   * @param {function(string): number} measure Answers the rendered width of a candidate line.
   * @returns {string[]}
   */
  static wrapToLines(text, maxWidth, maxLines, measure)
  {
    const lines = TextWrapper.wrap(text, maxWidth, measure);

    if (lines.length <= maxLines) return lines;

    const kept = lines.slice(0, maxLines - 1);
    const remainder = lines.slice(maxLines - 1)
      .join(' ');

    kept.push(remainder);

    return kept;
  }

  /**
   * Breaks the given text into lines no wider than the given width, as {@link TextWrapper.wrap} does, and starts
   * each line with whatever color or bold the line before it left open.
   *
   * Every line is drawn on its own, and drawing starts plain, so without this a colored phrase broken across two
   * lines would lose its color partway through, and a bold one its weight.
   *
   * Lines are measured before anything is carried onto them. A color costs no width, but bold does, so a bold phrase
   * cut by a break may draw its second line a little wider than it was measured.
   * @param {string} text The text being wrapped, text codes and all.
   * @param {number} maxWidth The width a line may occupy.
   * @param {function(string): number} measure Answers the rendered width of a candidate line.
   * @returns {string[]} One entry per line; empty when there was nothing to wrap.
   */
  static wrapStyled(text, maxWidth, measure)
  {
    const lines = TextWrapper.wrap(text, maxWidth, measure);

    // whatever the line before left open, which the next one picks back up.
    let carried = String.empty;

    return lines.map(line =>
    {
      const styled = `${carried}${line}`;
      carried = TextWrapper.openStyles(styled);

      return styled;
    });
  }

  /**
   * The text codes picking up where a line leaves off: the color it ends in, then bold when it ends bold. Nothing
   * at all for a line that ends plain.
   * @param {string} line A line of text, text codes and all.
   * @returns {string}
   */
  static openStyles(line)
  {
    const color = TextWrapper.#openColor(line);
    const bold = TextWrapper.#openBold(line);

    return `${color}${bold}`;
  }

  /**
   * The color code a line ends in: the last one it sets, or nothing when it sets none, or when the last one it sets
   * is the default color, 0.
   * @param {string} line A line of text, text codes and all.
   * @returns {string}
   */
  static #openColor(line)
  {
    const colorCodes = [ ...line.matchAll(TextWrapper.ColorCodePattern) ];

    // a line that sets no color leaves none open.
    if (colorCodes.length === 0) return String.empty;

    // the last color set is the one in force at the end, unless it is the default again.
    const [ code, colorIndex ] = colorCodes.at(-1);
    if (colorIndex === '0') return String.empty;

    return code;
  }

  /**
   * The bold code when a line ends bold, which is whenever it toggles bold an odd number of times.
   * @param {string} line A line of text, text codes and all.
   * @returns {string}
   */
  static #openBold(line)
  {
    const toggles = [ ...line.matchAll(TextWrapper.BoldCodePattern) ];

    // an even count turns bold back off by the end.
    if (toggles.length % 2 === 0) return String.empty;

    return TextWrapper.BoldCode;
  }
}

export default TextWrapper;
//endregion TextWrapper