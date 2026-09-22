//region ForecastVoice
/**
 * Somebody's opinion of the weather, instead of a readout of it.
 *
 * "rain, moderate" is a fact. A party member saying they would not go up the mountain today is
 * the same fact doing something - and the forecast is the one screen in the game where a number
 * is strictly worse than a sentence.
 *
 * **Only people who are actually here speak.** A line belongs to an actor, and an actor who has
 * not joined the party yet has no business remarking on anything. That is also what keeps the
 * screen feeling like it belongs to whoever is travelling with you rather than to the UI.
 *
 * Lines are keyed by look, then optionally by strength. A look that writes only `any` uses those
 * lines at every strength, so an author owes fifteen states rather than forty-five up front and
 * can split the ones where a drizzle and a downpour genuinely want different words.
 */
class ForecastVoice
{
  /**
   * The key holding lines that suit a look at any strength.
   * @type {string}
   */
  static Any = 'any';

  /**
   * The key holding lines for somewhere with no weather at all.
   * @type {string}
   */
  static Sheltered = 'none';

  /**
   * Every line written for a given weather, whoever says them.
   * @param {object} voices The `voices` block of the sky configuration.
   * @param {?{preset: string, intensity: string}} weather What is falling, or null for nothing.
   * @returns {{who: number, says: string}[]} The lines, or an empty list when none are written.
   */
  static linesFor(voices, weather)
  {
    const key = weather === null
      ? ForecastVoice.Sheltered
      : weather.preset;

    const written = voices[key];

    // nothing written for this look yet, which is an ordinary state of a game in progress rather
    // than a fault. The window falls back to the plain reading.
    if (written === undefined) return [];

    if (weather !== null && written[weather.intensity] !== undefined) return written[weather.intensity];

    if (written[ForecastVoice.Any] !== undefined) return written[ForecastVoice.Any];

    return [];
  }

  /**
   * The lines belonging to people who are actually travelling with the player.
   * @param {{who: number, says: string}[]} lines Every line written for this weather.
   * @param {number[]} presentIds The actor ids currently in the party.
   * @returns {{who: number, says: string}[]}
   */
  static spokenBy(lines, presentIds)
  {
    return lines.filter(line => presentIds.includes(line.who));
  }

  /**
   * Picks one line.
   *
   * Rolled rather than cycled, because a screen a player opens constantly wants to not be the
   * same screen every time, and a rotation is something they would eventually learn the order of.
   * @param {{who: number, says: string}[]} lines The lines available.
   * @param {number} roll A roll in [0, 1).
   * @returns {?{who: number, says: string}} One line, or null when there were none.
   */
  static pick(lines, roll)
  {
    if (lines.length === 0) return null;

    // floating point can hand back exactly one, which would index past the end.
    const index = Math.min(Math.floor(roll * lines.length), lines.length - 1);

    return lines[index];
  }

  /**
   * What somebody in the party has to say about the weather, if anybody does.
   * @param {object} voices The `voices` block of the sky configuration.
   * @param {?{preset: string, intensity: string}} weather What is falling, or null for nothing.
   * @param {number[]} presentIds The actor ids currently in the party.
   * @param {number} roll A roll in [0, 1).
   * @returns {?{who: number, says: string}} A remark, or null when nobody present has one.
   */
  static remarkFor(voices, weather, presentIds, roll)
  {
    const written = ForecastVoice.linesFor(voices, weather);
    const available = ForecastVoice.spokenBy(written, presentIds);

    return ForecastVoice.pick(available, roll);
  }
}

export default ForecastVoice;
//endregion ForecastVoice