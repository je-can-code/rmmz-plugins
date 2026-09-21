//region ForecastDigest
import SkyForecast from './SkyForecast.js';
import SkyStates from './SkyStates.js';

/**
 * What the forecast says, as a player is told it.
 *
 * **This is the sky over Raevula, and only that.** Erocia has one weather system and one town left
 * standing on it, so there is exactly one forecast and no way for anybody to check the sky
 * somewhere they are not. The diagnostic screen breaks it down by destination; this deliberately
 * does not, both because the player has no in-world way to know that and because a menu naming the
 * Negative Peaks tells them the Negative Peaks exist.
 *
 * Two grains, because a player asks two different questions. *What is the rest of today doing* is
 * answered phase by phase. *Is this week worth travelling in* is answered at a glance, three
 * readings a day across a week, because nobody is planning around the difference between dawn and
 * morning seven days out.
 */
class ForecastDigest
{
  /**
   * How many phases a day holds.
   * @type {number}
   */
  static PhasesPerDay = 6;

  /**
   * The phases a week's overview samples, when the config names none.
   *
   * Three readings rather than six: morning, midday and evening is the shape of a day at the
   * distance a week is read from, and doubling the cells buys nothing but width.
   * @type {number[]}
   */
  static DefaultWeekPhases = [ 1, 3, 4 ];

  /**
   * How many days a week's overview covers, when the config names none.
   * @type {number}
   */
  static DefaultWeekDays = 7;

  /**
   * What the sky over Raevula is at one phase.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {?{preset: string, intensity: string, type: string}} The sky, or null when the
   * forecast does not reach that far.
   */
  static skyAt(sky, forecast, absolutePhase)
  {
    const state = SkyForecast.stateAt(forecast, absolutePhase);

    if (state === null) return null;

    const seasonName = SkyForecast.seasonNameOf(absolutePhase);
    const phaseOfDay = SkyForecast.phaseOfDay(absolutePhase);

    return {
      preset: SkyStates.faceFor(sky, state.type, seasonName, phaseOfDay),
      intensity: state.intensity,
      type: state.type,
    };
  }

  /**
   * The rest of today, phase by phase.
   *
   * The whole day rather than only what is left of it, because a forecast that shortens as the day
   * wears on gives the player a different-shaped screen every time they open it, and because what
   * the morning *was* is useful context for reading what the evening will be.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} nowPhase The phase the clock has reached.
   * @returns {{startPhase: number, nowColumn: number, entries: object[]}}
   */
  static today(sky, forecast, nowPhase)
  {
    const dayStart = SkyForecast.startOfDay(nowPhase);
    const entries = [];

    for (let phaseOfDay = 0; phaseOfDay < ForecastDigest.PhasesPerDay; phaseOfDay++)
    {
      entries.push({
        phaseOfDay,
        sky: ForecastDigest.skyAt(sky, forecast, dayStart + phaseOfDay),
      });
    }

    return {
      startPhase: dayStart,
      nowColumn: nowPhase - dayStart,
      entries,
    };
  }

  /**
   * Which phases a week's overview samples.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @returns {number[]}
   */
  static weekPhasesOf(sky)
  {
    if (sky.weekPhases === undefined) return ForecastDigest.DefaultWeekPhases;

    return sky.weekPhases;
  }

  /**
   * How many days a week's overview covers.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @returns {number}
   */
  static weekDaysOf(sky)
  {
    if (sky.weekDays === undefined) return ForecastDigest.DefaultWeekDays;

    return sky.weekDays;
  }

  /**
   * The week ahead, sampled a few readings a day.
   *
   * **No strength.** At this distance the useful question is whether a day is wet or clear, and a
   * second mark per cell to say how wet turns a glanceable week into something that has to be
   * studied. Today's view carries the detail.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} nowPhase The phase the clock has reached.
   * @returns {{phases: number[], days: object[]}}
   */
  static week(sky, forecast, nowPhase)
  {
    const dayStart = SkyForecast.startOfDay(nowPhase);
    const phases = ForecastDigest.weekPhasesOf(sky);
    const days = [];

    for (let dayOffset = 0; dayOffset < ForecastDigest.weekDaysOf(sky); dayOffset++)
    {
      const start = dayStart + (dayOffset * ForecastDigest.PhasesPerDay);

      days.push({
        dayOffset,
        startPhase: start,
        cells: phases.map(phaseOfDay => ForecastDigest.presetAt(sky, forecast, start + phaseOfDay)),
      });
    }

    return {
      phases,
      days,
    };
  }

  /**
   * Just the look at one phase, for a view that shows nothing else.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {?string} The preset name, or null when the forecast does not reach that far.
   */
  static presetAt(sky, forecast, absolutePhase)
  {
    const resolved = ForecastDigest.skyAt(sky, forecast, absolutePhase);

    if (resolved === null) return null;

    return resolved.preset;
  }
}

export default ForecastDigest;
//endregion ForecastDigest