//region SkyForecast
import SkyStates from './SkyStates.js';
import SkyWalk from './SkyWalk.js';

/**
 * The calendar the sky is walked across, and the window of it that is kept.
 *
 * A forecast is a flat run of states with a phase number attached to the front of it. Everything
 * else here is the arithmetic that turns a date into an index into that run, and back.
 *
 * **Rolling the whole thing ahead rather than a phase at a time is the entire point.** A forecast
 * the player can read has to already exist; one rolled on arrival is a prediction of a thing that
 * has not been decided, which is just a lie with extra steps. Deciding it up front also means the
 * forecast cannot change out from under somebody who wrote it down.
 *
 * **States are stored by name, not by number.** A numeric id would shave the slice from roughly
 * thirty-five kilobytes to eight, and would cost a `skyTypeIds` block that has to be maintained in
 * lockstep with the types and never renumbered - which is the exact hazard `presetIds` exists to
 * warn about. There is also no author-facing reason to number sky types at all: the page tags key
 * on presets. A save that is self-describing and immune to somebody reordering the config is worth
 * far more than the bytes.
 *
 * **Everything here is pure.** No clock, no globals, and the rolls are handed in.
 */
class SkyForecast
{
  /**
   * The months belonging to each season, indexed by the season id J-TIME publishes.
   *
   * This mirrors `Game_Time.seasonOfYear`, which cannot simply be called: it is an instance method
   * on a global that may not exist yet, and a forecast reasons about months the clock has not
   * reached. Winter wrapping the year boundary is the part worth staring at - seasons do **not**
   * sit on calendar quarters, and every off-by-one in this file traces back to assuming they do.
   * @type {number[][]}
   */
  static SeasonMonths = [
    [ 3, 4, 5 ],
    [ 6, 7, 8 ],
    [ 9, 10, 11 ],
    [ 12, 1, 2 ],
  ];

  /**
   * Days in a month, matching `Game_Time.daysPerMonth`.
   * @type {number}
   */
  static DaysPerMonth = 30;

  /**
   * Months in a year, matching `Game_Time.monthsPerYear`.
   * @type {number}
   */
  static MonthsPerYear = 12;

  /**
   * Phases in a day, matching the six four-hour buckets of `TimePhases`.
   * @type {number}
   */
  static PhasesPerDay = 6;

  /**
   * Days in a week, matching the seven `Time_Snapshot` names them.
   * @type {number}
   */
  static DaysPerWeek = 7;

  /**
   * The answer handed back for a date that is not on the clock.
   *
   * `TimePhases.phaseOfHour` reports an hour off the 24-hour face as `-1`, and the clock can
   * genuinely hold one - `setTime` writes the hour straight through without constraining it. That
   * propagates through here rather than being silently rounded into a real phase.
   * @type {number}
   */
  static OffClock = -1;

  /**
   * Days in a year.
   * @returns {number}
   */
  static daysPerYear()
  {
    return SkyForecast.DaysPerMonth * SkyForecast.MonthsPerYear;
  }

  /**
   * Phases in a year, which is the natural length of a full forecast.
   * @returns {number}
   */
  static phasesPerYear()
  {
    return SkyForecast.daysPerYear() * SkyForecast.PhasesPerDay;
  }

  /**
   * The last month of each season, which is where a season hands over.
   *
   * Derived from {@link SkyForecast.SeasonMonths} rather than written out, because a second
   * hand-written list of months is a second thing to get wrong - and this is the exact list that
   * was got wrong in design, as 3/6/9/12 rather than 5/8/11/2.
   * @returns {number[]}
   */
  static settlingMonths()
  {
    return SkyForecast.SeasonMonths.map(months => months[months.length - 1]);
  }

  /**
   * Which day of the year a date falls on.
   * @param {number} months The month, 1 through 12.
   * @param {number} days The day of the month, 1 through 30.
   * @returns {number} The day of the year, 1 through 360.
   */
  static dayOfYear(months, days)
  {
    return ((months - 1) * SkyForecast.DaysPerMonth) + days;
  }

  /**
   * A date as a single day number that only ever counts upward.
   * @param {number} years The year.
   * @param {number} months The month, 1 through 12.
   * @param {number} days The day of the month, 1 through 30.
   * @returns {number}
   */
  static absoluteDay(years, months, days)
  {
    return (years * SkyForecast.daysPerYear()) + (SkyForecast.dayOfYear(months, days) - 1);
  }

