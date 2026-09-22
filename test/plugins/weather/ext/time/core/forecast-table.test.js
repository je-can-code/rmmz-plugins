//region plugins/weather/ext/time/core/forecast-table.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * One day of the forecast, as a grid of what each place will actually look like.
 *
 * **Every fixture below holds places that disagree with the sky**, because a table of destinations
 * that all say what the sky says proves nothing at all. The Peaks are snowy under a clear sky and
 * the Forest is foggiest under one, and those two rows are what make the screen worth opening.
 */
describe('ForecastTable', () =>
{
  let ForecastTable;
  let ForecastPlaces;

  /**
   * A sky whose `clear` condition wears a different face at night, so a face mistake is visible.
   * @returns {object}
   */
  const buildSky = () => ({
    types: {
      clear: {
        preset: 'clear',
        intensities: [ 'light', 'moderate', 'heavy' ],
        faces: [ { phases: [ 0, 5 ], preset: 'starfall' } ],
      },
      rain: { preset: 'rain', intensities: [ 'light', 'moderate', 'heavy' ] },
    },
    seasons: {
      spring: { allowed: [ 'clear', 'rain' ], transitions: { clear: { clear: 100 }, rain: { rain: 100 } } },
      summer: { allowed: [ 'clear', 'rain' ], transitions: { clear: { clear: 100 }, rain: { rain: 100 } } },
      autumn: { allowed: [ 'clear', 'rain' ], transitions: { clear: { clear: 100 }, rain: { rain: 100 } } },
      winter: { allowed: [ 'clear', 'rain' ], transitions: { clear: { clear: 100 }, rain: { rain: 100 } } },
    },
    settleTo: 'clear',
    places: [ { name: 'Peaks', mapId: 120 } ],
  });

  /**
   * A forecast of six clear phases beginning at a known day boundary.
   *
   * Phase 600 is the first phase of a day, which matters: the grid is supposed to begin at one
   * whatever hour the clock is actually on.
   * @param {string[]} types What the sky is, per phase.
   * @returns {object}
   */
  const buildForecast = types => ({
    startPhase: 600,
    types,
    intensities: types.map(() => 'moderate'),
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    String.empty = '';

    ({ default: globalThis.MapWeatherResolver } =
      await import('../../../../../../src/plugins/weather/core/core/MapWeatherResolver.js'));

    ({ default: ForecastPlaces } =
      await import('../../../../../../src/plugins/weather/ext/time/core/ForecastPlaces.js'));
    ({ default: ForecastTable } =
      await import('../../../../../../src/plugins/weather/ext/time/core/ForecastTable.js'));

    // the places layer reads files; what it reads is its own suite's business, so here it simply
    // reports what a destination declared.
    vi.spyOn(ForecastPlaces, 'resolveAll')
      .mockReturnValue([
        {
          name: 'Peaks',
          declaration: { suppressed: false, preset: 'snow', hasSky: true, climate: null },
        },
      ]);
  });

  describe('nowColumnOf', () =>
  {
    it('finds the column the clock is standing in', () =>
    {
      // Act.
      const result = ForecastTable.nowColumnOf(603, 600);

      // Assert.
      expect(result)
        .toBe(3);
    });

    it('marks no column on a day that has not arrived yet', () =>
    {
      // Arrange - tomorrow's page, which must not highlight anything.
      const result = ForecastTable.nowColumnOf(603, 606);

      // Assert.
      expect(result)
        .toBe(-1);
    });

    it('marks no column on a day already gone', () =>
    {
      // Arrange - the other side of the same boundary.
      const result = ForecastTable.nowColumnOf(603, 594);

      // Assert.
      expect(result)
        .toBe(-1);
    });

    it('marks the last column of the day rather than falling off it', () =>
    {
      // Arrange - the off-by-one that would leave the final phase of every day unhighlighted.
      const result = ForecastTable.nowColumnOf(605, 600);

      // Assert.
      expect(result)
        .toBe(5);
    });
  });

  describe('skyAt', () =>
  {
    it('reports the face the hour makes of the condition', () =>
    {
      // Arrange - phase 600 opens a day, so it is moontide, and clear wears starfall there.
      const forecast = buildForecast([ 'clear', 'clear', 'clear', 'clear', 'clear', 'clear' ]);

      // Act.
      const result = ForecastTable.skyAt(buildSky(), forecast, 600);

      // Assert.
      expect(result)
        .toEqual({ preset: 'starfall', intensity: 'moderate', type: 'clear' });
    });

    it('reports the plain preset for the same condition at a lit hour', () =>
    {
      // Arrange - the sibling, four hours later, so "read the face table" and "always starfall"
      // are distinguishable.
      const forecast = buildForecast([ 'clear', 'clear', 'clear', 'clear', 'clear', 'clear' ]);

      // Act.
      const result = ForecastTable.skyAt(buildSky(), forecast, 602);

      // Assert.
      expect(result.preset)
        .toBe('clear');
    });

    it('reports nothing for a phase the forecast does not reach', () =>
    {
      // Arrange.
      const forecast = buildForecast([ 'clear' ]);

      // Act.
      const result = ForecastTable.skyAt(buildSky(), forecast, 900);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('build', () =>
  {
    it('opens the grid at the start of the day, whatever hour the clock is on', () =>
    {
      // Arrange - the clock is midway through the day. A grid beginning at the current phase
      // would put moontide in a different column every time it was opened.
      const forecast = buildForecast([ 'clear', 'clear', 'clear', 'clear', 'clear', 'clear' ]);

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 604, 0);

      // Assert.
      expect(result.startPhase)
        .toBe(600);
    });

    it('pages forward a whole day at a time', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(12).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 604, 1);

      // Assert - six phases on, not one.
      expect(result.startPhase)
        .toBe(606);
    });

    it('puts the sky in the first row', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      expect(result.rows[0].name)
        .toBe('Sky');
      expect(result.rows[0].cells[0])
        .toEqual({ preset: 'starfall', intensity: 'moderate' });
    });

    it('shows a destination its own weather rather than the sky', () =>
    {
      // Arrange - the Peaks are tagged for snow, and the sky is clear. This is the entire point
      // of the screen: a row that echoed the sky would say starfall.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      expect(result.rows[1].name)
        .toBe('Peaks');
      expect(result.rows[1].cells[0])
        .toEqual({ preset: 'snow', intensity: 'moderate' });
    });

    it('gives every row one cell per phase of the day', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      result.rows.forEach(row => expect(row.cells)
        .toHaveLength(6));
    });

    it('marks where the clock is', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 604, 0);

      // Assert.
      expect(result.nowColumn)
        .toBe(4);
    });

    it('marks nothing on a day that is not today', () =>
    {
      // Arrange.
      const forecast = buildForecast(new Array(12).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 604, 1);

      // Assert.
      expect(result.nowColumn)
        .toBe(-1);
    });

    it('leaves a cell blank where the forecast does not reach', () =>
    {
      // Arrange - a window holding only the first two phases of the day.
      const forecast = buildForecast([ 'clear', 'clear' ]);

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert - the two it knows, then nothing rather than a guess.
      expect(result.rows[0].cells[1])
        .not
        .toBeNull();
      expect(result.rows[0].cells[2])
        .toBeNull();
      expect(result.rows[1].cells[2])
        .toBeNull();
    });

    it('reports nothing at all for a sheltered destination', () =>
    {
      // Arrange - a cave, which draws no weather. Null is a real answer here and the window
      // renders it as a dash; a blank row that read as "clear" would be a lie.
      ForecastPlaces.resolveAll.mockReturnValue([
        {
          name: 'Caverns',
          declaration: { suppressed: true, preset: null, hasSky: false, climate: null },
        },
      ]);
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      expect(result.rows[1].cells[0])
        .toBeNull();
    });

    it('holds only the sky when no destinations are configured', () =>
    {
      // Arrange.
      ForecastPlaces.resolveAll.mockReturnValue([]);
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      expect(result.rows)
        .toHaveLength(1);
    });

    it('follows the sky where a destination authored nothing of its own', () =>
    {
      // Arrange - Raevula, which simply gets whatever the weather is. The near miss against the
      // Peaks row: proving one place diverges is only half of it.
      ForecastPlaces.resolveAll.mockReturnValue([
        {
          name: 'Raevula',
          declaration: { suppressed: false, preset: null, hasSky: true, climate: null },
        },
      ]);
      const forecast = buildForecast(new Array(6).fill('clear'));

      // Act.
      const result = ForecastTable.build(buildSky(), forecast, 600, 0);

      // Assert.
      expect(result.rows[1].cells[0])
        .toEqual({ preset: 'starfall', intensity: 'moderate' });
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-table.test.js