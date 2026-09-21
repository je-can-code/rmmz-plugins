//region plugins/weather/ext/time/core/sky-forecast.test.js
import { describe, expect, it } from 'vitest';
import SkyForecast from '../../../../../../src/plugins/weather/ext/time/core/SkyForecast.js';

// RMMZ's core installs this and the source uses it as its empty-string sentinel.
String.empty = '';

/**
 * The calendar the sky is walked across, and the window of it that is kept.
 *
 * **The season boundaries are the point of half this suite.** Winter is months 12, 1 and 2, so the
 * seasons do not sit on calendar quarters and the settling days are the last day of months 2, 5, 8
 * and 11 rather than 3, 6, 9 and 12. That was got wrong once during design, and it is the kind of
 * wrong that surfaces as "the weather went strange in month nine" rather than as a failure.
 *
 * Expected values are hardcoded throughout rather than recomputed from the inputs, because an
 * expectation that re-derives the implementation agrees with it by construction - including when
 * both are wrong.
 */
describe('SkyForecast', () =>
{
  /**
   * A calendar-shaped sky whose walk is entirely predictable from the rolls handed in.
   *
   * Two conditions rather than one, so a roll that alternates between them proves each phase was
   * actually walked rather than copied forward. The strength always holds, which keeps the
   * condition the only thing moving.
   * @returns {object}
   */
  const buildSky = () =>
  {
    const graph = {
      allowed: [ 'alpha', 'beta' ],
      transitions: {
        alpha: { alpha: 50, beta: 50 },
        beta: { beta: 50, alpha: 50 },
      },
    };

    return {
      types: {
        alpha: { preset: 'alpha-preset', intensities: [ 'light', 'moderate', 'heavy' ] },
        beta: { preset: 'beta-preset', intensities: [ 'light', 'moderate', 'heavy' ] },
      },
      seasons: {
        spring: graph,
        summer: graph,
        autumn: graph,
        winter: graph,
      },
      intensityDrift: {
        hold: 100,
        up: 0,
        down: 0,
      },
      settleTo: 'alpha',
    };
  };

  // a roll that always takes the second candidate, so the condition alternates every phase.
  const alternating = () => ({
    type: 0.9,
    intensity: 0,
  });

  describe('the shape of a year', () =>
  {
    it('counts three hundred and sixty days', () =>
    {
      // Act.
      const result = SkyForecast.daysPerYear();

      // Assert.
      expect(result)
        .toBe(360);
    });

    it('counts two thousand one hundred and sixty phases', () =>
    {
      // Act.
      const result = SkyForecast.phasesPerYear();

      // Assert.
      expect(result)
        .toBe(2160);
    });

    it('hands over on the last month of each season, which is not a calendar quarter', () =>
    {
      // Act.
      const result = SkyForecast.settlingMonths();

      // Assert - 5, 8, 11 and 2. Not 3, 6, 9 and 12, because winter wraps the year boundary and
      // therefore ends in month 2. This is the single most correctable fact in the plugin.
      expect(result)
        .toEqual([ 5, 8, 11, 2 ]);
    });
  });

  describe('dayOfYear', () =>
  {
    it('numbers the first day of the year as one', () =>
    {
      // Act.
      const result = SkyForecast.dayOfYear(1, 1);

      // Assert - one-based, matching how the clock stores days and months.
      expect(result)
        .toBe(1);
    });

    it('numbers a day in a later month past all the months before it', () =>
    {
      // Act.
      const result = SkyForecast.dayOfYear(5, 29);

      // Assert.
      expect(result)
        .toBe(149);
    });

    it('numbers the last day of the year as three hundred and sixty', () =>
    {
      // Act.
      const result = SkyForecast.dayOfYear(12, 30);

      // Assert.
      expect(result)
        .toBe(360);
    });
  });

  describe('absoluteDay', () =>
  {
    it('starts the calendar at zero', () =>
    {
      // Act.
      const result = SkyForecast.absoluteDay(0, 1, 1);

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('counts a whole year of days between one year and the next', () =>
    {
      // Act.
      const result = SkyForecast.absoluteDay(1, 1, 1);

      // Assert.
      expect(result)
        .toBe(360);
    });
  });

  describe('absolutePhaseOf', () =>
  {
    it('numbers the opening phase of the calendar as zero', () =>
    {
      // Act.
      const result = SkyForecast.absolutePhaseOf(0, 1, 1, 0);

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('numbers the phase Chef Adventure actually opens on', () =>
    {
      // Arrange - 09:00 on day 29 of month 5, year 2021, which is phase 2 of that day.
      // Act.
      const result = SkyForecast.absolutePhaseOf(2021, 5, 29, 2);

      // Assert.
      expect(result)
        .toBe(4366250);
    });

    it('refuses to number an hour that is not on the clock', () =>
    {
      // Arrange - `setTime` writes the hour straight through without constraining it, so
      // `TimePhases.phaseOfHour` genuinely hands back -1 and it has to survive the trip.
      // Act.
      const result = SkyForecast.absolutePhaseOf(2021, 5, 29, -1);

      // Assert - not a phase, rather than phase 4366247, which would silently apply yesterday.
      expect(result)
        .toBe(-1);
    });
  });

  describe('reading a date back out of a phase', () =>
  {
    it('recovers which phase of its day a phase is', () =>
    {
      // Act.
      const result = SkyForecast.phaseOfDay(4366250);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('recovers the day of the year', () =>
    {
      // Act.
      const result = SkyForecast.dayIndexOf(4366250);

      // Assert - zero-based, so day 29 of month 5 is index 148.
      expect(result)
        .toBe(148);
    });

    it('recovers the month', () =>
    {
      // Act.
      const result = SkyForecast.monthOf(4366250);

      // Assert.
      expect(result)
        .toBe(5);
    });

    it('recovers the day of the month', () =>
    {
      // Act.
      const result = SkyForecast.dayOfMonthOf(4366250);

      // Assert.
      expect(result)
        .toBe(29);
    });
  });

  describe('seasonIdOf', () =>
  {
    it('puts month three in spring', () =>
    {
      // Arrange - the first day of month 3, year 0.
      const phase = SkyForecast.absolutePhaseOf(0, 3, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('puts month seven in summer', () =>
    {
      // Arrange.
      const phase = SkyForecast.absolutePhaseOf(0, 7, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(1);
    });

    it('puts month ten in autumn', () =>
    {
      // Arrange.
      const phase = SkyForecast.absolutePhaseOf(0, 10, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('puts month twelve in winter, at the end of the year', () =>
    {
      // Arrange.
      const phase = SkyForecast.absolutePhaseOf(0, 12, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(3);
    });

    it('puts month one in winter too, at the start of the year', () =>
    {
      // Arrange - the wrap. A calendar-quarter reading would call this spring, and every seasonal
      // gate in the plugin would be two months out for a third of the year.
      const phase = SkyForecast.absolutePhaseOf(0, 1, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(3);
    });

    it('puts month two in winter, which is where the year hands over', () =>
    {
      // Arrange.
      const phase = SkyForecast.absolutePhaseOf(0, 2, 1, 0);

      // Act.
      const result = SkyForecast.seasonIdOf(phase);

      // Assert.
      expect(result)
        .toBe(3);
    });
  });

  describe('seasonNameOf', () =>
  {
    it('names the season a phase falls in', () =>
    {
      // Arrange - month 10, which is autumn.
      const phase = SkyForecast.absolutePhaseOf(0, 10, 1, 0);

      // Act.
      const result = SkyForecast.seasonNameOf(phase);

      // Assert.
      expect(result)
        .toBe('autumn');
    });
  });

  describe('isSettling', () =>
  {
    it('settles on the last day of the last month of a season', () =>
    {
      // Arrange - day 30 of month 5, the end of spring.
      const phase = SkyForecast.absolutePhaseOf(0, 5, 30, 0);

      // Act.
      const result = SkyForecast.isSettling(phase);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('settles on the last day of month two, where winter hands over', () =>
    {
      // Arrange - the one that is not a calendar quarter, and the one most likely to be missed.
      const phase = SkyForecast.absolutePhaseOf(0, 2, 30, 0);

      // Act.
      const result = SkyForecast.isSettling(phase);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('does not settle on the day before a handover', () =>
    {
      // Arrange - day 29 of month 5, which is the right month and the wrong day.
      const phase = SkyForecast.absolutePhaseOf(0, 5, 29, 0);

      // Act.
      const result = SkyForecast.isSettling(phase);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('does not settle on the last day of a month mid-season', () =>
    {
      // Arrange - day 30 of month 6, which is the right day and the wrong month. Without this
      // case, a check that only tested the day would pass every other test in this block.
      const phase = SkyForecast.absolutePhaseOf(0, 6, 30, 0);

      // Act.
      const result = SkyForecast.isSettling(phase);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('does not settle on the last day of month three', () =>
    {
      // Arrange - the day the original design believed was a handover. It is the first month of
      // spring, not the last, and pinning it is what keeps that mistake from coming back.
      const phase = SkyForecast.absolutePhaseOf(0, 3, 30, 0);

      // Act.
      const result = SkyForecast.isSettling(phase);

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('empty', () =>
  {
    it('starts a forecast holding nothing at the phase it was given', () =>
    {
      // Act.
      const result = SkyForecast.empty(4366250);

      // Assert.
      expect(result)
        .toEqual({ startPhase: 4366250, types: [], intensities: [] });
    });
  });

  describe('covers', () =>
  {
    /**
     * A forecast of three phases beginning at phase ten.
     * @returns {object}
     */
    const buildForecast = () => ({
      startPhase: 10,
      types: [ 'alpha', 'beta', 'alpha' ],
      intensities: [ 'light', 'moderate', 'heavy' ],
    });

    it('covers a phase inside the window', () =>
    {
      // Act.
      const result = SkyForecast.covers(buildForecast(), 11);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('covers the last phase of the window', () =>
    {
      // Act.
      const result = SkyForecast.covers(buildForecast(), 12);

      // Assert - the boundary, which an off-by-one would drop.
      expect(result)
        .toBe(true);
    });

    it('does not cover the phase just past the end', () =>
    {
      // Act.
      const result = SkyForecast.covers(buildForecast(), 13);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('does not cover a phase before it begins', () =>
    {
      // Act.
      const result = SkyForecast.covers(buildForecast(), 9);

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('stateAt', () =>
  {
    /**
     * A forecast whose every entry differs, so an index error cannot land on a matching value.
     * @returns {object}
     */
    const buildForecast = () => ({
      startPhase: 10,
      types: [ 'alpha', 'beta', 'gamma' ],
      intensities: [ 'light', 'moderate', 'heavy' ],
    });

    it('reads the state at a phase in the middle of the window', () =>
    {
      // Act.
      const result = SkyForecast.stateAt(buildForecast(), 11);

      // Assert - the second entry, which is neither end and so cannot pass by an off-by-one.
      expect(result)
        .toEqual({ type: 'beta', intensity: 'moderate' });
    });

    it('reads nothing at a phase outside the window', () =>
    {
      // Act.
      const result = SkyForecast.stateAt(buildForecast(), 99);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('lastState', () =>
  {
    it('reads the final entry of a forecast that has one', () =>
    {
      // Arrange.
      const sky = buildSky();
      const forecast = {
        startPhase: 10,
        types: [ 'alpha', 'beta' ],
        intensities: [ 'light', 'heavy' ],
      };

      // Act.
      const result = SkyForecast.lastState(sky, forecast);

      // Assert.
      expect(result)
        .toEqual({ type: 'beta', intensity: 'heavy' });
    });

    it('starts an empty forecast from the settling condition at middling strength', () =>
    {
      // Arrange - the state a season handover leaves behind, which every season permits.
      const sky = buildSky();

      // Act.
      const result = SkyForecast.lastState(sky, SkyForecast.empty(0));

      // Assert.
      expect(result)
        .toEqual({ type: 'alpha', intensity: 'moderate' });
    });
  });

  describe('extendThrough', () =>
  {
    it('walks the sky forward one phase at a time', () =>
    {
      // Arrange - four phases from the opening of the calendar, with a roll that alternates. Day
      // one of month one is not a handover, so nothing steers.
      const sky = buildSky();
      const forecast = SkyForecast.empty(0);

      // Act.
      SkyForecast.extendThrough(sky, forecast, 3, alternating);

      // Assert - alternating rather than four of a kind, which is what proves each phase was
      // walked from the one before it rather than copied from the seed.
      expect(forecast.types)
        .toEqual([ 'beta', 'alpha', 'beta', 'alpha' ]);
    });

    it('appends to a forecast that already holds phases', () =>
    {
      // Arrange - two phases already decided, extending through the fourth.
      const sky = buildSky();
      const forecast = {
        startPhase: 0,
        types: [ 'alpha', 'alpha' ],
        intensities: [ 'heavy', 'heavy' ],
      };

      // Act.
      SkyForecast.extendThrough(sky, forecast, 3, alternating);

      // Assert - the two that already existed are untouched, and the walk carried on from the last
      // of them rather than from the seed.
      expect(forecast.types)
        .toEqual([ 'alpha', 'alpha', 'beta', 'alpha' ]);
    });

    it('adds nothing to a forecast that already reaches far enough', () =>
    {
      // Arrange - three phases held, asked to reach the second.
      const sky = buildSky();
      const forecast = {
        startPhase: 0,
        types: [ 'alpha', 'beta', 'alpha' ],
        intensities: [ 'light', 'light', 'light' ],
      };

      // Act.
      SkyForecast.extendThrough(sky, forecast, 1, alternating);

      // Assert.
      expect(forecast.types)
        .toEqual([ 'alpha', 'beta', 'alpha' ]);
    });

    it('steers toward the settling condition on a handover day', () =>
    {
      // Arrange - the six phases of day 30 of month 5, with a roll that would otherwise alternate
      // away from the settling state on every single one of them.
      const sky = buildSky();
      const startPhase = SkyForecast.absolutePhaseOf(0, 5, 30, 0);
      const forecast = SkyForecast.empty(startPhase);

      // Act.
      SkyForecast.extendThrough(sky, forecast, startPhase + 5, alternating);

      // Assert - every phase of a handover day holds the settling condition, rather than the
      // alternation the rolls asked for.
      expect(forecast.types)
        .toEqual([ 'alpha', 'alpha', 'alpha', 'alpha', 'alpha', 'alpha' ]);
    });
  });

  describe('trimBefore', () =>
  {
    it('drops the phases already lived through and moves the window up', () =>
    {
      // Arrange - four phases from zero, trimming the first two away.
      const forecast = {
        startPhase: 0,
        types: [ 'alpha', 'beta', 'gamma', 'delta' ],
        intensities: [ 'light', 'moderate', 'heavy', 'light' ],
      };

      // Act.
      SkyForecast.trimBefore(forecast, 2);

      // Assert - both arrays move together, and the start phase moves with them; a trim that
      // forgot the start phase would shift every future lookup by two.
      expect(forecast)
        .toEqual({
          startPhase: 2,
          types: [ 'gamma', 'delta' ],
          intensities: [ 'heavy', 'light' ],
        });
    });

    it('drops nothing when the window already starts there', () =>
    {
      // Arrange.
      const forecast = {
        startPhase: 5,
        types: [ 'alpha', 'beta' ],
        intensities: [ 'light', 'moderate' ],
      };

      // Act.
      SkyForecast.trimBefore(forecast, 5);

      // Assert.
      expect(forecast)
        .toEqual({
          startPhase: 5,
          types: [ 'alpha', 'beta' ],
          intensities: [ 'light', 'moderate' ],
        });
    });

    it('drops nothing when asked to trim to a phase already behind the window', () =>
    {
      // Arrange - a backward clock jump reaches here before the regeneration does.
      const forecast = {
        startPhase: 5,
        types: [ 'alpha', 'beta' ],
        intensities: [ 'light', 'moderate' ],
      };

      // Act.
      SkyForecast.trimBefore(forecast, 2);

      // Assert.
      expect(forecast.startPhase)
        .toBe(5);
    });
  });

  describe('ensureCovers', () =>
  {
    it('keeps the phases already decided and rolls only the new ones', () =>
    {
      // Arrange - four phases held from zero; the clock has reached phase two and wants three more
      // ahead of it.
      const sky = buildSky();
      const forecast = {
        startPhase: 0,
        types: [ 'alpha', 'alpha', 'alpha', 'beta' ],
        intensities: [ 'light', 'light', 'light', 'light' ],
      };

      // Act.
      const result = SkyForecast.ensureCovers(sky, forecast, 2, 5, alternating);

      // Assert - phases two and three survive with the values they were already given, which is
      // the promise a readable forecast rests on; phases four and five are new.
      expect(result)
        .toEqual({
          startPhase: 2,
          types: [ 'alpha', 'beta', 'alpha', 'beta' ],
          intensities: [ 'light', 'light', 'light', 'light' ],
        });
    });

    it('regenerates from scratch when the clock has jumped backward past the window', () =>
    {
      // Arrange - a debug clock jump to before anything that was ever rolled.
      const sky = buildSky();
      const forecast = {
        startPhase: 100,
        types: [ 'beta', 'beta' ],
        intensities: [ 'heavy', 'heavy' ],
      };

      // Act.
      const result = SkyForecast.ensureCovers(sky, forecast, 40, 42, alternating);

      // Assert - a fresh window at the new phase. Extending backward is not possible, and keeping
      // a window that begins sixty phases in the future would answer every lookup with null.
      expect(result)
        .toEqual({
          startPhase: 40,
          types: [ 'beta', 'alpha', 'beta' ],
          intensities: [ 'moderate', 'moderate', 'moderate' ],
        });
    });
  });
});
//endregion plugins/weather/ext/time/core/sky-forecast.test.js