//region plugins/time/core/managers/time-phases.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('TimePhases', () =>
{
  let TimePhases;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the phase maths is pure- no plugin metadata, no engine globals, nothing to install.
    ({ default: TimePhases } = await import('../../../../../src/plugins/time/core/managers/TimePhases.js'));
  });

  describe('isClockHour', () =>
  {
    it('accepts the first hour of the day', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour(0);

      // Assert
      expect(result).toBe(true);
    });

    it('accepts the last hour of the day', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour(23);

      // Assert
      expect(result).toBe(true);
    });

    it('rejects an hour past the end of the clock', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour(24);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a negative hour, which the time-losing commands can produce', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour(-1);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a fractional hour', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour(7.5);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a value that is not a number at all', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.isClockHour('noon');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('phaseOfHour', () =>
  {
    // every hour of the day and the phase it belongs to. the boundary hours matter most- 3 and 4 sit
    // either side of the first phase change, so a bucket that was one hour wide or one hour narrow
    // would show up here rather than passing on a lucky sample.
    const expectedByHour = [
      0, 0, 0, 0,
      1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3,
      4, 4, 4, 4,
      5, 5, 5, 5, ];

    expectedByHour.forEach((expected, hour) =>
    {
      it(`buckets hour ${hour} into phase ${expected}`, () =>
      {
        // Arrange
        // Act
        const result = TimePhases.phaseOfHour(hour);

        // Assert
        expect(result).toBe(expected);
      });
    });

    it('returns the unknown sentinel for an hour off the clock', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.phaseOfHour(99);

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('startOfPhase', () =>
  {
    it('starts the first phase at midnight', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.startOfPhase(0);

      // Assert
      expect(result).toBe(0);
    });

    it('starts a later phase a whole number of phase-widths in', () =>
    {
      // Arrange
      // Act
      const result = TimePhases.startOfPhase(3);

      // Assert
      expect(result).toBe(12);
    });
  });

});
//endregion plugins/time/core/managers/time-phases.test.js