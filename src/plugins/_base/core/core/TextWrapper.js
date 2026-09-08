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
 */
class TextWrapper
{
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
}

export default TextWrapper;
//endregion TextWrapper