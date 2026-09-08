//region QuestNameTruncator
/**
 * Shortens a quest name until it fits a measured width, marking the cut with an ellipsis.
 *
 * The quest list draws a tracking marker at the right edge of a row, and the engine paints a
 * command's name at full length underneath it. A name that runs into the marker is unreadable in
 * exactly the rows the player cares most about- the ones they chose to track- so the list reserves
 * the marker's room and asks this to make the name respect it. Words are dropped from the end rather
 * than characters, because a name may carry escape codes and a cut inside one corrupts the draw.
 */
class QuestNameTruncator
{
  /**
   * The mark appended to a shortened name.
   * @type {string}
   */
  static ELLIPSIS = '…';

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Shortens the name by whole words until the fit predicate accepts it.
   *
   * A name that fits is returned untouched, so short names carry no ellipsis. A single word that
   * still does not fit is returned with the ellipsis anyway: there is nothing left to drop, and an
   * overrun is more honest than an empty row.
   * @param {string} name The name to fit.
   * @param {function(string): boolean} fits Answers whether a candidate fits the available width.
   * @returns {string}
   */
  static fit(name, fits)
  {
    // the common case: nothing to do.
    if (fits(name)) return name;

    const words = name.split(' ');

    // drop words off the end until what remains fits with the mark, or only one word is left.
    while (words.length > 1)
    {
      words.pop();

      const candidate = `${words.join(' ')}${QuestNameTruncator.ELLIPSIS}`;

      if (fits(candidate)) return candidate;
    }

    // nothing more can be dropped; the mark still says the name was cut.
    return `${words.at(0)}${QuestNameTruncator.ELLIPSIS}`;
  }
}

export default QuestNameTruncator;
//endregion QuestNameTruncator