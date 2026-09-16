//region ChatterLinePicker
/**
 * Chooses which of a character's lines they say next.
 *
 * Random, but never the same line twice in a row. Pure chance over a pool of three will say the same
 * thing twice often enough that a player standing still hears it within a minute, and a repeat is
 * the single loudest way an ambient system announces that it is a system.
 *
 * The random source is injected so the choice can be pinned in a test. `Math.random` is the one the
 * game passes.
 */
class ChatterLinePicker
{
  /**
   * Picks the next line from a character's pool.
   * @param {string[]} lines The character's pool, which the caller has already confirmed is not empty.
   * @param {string} previous The line this character said last, or empty if they have not spoken.
   * @param {function(): number} random A source of numbers from zero up to but excluding one.
   * @returns {string}
   */
  static pick(lines, previous, random)
  {
    const candidates = lines.filter(line => line !== previous);

    // a pool of one, or a pool an author filled with the same line several times. Repeating is the
    // only thing left to do, and it is what they asked for by writing only the one thing.
    if (candidates.length === 0)
    {
      const [ only ] = lines;

      return only;
    }

    const index = Math.floor(random() * candidates.length);

    return candidates[index];
  }
}

export default ChatterLinePicker;
//endregion ChatterLinePicker