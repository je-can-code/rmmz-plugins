//region plugins/weather/ext/time/core/forecast-digest.test.js
import { describe, expect, it } from 'vitest';
import ForecastDigest from '../../../../../../src/plugins/weather/ext/time/core/ForecastDigest.js';

// RMMZ's core installs this and the source chain uses it as its empty-string sentinel.
String.empty = '';

/**
 * What the forecast says, as a player is told it.
 *
 * **Two grains, and the difference between them is the point.** Today is phase by phase with
 * strength; the week is three readings a day with none. A suite that only checked the values
 * would miss that the week deliberately drops something, so several cases below assert what is
 * *not* there.
 */
describe('ForecastDigest', () =>
{
  /**
   * A sky whose `clear` condition wears a different face at night, so a face mistake is visible.
   * @returns {object}
   */
  const buildSky = (overrides = {}) => ({
    types: {
      clear: {
        preset: 'clear',
        intensities: [ 'light', 'moderate', 'heavy' ],
        faces: [ { phases: [ 0, 5 ], preset: 'starfall' } ],
      },
      rain: { preset: 'rain', intensities: [ 'light', 'moderate', 'heavy' ] },
    },
    seasons: {},
    settleTo: 'clear',
    ...overrides,
  });

  /**
   * A forecast beginning at a day boundary, with a distinguishable value per phase.
   * @param {string[]} types What the sky is, per phase.
   * @param {string[]} intensities How strong, per phase.
   * @returns {object}
   */
  const buildForecast = (types, intensities) => ({
    startPhase: 600,
    types,
    intensities: intensities ?? types.map(() => 'moderate'),
  });

  describe('skyAt', () =>
  {
    it('reports the face the hour makes of the condition', () =>
    {
      // Arrange - phase 600 opens a day, so it is moontide and clear wears starfall there.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.skyAt(buildSky(), forecast, 600);

      // Assert.
      expect(result)
        .toEqual({ preset: 'starfall', intensity: 'moderate', type: 'clear' });
    });

    it('reports the plain preset for the same condition at a lit hour', () =>
    {
      // Arrange - the sibling that separates "consulted the face table" from "always starfall".
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.skyAt(buildSky(), forecast, 602);

      // Assert.
      expect(result.preset)
        .toBe('clear');
    });

    it('reports nothing for a phase the forecast does not reach', () =>
    {
      // Arrange.
      const forecast = buildForecast([ 'clear' ]);

      // Act.
      const result = ForecastDigest.skyAt(buildSky(), forecast, 900);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('today', () =>
  {
    it('opens at the start of the day whatever hour the clock is on', () =>
    {
      // Arrange - a view that shortened as the day wore on would be a different shape every time
      // it was opened.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.today(buildSky(), forecast, 604);

      // Assert.
      expect(result.startPhase)
        .toBe(600);
    });

    it('holds all six phases, including the ones already gone', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.today(buildSky(), forecast, 604);

      // Assert.
      expect(result.entries)
        .toHaveLength(6);
      expect(result.entries.map(entry => entry.phaseOfDay))
        .toEqual([ 0, 1, 2, 3, 4, 5 ]);
    });

    it('carries the strength, which is what separates it from the week', () =>
    {
      // Arrange - a distinguishable strength per phase, so a view returning a constant is caught.
      const forecast = buildForecast(
        new Array(6).fill('rain'),
        [ 'light', 'moderate', 'heavy', 'heavy', 'moderate', 'light' ]);

      // Act.
      const result = ForecastDigest.today(buildSky(), forecast, 600);

      // Assert.
      expect(result.entries.map(entry => entry.sky.intensity))
        .toEqual([ 'light', 'moderate', 'heavy', 'heavy', 'moderate', 'light' ]);
    });

    it('marks which phase is happening now', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.today(buildSky(), forecast, 603);

      // Assert.
      expect(result.nowColumn)
        .toBe(3);
    });

    it('leaves an entry empty where the forecast does not reach', () =>
    {
      // Arrange - two phases known, four not.
      const forecast = buildForecast([ 'clear', 'clear' ]);

      // Act.
      const result = ForecastDigest.today(buildSky(), forecast, 600);

      // Assert.
      expect(result.entries[1].sky)
        .not
        .toBeNull();
      expect(result.entries[2].sky)
        .toBeNull();
    });
  });

  describe('weekPhasesOf', () =>
  {
    it('samples morning, midday and evening when the config says nothing', () =>
    {
      // Act.
      const result = ForecastDigest.weekPhasesOf(buildSky());

      // Assert.
      expect(result)
        .toEqual([ 1, 3, 4 ]);
    });

    it('samples whatever the config asked for instead', () =>
    {
      // Arrange - two readings rather than three, so a default sneaking through is visible.
      const result = ForecastDigest.weekPhasesOf(buildSky({ weekPhases: [ 0, 3 ] }));

      // Assert.
      expect(result)
        .toEqual([ 0, 3 ]);
    });
  });

  describe('weekDaysOf', () =>
  {
    it('covers seven days when the config says nothing', () =>
    {
      // Act.
      const result = ForecastDigest.weekDaysOf(buildSky());

      // Assert.
      expect(result)
        .toBe(7);
    });

    it('covers whatever the config asked for instead', () =>
    {
      // Act.
      const result = ForecastDigest.weekDaysOf(buildSky({ weekDays: 4 }));

      // Assert.
      expect(result)
        .toBe(4);
    });
  });

  describe('week', () =>
  {
    it('covers a week of days from today', () =>
    {
      // Arrange - seven days of six phases.
      const forecast = buildForecast(new Array(42).fill('clear'));

      // Act.
      const result = ForecastDigest.week(buildSky(), forecast, 604);

      // Assert.
      expect(result.days)
        .toHaveLength(7);
      expect(result.days[0].startPhase)
        .toBe(600);
      expect(result.days[1].startPhase)
        .toBe(606);
    });

    it('samples three readings per day rather than all six', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(42).fill('clear'));

      // Act.
      const result = ForecastDigest.week(buildSky(), forecast, 600);

      // Assert.
      expect(result.phases)
        .toEqual([ 1, 3, 4 ]);
      result.days.forEach(day => expect(day.cells)
        .toHaveLength(3));
    });

    it('reports the look and deliberately not the strength', () =>
    {
      // Arrange - a day whose three sampled phases run light, heavy, heavy. At this zoom the
      // useful question is whether it is wet, and a second mark per cell saying how wet turns a
      // glanceable week into one that has to be studied.
      const intensities = [ 'moderate', 'light', 'moderate', 'heavy', 'heavy', 'moderate' ];
      const forecast = buildForecast(new Array(6).fill('rain'), intensities);

      // Act.
      const result = ForecastDigest.week(buildSky({ weekDays: 1 }), forecast, 600);

      // Assert - three bare strings, with nothing anywhere to say how hard it is coming down.
      expect(result.days[0].cells)
        .toEqual([ 'rain', 'rain', 'rain' ]);
    });

    it('reports the faces the sampled hours produce', () =>
    {
      // Arrange - sampling phase 0 as well, which is a dark phase, so the face differs from the
      // lit ones and a week that ignored faces would show `clear` across the board.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.week(buildSky({ weekDays: 1, weekPhases: [ 0, 3 ] }), forecast, 600);

      // Assert.
      expect(result.days[0].cells)
        .toEqual([ 'starfall', 'clear' ]);
    });

    it('leaves a cell empty where the forecast does not reach', () =>
    {
      // Arrange - a window holding only today, asked for a week.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastDigest.week(buildSky(), forecast, 600);

      // Assert.
      expect(result.days[0].cells[0])
        .not
        .toBeNull();
      expect(result.days[3].cells[0])
        .toBeNull();
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-digest.test.js