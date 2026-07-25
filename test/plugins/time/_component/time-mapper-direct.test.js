//region plugins/time/_component/time-mapper-direct.test.js
import { afterEach, describe, expect, it } from 'vitest';

import TimeMapper from '../../../../src/plugins/time/core/objects/TimeMapper.js';

const MinuteChoice = /<minuteChoice:[ ]?(\d+)>/i;
const HourChoice = /<hourChoice:[ ]?(\d+)>/i;
const TimeOfDayChoice = /<timeOfDayChoice:[ ]?([0-5]|night|dawn|morning|afternoon|evening|twilight)>/i;
const TimeRangeChoice = /<timeRangeChoice:[ ]?(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})>/i;
const FullDateRangeChoice = /<fullDateRangeChoice:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i;
const MinuteRangeChoice = /<minuteRangeChoice:[ ]?(\d+)-(\d+)>/i;
const DayChoice = /<dayChoice:[ ]?(\d+)>/i;
const MonthChoice = /<monthChoice:[ ]?(\d+)>/i;
const YearChoice = /<yearChoice:[ ]?(\d+)>/i;
const HourRangeChoice = /<hourRangeChoice:[ ]?(\d+)-(\d+)>/i;
const DayRangeChoice = /<dayRangeChoice:[ ]?(\d+)-(\d+)>/i;
const MonthRangeChoice = /<monthRangeChoice:[ ]?(\d+)-(\d+)>/i;
const YearRangeChoice = /<yearRangeChoice:[ ]?(\d+)-(\d+)>/i;

