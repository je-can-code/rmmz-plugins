//region ForecastTable
import ForecastPlaces from './ForecastPlaces.js';
import SkyForecast from './SkyForecast.js';
import SkyStates from './SkyStates.js';

/**
 * One day of the forecast, as a grid of what each place will actually look like.
 *
 * **The sky is not the answer a player wants.** They want to know whether to go up the mountain,
 * and the sky over Erocia being clear says nothing useful about that - the Negative Peaks are
 * snowy under a clear sky, and the Forest of Dreams is at its foggiest under one. So every row
 * here is a *destination*, resolved through the same `MapWeatherResolver.resolve` the game itself
 * runs on arrival, and the sky rides along at the top as the thing the rest are answers to.
 *
 * Everything is worked out here rather than in the window, because a window is excluded from
 * coverage and this is where the interesting mistakes would live - an off-by-one in the phase
 * columns, a place resolved against the wrong hour, a day that quietly shows yesterday.
 */
class ForecastTable
{
  /**
   * How many phases one row of the grid covers.
   * @type {number}
   */
  static Columns = 6;

  /**
   * The label the sky's own row carries.
   * @type {string}
   */
  static SkyRowName = 'Sky';

  /**
   * The answer for a phase the forecast has not rolled.
   *
   * Reachable by paging past the end of a window that was somehow not topped up, and drawn as a
   * blank rather than guessed at.
   * @type {null}
   */
  static Unknown = null;

  /**
   * Builds one day of the grid.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} nowPhase The phase the clock has actually reached.
   * @param {number} dayOffset How many days ahead of today this page is; zero is today.
   * @returns {{startPhase: number, dayOffset: number, nowColumn: number, rows: object[]}}
   */
  static build(sky, forecast, nowPhase, dayOffset)
  {
    // the grid always begins at the first phase of a day, even when the clock is midway through
    // one - a table that started at the current hour would put moontide in a different column
    // every time it was opened.
    const dayStart = SkyForecast.startOfDay(nowPhase) + (dayOffset * ForecastTable.Columns);
    const places = ForecastPlaces.resolveAll(sky.places);

    const skies = [];
    for (let column = 0; column < ForecastTable.Columns; column++)
    {
      skies.push(ForecastTable.skyAt(sky, forecast, dayStart + column));
    }

    const rows = [ ForecastTable.skyRow(skies) ];
    places.forEach(place => rows.push(ForecastTable.placeRow(place, skies)));

    return {
      startPhase: dayStart,
      dayOffset,
      nowColumn: ForecastTable.nowColumnOf(nowPhase, dayStart),
      rows,
    };
  }

  /**
   * Which column of a day's grid is the one happening right now.
   * @param {number} nowPhase The phase the clock has reached.
   * @param {number} dayStart The first phase of the day being shown.
   * @returns {number} The column, or -1 when the day being shown is not today.
   */
  static nowColumnOf(nowPhase, dayStart)
  {
    const column = nowPhase - dayStart;

    if (column < 0) return -1;

    if (column >= ForecastTable.Columns) return -1;

    return column;
  }

  /**
   * What the sky itself is doing at one phase.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{startPhase: number, types: string[], intensities: string[]}} forecast The forecast.
   * @param {number} absolutePhase The phase being asked about.
   * @returns {?{preset: string, intensity: string, type: string}} The sky, or null when the
   * forecast does not reach this far.
   */
  static skyAt(sky, forecast, absolutePhase)
  {
    const state = SkyForecast.stateAt(forecast, absolutePhase);

    if (state === null) return ForecastTable.Unknown;

    const seasonName = SkyForecast.seasonNameOf(absolutePhase);
    const phaseOfDay = SkyForecast.phaseOfDay(absolutePhase);

    return {
      preset: SkyStates.faceFor(sky, state.type, seasonName, phaseOfDay),
      intensity: state.intensity,
      type: state.type,
    };
  }

  /**
   * The row describing the sky over the island.
   * @param {?object[]} skies What the sky is doing at each phase of the day.
   * @returns {{name: string, cells: ?object[]}}
   */
  static skyRow(skies)
  {
    return {
      name: ForecastTable.SkyRowName,
      cells: skies.map(sky => ForecastTable.cellOf(sky)),
    };
  }

  /**
   * The row describing what one destination makes of that sky.
   * @param {{name: string, declaration: object}} place The destination being described.
   * @param {?object[]} skies What the sky is doing at each phase of the day.
   * @returns {{name: string, cells: ?object[]}}
   */
  static placeRow(place, skies)
  {
    return {
      name: place.name,
      cells: skies.map(sky => ForecastTable.resolvedCell(place.declaration, sky)),
    };
  }

  /**
   * One cell of the sky's own row.
   * @param {?object} sky What the sky is doing, or null when unknown.
   * @returns {?{preset: string, intensity: string}}
   */
  static cellOf(sky)
  {
    if (sky === ForecastTable.Unknown) return ForecastTable.Unknown;

    return {
      preset: sky.preset,
      intensity: sky.intensity,
    };
  }

  /**
   * One cell of a destination's row.
   *
   * Resolved through the very same method the game runs on arrival, which is the whole reason a
   * forecast can be trusted: there is no second implementation of "what does this place make of
   * that sky" that could drift from the first.
   * @param {object} declaration What that place's map declared.
   * @param {?object} sky What the sky is doing, or null when unknown.
   * @returns {?{preset: string, intensity: string}} What would be drawn there, or null for
   * nothing at all - which is a real answer, and the one a sheltered place gives.
   */
  static resolvedCell(declaration, sky)
  {
    if (sky === ForecastTable.Unknown) return ForecastTable.Unknown;

    return MapWeatherResolver.resolve(declaration, sky);
  }
}

export default ForecastTable;
//endregion ForecastTable