  /**
   * A date and an hour as the single phase number the forecast is indexed by.
   * @param {number} years The year.
   * @param {number} months The month, 1 through 12.
   * @param {number} days The day of the month, 1 through 30.
   * @param {number} phaseId The phase of the day, 0 through 5, or -1 for an hour off the clock.
   * @returns {number} The absolute phase, or {@link SkyForecast.OffClock}.
   */
  static absolutePhaseOf(years, months, days, phaseId)
  {
    // an hour that belongs to no phase produces no phase number; rounding it into a real one would
    // silently apply the wrong sky rather than doing nothing.
    if (phaseId === SkyForecast.OffClock) return SkyForecast.OffClock;

    return (SkyForecast.absoluteDay(years, months, days) * SkyForecast.PhasesPerDay) + phaseId;
  }

  /**
   * Which phase of its own day an absolute phase is.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} 0 through 5.
   */
  static phaseOfDay(absolutePhase)
  {
    return absolutePhase % SkyForecast.PhasesPerDay;
  }

  /**
   * The phase a given phase's own day begins on.
   * @param {number} absolutePhase Any phase of the day in question.
   * @returns {number}
   */
  static startOfDay(absolutePhase)
  {
    return absolutePhase - SkyForecast.phaseOfDay(absolutePhase);
  }

  /**
   * Which day of the year an absolute phase falls on, counting from zero.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} 0 through 359.
   */
  static dayIndexOf(absolutePhase)
  {
    const day = Math.floor(absolutePhase / SkyForecast.PhasesPerDay);

    return day % SkyForecast.daysPerYear();
  }

  /**
   * Which day of the week an absolute phase falls on.
   *
   * Counted from the absolute day rather than the day of the *year*, so the week runs on through
   * new year's day instead of restarting - three hundred and sixty days is not a whole number of
   * weeks, and a calendar that quietly repeated a weekday every December would be the sort of
   * thing somebody notices a year after it shipped.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} 0 through 6, counting from Monday as `Time_Snapshot` does.
   */
  static dayOfWeekIdOf(absolutePhase)
  {
    const day = Math.floor(absolutePhase / SkyForecast.PhasesPerDay);

    return day % SkyForecast.DaysPerWeek;
  }

  /**
   * Which month an absolute phase falls in.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} The month, 1 through 12.
   */
  static monthOf(absolutePhase)
  {
    return Math.floor(SkyForecast.dayIndexOf(absolutePhase) / SkyForecast.DaysPerMonth) + 1;
  }

  /**
   * Which day of its month an absolute phase falls on.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} The day, 1 through 30.
   */
  static dayOfMonthOf(absolutePhase)
  {
    return (SkyForecast.dayIndexOf(absolutePhase) % SkyForecast.DaysPerMonth) + 1;
  }

  /**
   * Which season an absolute phase falls in.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {number} The season id, 0 through 3.
   */
  static seasonIdOf(absolutePhase)
  {
    const month = SkyForecast.monthOf(absolutePhase);

    return SkyForecast.SeasonMonths.findIndex(months => months.includes(month));
  }

  /**
   * The name of the season an absolute phase falls in.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {string} The lowercase season name.
   */
  static seasonNameOf(absolutePhase)
  {
    return SkyStates.seasonNameOf(SkyForecast.seasonIdOf(absolutePhase));
  }

  /**
   * Whether a phase falls on the day a season hands over to the next.
   *
   * The last day of a season rather than the first day of the next, so the handover has a whole
   * day - six phases - to walk down to something neutral. Starting spring out of a blizzard is
   * what this exists to prevent, and it cannot be prevented from inside spring.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {boolean}
   */
  static isSettling(absolutePhase)
  {
    if (SkyForecast.dayOfMonthOf(absolutePhase) !== SkyForecast.DaysPerMonth) return false;

    return SkyForecast.settlingMonths()
      .includes(SkyForecast.monthOf(absolutePhase));
  }

  /**
   * Everything the walk needs to know about when a phase is.
   *
   * Gathered into one object rather than handed over as three arguments, because the three are one
   * fact and they are always wanted together.
   * @param {number} absolutePhase The phase being described.
   * @returns {{season: string, month: number, isSettling: boolean}}
   */
  static momentOf(absolutePhase)
  {
    return {
      season: SkyForecast.seasonNameOf(absolutePhase),
      month: SkyForecast.monthOf(absolutePhase),
      isSettling: SkyForecast.isSettling(absolutePhase),
    };
  }

  /**
   * An empty forecast, starting at a given phase.
   * @param {number} startPhase The absolute phase index 0 will represent.
   * @returns {{startPhase: number, types: string[], intensities: string[]}}
   */
  static empty(startPhase)
  {
    return {
      startPhase,
      types: [],
      intensities: [],
    };
  }