describe('TimeMapper (direct import)', () =>
{
  afterEach(() =>
  {
    delete globalThis.$gameTime;
  });

  describe('minuteToConditional', () =>
  {
    it('parses a scalar minute tag from a comment', () =>
    {
      // Arrange
      const comment = '<minuteChoice: 42>';

      // Act
      const conditional = TimeMapper.minuteToConditional(comment, MinuteChoice);

      // Assert
      expect(conditional.minutes).toBe(42);
    });
  });

  describe('hourToConditional', () =>
  {
    it('parses a scalar hour tag from a comment', () =>
    {
      // Arrange
      const comment = '<hourChoice:7>';

      // Act
      const conditional = TimeMapper.hourToConditional(comment, HourChoice);

      // Assert
      expect(conditional.hours).toBe(7);
    });
  });

  describe('timeOfDayToConditional', () =>
  {
    it('accepts a named time-of-day value', () =>
    {
      // Arrange
      const comment = '<timeOfDayChoice:evening>';

      // Act
      const conditional = TimeMapper.timeOfDayToConditional(comment, TimeOfDayChoice);

      // Assert
      expect(conditional.timeOfDay).toBe(4);
    });

    it('accepts a numeric time-of-day value', () =>
    {
      // Arrange
      const comment = '<timeOfDayChoice:3>';

      // Act
      const conditional = TimeMapper.timeOfDayToConditional(comment, TimeOfDayChoice);

      // Assert
      expect(conditional.timeOfDay).toBe(3);
    });
  });

  describe('timeRangeToConditional', () =>
  {
    it('builds a clock range from a comment', () =>
    {
      // Arrange
      const comment = '<timeRangeChoice:8:30-16:45>';

      // Act
      const conditional = TimeMapper.timeRangeToConditional(comment, TimeRangeChoice);

      // Assert
      expect(conditional.isTimeRange).toBe(true);
      expect(conditional.startRange).toEqual([ 8, 30 ]);
      expect(conditional.endRange).toEqual([ 16, 45 ]);
    });
  });

  describe('fullDateRangeToConditional', () =>
  {
    it('prepends seconds and parses the bracketed date-array segments', () =>
    {
      // Arrange
      const comment = '<fullDateRangeChoice:[0,12,1,6,2024]-[30,18,15,6,2024]>';

      // Act
      const conditional = TimeMapper.fullDateRangeToConditional(comment, FullDateRangeChoice);

      // Assert
      expect(conditional.isFullDateRange).toBe(true);
      expect(conditional.startRange[0]).toBe(0);
      expect(conditional.startRange[3]).toBe(1);
      expect(conditional.endRange[0]).toBe(59);
      expect(conditional.endRange[3]).toBe(15);
    });
  });

  describe('minuteRangeToConditional', () =>
  {
    it('uses the current global $gameTime snapshot hour for both ends of the range', () =>
    {
      // Arrange
      globalThis.$gameTime = { currentTime: () => ({ hours: 14 }) };
      const comment = '<minuteRangeChoice:10-50>';

      // Act
      const conditional = TimeMapper.minuteRangeToConditional(comment, MinuteRangeChoice);

      // Assert
      expect(conditional.startRange).toEqual([ 14, 10 ]);
      expect(conditional.endRange).toEqual([ 14, 50 ]);
    });
  });

  describe('dayToConditional', () =>
  {
    it('parses a scalar day tag from a comment', () =>
    {
      // Arrange
      const comment = '<dayChoice:15>';

      // Act
      const conditional = TimeMapper.dayToConditional(comment, DayChoice);

      // Assert
      expect(conditional.days).toBe(15);
    });
  });

  describe('monthToConditional', () =>
  {
    it('parses a scalar month tag from a comment', () =>
    {
      // Arrange
      const comment = '<monthChoice:9>';

      // Act
      const conditional = TimeMapper.monthToConditional(comment, MonthChoice);

      // Assert
      expect(conditional.months).toBe(9);
    });
  });

  describe('yearToConditional', () =>
  {
    it('parses a scalar year tag from a comment', () =>
    {
      // Arrange
      const comment = '<yearChoice:2025>';

      // Act
      const conditional = TimeMapper.yearToConditional(comment, YearChoice);

      // Assert
      expect(conditional.years).toBe(2025);
    });
  });

  describe('hourRangeToConditional', () =>
  {
    it('builds an hour-only range with :00 minutes on both ends', () =>
    {
      // Arrange
      const comment = '<hourRangeChoice:8-17>';

      // Act
      const conditional = TimeMapper.hourRangeToConditional(comment, HourRangeChoice);

      // Assert
      expect(conditional.isTimeRange).toBe(true);
      expect(conditional.startRange).toEqual([ 8, 0 ]);
      expect(conditional.endRange).toEqual([ 17, 0 ]);
    });
  });

  describe('dayRangeToConditional', () =>
  {
    it('builds a full date range using the current month/year when the end day is after the start day', () =>
    {
      // Arrange- end day after start day: same month, no rollover.
      globalThis.$gameTime = { currentTime: () => ({ months: 6, years: 2024 }) };
      const comment = '<dayRangeChoice:1-15>';

      // Act
      const conditional = TimeMapper.dayRangeToConditional(comment, DayRangeChoice);

      // Assert
      expect(conditional.isFullDateRange).toBe(true);
      expect(conditional.startRange).toEqual([ 0, 0, 0, 1, 6, 2024 ]);
      expect(conditional.endRange).toEqual([ 59, 59, 23, 15, 6, 2024 ]);
    });
  });

  describe('monthRangeToConditional', () =>
  {
    it('rolls into the next year when the end month is before the start month', () =>
    {
      // Arrange- end month before start month: rolls into next year.
      globalThis.$gameTime = { currentTime: () => ({ years: 2024 }) };
      const comment = '<monthRangeChoice:10-2>';

      // Act
      const conditional = TimeMapper.monthRangeToConditional(comment, MonthRangeChoice);

      // Assert
      expect(conditional.isFullDateRange).toBe(true);
      expect(conditional.startRange).toEqual([ 0, 0, 0, 1, 10, 2024 ]);
      expect(conditional.endRange).toEqual([ 59, 59, 23, 30, 2, 2025 ]);
    });
  });

  describe('yearRangeToConditional', () =>
  {
    it('builds a full date range spanning whole years', () =>
    {
      // Arrange
      const comment = '<yearRangeChoice:2020-2025>';

      // Act
      const conditional = TimeMapper.yearRangeToConditional(comment, YearRangeChoice);

      // Assert
      expect(conditional.isFullDateRange).toBe(true);
      expect(conditional.startRange).toEqual([ 0, 0, 0, 1, 1, 2020 ]);
      expect(conditional.endRange).toEqual([ 0, 0, 0, 1, 1, 2025 ]);
    });
  });
});
//endregion plugins/time/_component/time-mapper-direct.test.js
