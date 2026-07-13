//region plugins/time/time-conditional-direct.test.js
import { describe, expect, it } from 'vitest';

import TimeConditional from '../../../src/plugins/time/core/_models/TimeConditional.js';

describe('TimeConditional (direct import)', () =>
{
  describe('defaults', () =>
  {
    it('defaults isTimeRange to false', () =>
    {
      // Arrange & Act
      const conditional = new TimeConditional();

      // Assert
      expect(conditional.isTimeRange).toBe(false);
    });

    it('defaults isFullDateRange to false', () =>
    {
      // Arrange & Act
      const conditional = new TimeConditional();

      // Assert
      expect(conditional.isFullDateRange).toBe(false);
    });

    it('defaults every scalar time field to -1 (unset)', () =>
    {
      // Arrange & Act
      const conditional = new TimeConditional();

      // Assert
      expect(conditional.seconds).toBe(-1);
      expect(conditional.minutes).toBe(-1);
      expect(conditional.hours).toBe(-1);
      expect(conditional.days).toBe(-1);
      expect(conditional.months).toBe(-1);
      expect(conditional.years).toBe(-1);
      expect(conditional.timeOfDay).toBe(-1);
      expect(conditional.seasonOfYear).toBe(-1);
    });

    it('defaults startRange and endRange to empty arrays', () =>
    {
      // Arrange & Act
      const conditional = new TimeConditional();

      // Assert
      expect(conditional.startRange).toEqual([]);
      expect(conditional.endRange).toEqual([]);
    });
  });

  describe('range field overwrite', () =>
  {
    it('allows overwriting startRange/endRange for a time-range conditional', () =>
    {
      // Arrange
      const conditional = new TimeConditional();

      // Act
      conditional.isTimeRange = true;
      conditional.startRange = [ 8, 0 ];
      conditional.endRange = [ 9, 0 ];

      // Assert
      expect(conditional.isTimeRange).toBe(true);
      expect(conditional.startRange).toEqual([ 8, 0 ]);
      expect(conditional.endRange).toEqual([ 9, 0 ]);
    });
  });
});
//endregion plugins/time/time-conditional-direct.test.js
