//region ForecastWhen
import SkyForecast from './SkyForecast.js';

/**
 * How the forecast says *when* it is talking about.
 *
 * Three screens each need a slightly different amount of the same answer - the week wants a
 * weekday and a date, today wants the season too, and here-and-now wants the clock on top of all
 * of it. Building the strings here rather than in each window is what stops those three drifting
 * into three date formats, and it is the only way any of this gets tested: `windows/**` is not
 * measured, and a date format is exactly the sort of thing that is wrong by one somewhere.
 *
 * Seasons come back as the `\seasonOfYear[]` text code rather than a word, so the season arrives
 * with the icon and colour J-TIME already gives it everywhere else in the game. The two plugins
 * happen to number the seasons identically - spring is zero in both `SkyStates.Seasons` and
 * `Time_Snapshot.SeasonsName` - so the forecast's own id can be handed straight over.
 */
class ForecastWhen
{
  /**
   * What day of the week a phase falls on.
   * @param {number} absolutePhase The phase being described.
   * @returns {string} The weekday's name.
   */
  static weekdayOf(absolutePhase)
  {
    const dayOfWeekId = SkyForecast.dayOfWeekIdOf(absolutePhase);

    return Time_Snapshot.DaysOfWeekName(dayOfWeekId);
  }

  /**
   * A phase's date, without its season.
   * @param {number} absolutePhase The phase being described.
   * @returns {string} Something like `Thursday, Day 30 of Month 5`.
   */
  static dateOf(absolutePhase)
  {
    const weekday = ForecastWhen.weekdayOf(absolutePhase);
    const day = SkyForecast.dayOfMonthOf(absolutePhase);
    const month = SkyForecast.monthOf(absolutePhase);

    return `${weekday}, Day ${day} of Month ${month}`;
  }

  /**
   * A phase's season, as the text code that draws it with its own icon.
   * @param {number} absolutePhase The phase being described.
   * @returns {string} A `\seasonOfYear[]` code.
   */
  static seasonOf(absolutePhase)
  {
    const seasonId = SkyForecast.seasonIdOf(absolutePhase);

    return `\\seasonOfYear[${seasonId}]`;
  }

  /**
   * A phase's date and season together, ready for `drawTextEx`.
   * @param {number} absolutePhase The phase being described.
   * @returns {string} Something like `Thursday, Day 30 of Month 5 - \seasonOfYear[0]`.
   */
  static dateLineOf(absolutePhase)
  {
    return `${ForecastWhen.dateOf(absolutePhase)} - ${ForecastWhen.seasonOf(absolutePhase)}`;
  }

  /**
   * A phase's time of day, as the text code that draws it with its own icon.
   * @param {number} absolutePhase The phase being described.
   * @returns {string} A `\timeOfDay[]` code.
   */
  static phaseOf(absolutePhase)
  {
    return `\\timeOfDay[${SkyForecast.phaseOfDay(absolutePhase)}]`;
  }

  /**
   * The clock, as two padded figures.
   *
   * Padded because an unpadded clock reads as a decimal - `9:5` is not five past nine to anybody
   * glancing at it - and this is a line somebody glances at.
   * @param {number} hours The hour being shown.
   * @param {number} minutes The minute being shown.
   * @returns {string} Something like `09:05`.
   */
  static clockOf(hours, minutes)
  {
    const paddedHours = String(hours)
      .padStart(2, '0');
    const paddedMinutes = String(minutes)
      .padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}`;
  }

  /**
   * Everything the here-and-now view says about when it is, on one line.
   * @param {number} absolutePhase The phase being described.
   * @param {number} hours The hour being shown.
   * @param {number} minutes The minute being shown.
   * @returns {string} Ready for `drawTextEx`.
   */
  static nowLineOf(absolutePhase, hours, minutes)
  {
    const clock = ForecastWhen.clockOf(hours, minutes);
    const phase = ForecastWhen.phaseOf(absolutePhase);

    return `${ForecastWhen.dateLineOf(absolutePhase)} - ${clock} ${phase}`;
  }
}

export default ForecastWhen;
//endregion ForecastWhen