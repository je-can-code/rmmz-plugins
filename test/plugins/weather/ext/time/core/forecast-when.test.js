//region plugins/weather/ext/time/core/forecast-when.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import ForecastWhen from '../../../../../../src/plugins/weather/ext/time/core/ForecastWhen.js';

String.empty = '';

/**
 * How the forecast says when it is talking about.
 *
 * Phases are absolute and six to a day, so the numbers below are days multiplied out rather than
 * written as dates - phase 0 is the first phase of day zero, phase 6 the first of day one, and so
 * on. Expected values are pinned from observation rather than recomputed from those numbers,
 * because an expectation that redoes the arithmetic agrees with the implementation even when both
 * are wrong.
 */
describe('ForecastWhen', () =>
{
  beforeAll(() =>
  {
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';
    globalThis.Diagnostics = { error: () => {} };

    // the day-of-week vocabulary belongs to J-TIME, which is a hoisted global at runtime.
    globalThis.Time_Snapshot = {
      DaysOfWeekName: dayOfWeekId => [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      ][ dayOfWeekId ],
    };
  });

  describe('weekdayOf', () =>
  {
    it('starts the calendar on a Monday', () =>
    {
      // Arrange - phase zero is the first phase of the very first day.

      // Act.
      const result = ForecastWhen.weekdayOf(0);

      // Assert.
      expect(result)
        .toBe('Monday');
    });

    it('moves on a day at a time rather than a phase at a time', () =>
    {
      // Arrange - phase 5 is still the first day; phase 6 is the second.

      // Act.
      const sameDay = ForecastWhen.weekdayOf(5);
      const nextDay = ForecastWhen.weekdayOf(6);

      // Assert.
      expect(sameDay)
        .toBe('Monday');
      expect(nextDay)
        .toBe('Tuesday');
    });

    it('comes back around after seven days', () =>
    {
      // Arrange - seven days on from day zero, at six phases a day.

      // Act.
      const result = ForecastWhen.weekdayOf(42);

      // Assert.
      expect(result)
        .toBe('Monday');
    });

    it('runs on through the turn of the year rather than restarting', () =>
    {
      // Arrange - day 360 is new year's day, and 360 is not a whole number of weeks. A weekday
      // read off the day of the *year* would say Monday here; the calendar carries on instead.

      // Act.
      const result = ForecastWhen.weekdayOf(2160);

      // Assert.
      expect(result)
        .toBe('Thursday');
    });
  });

  describe('dateOf', () =>
  {
    it('names the weekday, the day and the month', () =>
    {
      // Arrange - day zero of the calendar.

      // Act.
      const result = ForecastWhen.dateOf(0);

      // Assert.
      expect(result)
        .toBe('Monday, Day 1 of Month 1');
    });

    it('rolls into the next month at the end of the previous one', () =>
    {
      // Arrange - day 30 is the first day of month two, at six phases a day.

      // Act.
      const result = ForecastWhen.dateOf(180);

      // Assert.
      expect(result)
        .toBe('Wednesday, Day 1 of Month 2');
    });
  });

  describe('seasonOf', () =>
  {
    it('hands back the season as a text code', () =>
    {
      // Arrange - month one is winter, not spring: the seasons sit on March-February rather than
      // on calendar quarters, so month one falls in the fourth group.

      // Act.
      const result = ForecastWhen.seasonOf(0);

      // Assert.
      expect(result)
        .toBe('\\seasonOfYear[3]');
    });

    it('names a different season later in the year', () =>
    {
      // Arrange - day 180 is month seven, which is summer.

      // Act.
      const result = ForecastWhen.seasonOf(1080);

      // Assert.
      expect(result)
        .toBe('\\seasonOfYear[1]');
    });
  });

  describe('phaseOf', () =>
  {
    it('hands back the phase as a text code', () =>
    {
      // Arrange - the fourth phase of some later day, to prove it reads the phase within the day
      // rather than the absolute number.

      // Act.
      const result = ForecastWhen.phaseOf(63);

      // Assert.
      expect(result)
        .toBe('\\timeOfDay[3]');
    });
  });

  describe('clockOf', () =>
  {
    it('pads both figures', () =>
    {
      // Arrange - an unpadded 9:5 reads as a decimal rather than a time.

      // Act.
      const result = ForecastWhen.clockOf(9, 5);

      // Assert.
      expect(result)
        .toBe('09:05');
    });

    it('leaves figures that are already two digits alone', () =>
    {
      // Arrange.

      // Act.
      const result = ForecastWhen.clockOf(14, 30);

      // Assert.
      expect(result)
        .toBe('14:30');
    });
  });

  describe('dateLineOf', () =>
  {
    it('joins the date to its season', () =>
    {
      // Arrange.

      // Act.
      const result = ForecastWhen.dateLineOf(0);

      // Assert.
      expect(result)
        .toBe('Monday, Day 1 of Month 1 - \\seasonOfYear[3]');
    });
  });

  describe('nowLineOf', () =>
  {
    it('carries the date, the season, the clock and the phase', () =>
    {
      // Arrange - phase 2 of day zero, at half past seven.

      // Act.
      const result = ForecastWhen.nowLineOf(2, 7, 30);

      // Assert.
      expect(result)
        .toBe('Monday, Day 1 of Month 1 - \\seasonOfYear[3] - 07:30 \\timeOfDay[2]');
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-when.test.js