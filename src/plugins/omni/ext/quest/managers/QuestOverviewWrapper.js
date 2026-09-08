//region QuestOverviewWrapper
/**
 * Breaks a quest overview into lines that fit a measured width.
 *
 * An overview is authored as one paragraph, with the occasional deliberate line break, and the pane it
 * lands in is whatever width the layout hands it that day. Breaking by character count only ever fits
 * one font at one width, which is how the questopedia came to run its text off the right edge of the
 * screen. So the caller hands over the measurement- a predicate answering whether a candidate line
 * fits- and this decides where the breaks go without knowing anything about pixels or fonts.
 */
class QuestOverviewWrapper
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
   * Breaks the overview into lines, each of which satisfies the given fit predicate.
   *
   * A blank token- what a doubled space or a newline in the source becomes once split on
   * whitespace- is an authored line break and ends the line in progress. Two blanks in a row still
   * yield only one empty line, because a paragraph gap is a paragraph gap however many times it was
   * typed.
   * @param {string} overview The paragraph to break into lines.
   * @param {function(string): boolean} fits Answers whether a candidate line fits the available width.
   * @returns {string[]}
   */
  static wrap(overview, fits)
  {
    const lines = [];
    let currentLine = String.empty;

    overview.split(/\s/)
      .forEach(word =>
      {
        // a blank token is an authored line break rather than a word.
        if (word === String.empty)
        {
          currentLine = QuestOverviewWrapper._breakLine(lines, currentLine);
          return;
        }

        // the first word of a line stands alone; every later one is tried with a space in front.
        const candidate = currentLine === String.empty
          ? word
          : `${currentLine} ${word}`;

        // a candidate that fits simply becomes the line in progress.
        if (fits(candidate))
        {
          currentLine = candidate;
          return;
        }

        // the word does not fit on this line, so the line is finished and the word opens the next one.
        // a line that was still empty means the word alone is wider than the pane, and there is nothing
        // to do about that but let it overrun on its own line.
        if (currentLine !== String.empty)
        {
          lines.push(currentLine);
        }

        currentLine = word;
      });

    // whatever was still in progress is the final line.
    if (currentLine !== String.empty)
    {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Finishes the line in progress at an authored break and inserts the gap it asked for.
   * @param {string[]} lines The lines finished so far, which this appends to.
   * @param {string} currentLine The line in progress.
   * @returns {string} The new, empty line in progress.
   */
  static _breakLine(lines, currentLine)
  {
    // the line in progress is finished, if there was one.
    if (currentLine !== String.empty)
    {
      lines.push(currentLine);
    }

    // a gap is only added when the previous line was not already a gap.
    const lastLine = lines.at(-1);
    if (lastLine !== String.empty)
    {
      lines.push(String.empty);
    }

    return String.empty;
  }
}

export default QuestOverviewWrapper;
//endregion QuestOverviewWrapper