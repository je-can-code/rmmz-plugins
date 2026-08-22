//region plugins/time/core/objects/time-mapper.test.js
import { afterEach, describe, expect, it } from 'vitest';

import TimeMapper from '../../../../../src/plugins/time/core/objects/TimeMapper.js';

const MinuteRangeChoice = /<minuteRangeChoice:[ ]?(\d+)-(\d+)>/i;
const DayRangeChoice = /<dayRangeChoice:[ ]?(\d+)-(\d+)>/i;
const MonthRangeChoice = /<monthRangeChoice:[ ]?(\d+)-(\d+)>/i;

/**
 * The straightforward parsing of every tag shape is covered by the component test that walks them
 * all. What is covered here is the wraparound arithmetic those ranges perform when a range spills
 * off the end of a day, a month or a year- the branches that only fire at the boundaries.
 */
describe('TimeMapper', () =>
{
  afterEach(() =>
  {
    delete globalThis.$gameTime;
  });

  /**
   * Pins the clock to a fixed moment so the range mappers, which read the current time to decide
   * which day or month a range ends in, have something deterministic to work from.
   */
  const clockAt = (hours, months, years) =>
  {
    globalThis.$gameTime = {
      currentTime: () => ({
        hours,
        months,
        years,
      }),
    };
  };

  describe('constructor', () =>
  {
    it('refuses to be instantiated, being a purely static class', () =>
    {
      // Arrange
      // Act
      const attempt = () => new TimeMapper();

      // Assert
      expect(attempt).toThrow('This is a static class.');
    });
  });

  describe('minuteRangeToConditional', () =>
  {
    it('ends the range in the same hour when it does not wrap', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.minuteRangeToConditional('<minuteRangeChoice:10-50>', MinuteRangeChoice);

      // Assert
      expect(conditional.startRange).toEqual([ 9, 10 ]);
      expect(conditional.endRange).toEqual([ 9, 50 ]);
    });

    it('ends the range in the following hour when it wraps past the top of the hour', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.minuteRangeToConditional('<minuteRangeChoice:50-10>', MinuteRangeChoice);

      // Assert
      expect(conditional.startRange).toEqual([ 9, 50 ]);
      expect(conditional.endRange).toEqual([ 10, 10 ]);
    });

    it('rolls the ending hour around to midnight when it would run off the end of the day', () =>
    {
      // Arrange
      clockAt(23, 5, 2021);

      // Act
      const conditional = TimeMapper.minuteRangeToConditional('<minuteRangeChoice:50-10>', MinuteRangeChoice);

      // Assert
      // hour 23 plus one would be hour 24, which is not a real hour- it is the next day's midnight.
      expect(conditional.endRange).toEqual([ 0, 10 ]);
    });
  });

  describe('dayRangeToConditional', () =>
  {
    it('ends the range in the same month when it does not wrap', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.dayRangeToConditional('<dayRangeChoice:5-20>', DayRangeChoice);

      // Assert
      expect(conditional.startRange).toEqual([ 0, 0, 0, 5, 5, 2021 ]);
      expect(conditional.endRange).toEqual([ 59, 59, 23, 20, 5, 2021 ]);
    });

    it('ends the range in the following month when it wraps past the end of the month', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.dayRangeToConditional('<dayRangeChoice:20-5>', DayRangeChoice);

      // Assert
      expect(conditional.endRange).toEqual([ 59, 59, 23, 5, 6, 2021 ]);
    });

    it('rolls into january of the next year when the range runs off the end of december', () =>
    {
      // Arrange
      clockAt(9, 12, 2021);

      // Act
      const conditional = TimeMapper.dayRangeToConditional('<dayRangeChoice:20-5>', DayRangeChoice);

      // Assert
      // december plus one would be month 13, which is january of the year after.
      expect(conditional.endRange).toEqual([ 59, 59, 23, 5, 1, 2022 ]);
    });
  });

  describe('monthRangeToConditional', () =>
  {
    it('ends the range in the same year when it does not wrap', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.monthRangeToConditional('<monthRangeChoice:3-9>', MonthRangeChoice);

      // Assert
      expect(conditional.startRange).toEqual([ 0, 0, 0, 1, 3, 2021 ]);
      expect(conditional.endRange).toEqual([ 59, 59, 23, 30, 9, 2021 ]);
    });

    it('ends the range in the following year when it wraps past december', () =>
    {
      // Arrange
      clockAt(9, 5, 2021);

      // Act
      const conditional = TimeMapper.monthRangeToConditional('<monthRangeChoice:9-3>', MonthRangeChoice);

      // Assert
      // september round to march ends on a lower month than it starts, which is what marks it as
      // crossing new year rather than as an empty window.
      expect(conditional.endRange).toEqual([ 59, 59, 23, 30, 3, 2022 ]);
    });
  });
});
//endregion plugins/time/core/objects/time-mapper.test.js