  /**
   * Whether a forecast holds an answer for a given phase.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {boolean}
   */
  static covers(forecast, absolutePhase)
  {
    if (absolutePhase < forecast.startPhase) return false;

    return absolutePhase < (forecast.startPhase + forecast.types.length);
  }

  /**
   * What the sky is doing at a given phase.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {?{type: string, intensity: string}} The state, or null when it is outside the window.
   */
  static stateAt(forecast, absolutePhase)
  {
    if (SkyForecast.covers(forecast, absolutePhase) === false) return null;

    const index = absolutePhase - forecast.startPhase;

    return {
      type: forecast.types[index],
      intensity: forecast.intensities[index],
    };
  }

  /**
   * The last state a forecast holds, which is where any extension of it carries on from.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @returns {{type: string, intensity: string}} The final state, or a neutral one when empty.
   */
  static lastState(sky, forecast)
  {
    const last = forecast.types.length - 1;

    // nothing has been rolled yet, so the walk starts from the same neutral state a season handover
    // leaves behind - which is a condition every season permits, by construction.
    if (last < 0)
    {
      return {
        type: sky.settleTo,
        intensity: SkyStates.Ladder[1],
      };
    }

    return {
      type: forecast.types[last],
      intensity: forecast.intensities[last],
    };
  }

  /**
   * Walks the sky forward until the forecast reaches a given phase.
   *
   * Appends rather than replaces, so extending a window costs only the phases actually added and a
   * forecast somebody has already read never changes underneath them.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} throughPhase The last phase that must be covered, inclusive.
   * @param {function(): {type: number, intensity: number}} rollFor A fresh pair of rolls per phase.
   * @returns {{startPhase: number, types: string[], intensities: string[]}} The same forecast.
   */
  static extendThrough(sky, forecast, throughPhase, rollFor)
  {
    let state = SkyForecast.lastState(sky, forecast);
    let phase = forecast.startPhase + forecast.types.length;

    while (phase <= throughPhase)
    {
      state = SkyWalk.next(sky, state, SkyForecast.momentOf(phase), rollFor());

      forecast.types.push(state.type);
      forecast.intensities.push(state.intensity);

      phase++;
    }

    return forecast;
  }

  /**
   * Drops the phases that have already been lived through.
   *
   * Without this the arrays only ever grow: six entries per game day, which at Chef Adventure's
   * tick rate is six per two and a half hours of play. Trimming as the window rolls is what keeps
   * the saved slice a flat size for the life of a file rather than a log of everything that ever
   * happened.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} fromPhase The earliest phase worth keeping.
   * @returns {{startPhase: number, types: string[], intensities: string[]}} The same forecast.
   */
  static trimBefore(forecast, fromPhase)
  {
    const dropped = fromPhase - forecast.startPhase;

    // nothing has elapsed yet, or the window already starts later than asked.
    if (dropped <= 0) return forecast;

    forecast.types.splice(0, dropped);
    forecast.intensities.splice(0, dropped);
    forecast.startPhase = fromPhase;

    return forecast;
  }

  /**
   * Brings a forecast up to date around a given phase, rebuilding it when it cannot be stretched.
   *
   * **A backward jump regenerates rather than extends.** The only way to move the clock backward is
   * a debug jump, and re-rolling days already lived through is the honest answer to it - the
   * forecast's promise is that what it says about the *future* does not change, and a rewind has no
   * future to disturb.
   * **Both ends are given explicitly** rather than as a point and a length, because they are not
   * the same point. The window is trimmed to the start of the *day* rather than to the current
   * phase, so the hours already gone are still there to be shown - a forecast screen listing the
   * whole of today would otherwise render this morning as blanks. Five spare phases is nothing;
   * a day view full of gaps is not.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} keepFrom The earliest phase worth keeping.
   * @param {number} throughPhase The last phase that must be covered, inclusive.
   * @param {function(): {type: number, intensity: number}} rollFor A fresh pair of rolls per phase.
   * @returns {{startPhase: number, types: string[], intensities: string[]}} The current forecast.
   */
  static ensureCovers(sky, forecast, keepFrom, throughPhase, rollFor)
  {
    const usable = keepFrom >= forecast.startPhase
      ? forecast
      : SkyForecast.empty(keepFrom);

    SkyForecast.trimBefore(usable, keepFrom);

    return SkyForecast.extendThrough(sky, usable, throughPhase, rollFor);
  }
}

export default SkyForecast;
//endregion SkyForecast