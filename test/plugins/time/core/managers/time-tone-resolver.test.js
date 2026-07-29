//region plugins/time/core/managers/time-tone-resolver.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('TimeToneResolver', () =>
{
  let TimeToneResolver;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the resolver is pure- no plugin metadata, no engine globals, nothing to install.
    ({ default: TimeToneResolver } =
      await import('../../../../../src/plugins/time/core/managers/TimeToneResolver.js'));
  });

  describe('isClockHour', () =>
  {
    it('accepts the first hour of the day', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(0);

      // Assert
      expect(result).toBe(true);
    });

    it('accepts the last hour of the day', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(23);

      // Assert
      expect(result).toBe(true);
    });

    it('rejects an hour past the end of the clock', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(24);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a negative hour, which the time-losing commands can produce', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(-1);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a fractional hour', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(3.5);

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a value that is not a number at all', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isClockHour(Number.NaN);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('phaseOfHour', () =>
  {
    // every hour of the day paired with the phase that owns it.
    const expectedPhases = [
      0, 0, 0, 0,
      1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3,
      4, 4, 4, 4,
      5, 5, 5, 5,
    ];

    expectedPhases.forEach((expected, hour) =>
    {
      it(`buckets hour ${hour} into phase ${expected}`, () =>
      {
        // Arrange
        // Act
        const result = TimeToneResolver.phaseOfHour(hour);

        // Assert
        expect(result).toBe(expected);
      });
    });

    it('returns the unknown sentinel for an hour off the clock', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.phaseOfHour(99);

      // Assert
      expect(result).toBe(TimeToneResolver.unknownPhase);
    });
  });

  describe('startOfPhase', () =>
  {
    it('starts the first phase at midnight', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.startOfPhase(0);

      // Assert
      expect(result).toBe(0);
    });

    it('starts a later phase a whole number of phase-widths in', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.startOfPhase(3);

      // Assert
      expect(result).toBe(12);
    });
  });

  describe('between', () =>
  {
    it('interpolates upward toward a brighter destination channel', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ 100, 100, 100, 100 ], 0.5);

      // Assert
      expect(result).toEqual([ 50, 50, 50, 50 ]);
    });

    it('interpolates downward toward a darker destination channel', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 100, 100, 100, 100 ], [ 0, 0, 0, 0 ], 0.25);

      // Assert
      expect(result).toEqual([ 75, 75, 75, 75 ]);
    });

    it('moves each channel its own share of the distance', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ 10, 20, 30, 40 ], 0.5);

      // Assert
      expect(result).toEqual([ 5, 10, 15, 20 ]);
    });

    it('lands on the starting tone at a rate of zero', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 10, 20, 30, 40 ], [ 0, 0, 0, 0 ], 0);

      // Assert
      expect(result).toEqual([ 10, 20, 30, 40 ]);
    });

    it('lands on the destination tone at a rate of one', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 10, 20, 30, 40 ], [ 0, 0, 0, 0 ], 1);

      // Assert
      expect(result).toEqual([ 0, 0, 0, 0 ]);
    });

    it('rounds a fractional channel result, since tones are whole numbers', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ 5, 5, 5, 5 ], 0.5);

      // Assert
      // 5 * 0.5 is 2.5, which rounds up to 3.
      expect(result).toEqual([ 3, 3, 3, 3 ]);
    });
  });

  describe('isSameTone', () =>
  {
    it('returns false when the current tone is not yet a full rgba quad', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([], [ 1, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the red channel differs', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([ 1, 2, 3, 4 ], [ 9, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the green channel differs', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([ 1, 2, 3, 4 ], [ 1, 9, 3, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the blue channel differs', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([ 1, 2, 3, 4 ], [ 1, 2, 9, 4 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the grey channel differs', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([ 1, 2, 3, 4 ], [ 1, 2, 3, 9 ]);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when every channel matches', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([ 1, 2, 3, 4 ], [ 1, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('toneOfHour', () =>
  {
    // the tone every hour of the day resolves to, captured from the implementation this replaced.
    // this is the regression net for the day/night cycle- if a tone here moves, the game looks
    // different at that hour.
    const expectedByHour = [
      [ -76, -76, -8, 76 ],
      [ -84, -84, -15, 84 ],
      [ -92, -92, -23, 92 ],
      [ -100, -100, -30, 100 ],
      [ -82, -79, -19, 91 ],
      [ -65, -57, -7, 82 ],
      [ -47, -36, 4, 73 ],
      [ -30, -15, 15, 64 ],
      [ -22, -11, 11, 48 ],
      [ -15, -7, 7, 32 ],
      [ -7, -4, 4, 16 ],
      [ 0, 0, 0, 0 ],
      [ 3, 3, 3, 3 ],
      [ 5, 5, 5, 5 ],
      [ 8, 8, 8, 8 ],
      [ 10, 10, 10, 10 ],
      [ 7, 0, 0, 0 ],
      [ 5, -10, -10, -10 ],
      [ 2, -20, -20, -20 ],
      [ 0, -30, -30, -30 ],
      [ -17, -40, -22, -5 ],
      [ -34, -49, -15, 19 ],
      [ -51, -59, -7, 44 ],
      [ -68, -68, 0, 68 ],
    ];

    expectedByHour.forEach((expected, hour) =>
    {
      it(`resolves hour ${hour} to its designated tone`, () =>
      {
        // Arrange
        // Act
        const result = TimeToneResolver.toneOfHour(hour);

        // Assert
        expect(result).toEqual(expected);
      });
    });

    it('resolves the last hour of a phase to that phase tone exactly', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.toneOfHour(3);

      // Assert
      expect(result).toEqual(TimeToneResolver.toneOfDay.Night);
    });

    it('resolves an hour off the clock to a neutral tone', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.toneOfHour(99);

      // Assert
      expect(result).toEqual([ 0, 0, 0, 0 ]);
    });

    it('hands back a neutral tone the caller can keep without corrupting the next one', () =>
    {
      // Arrange
      const first = TimeToneResolver.toneOfHour(99);

      // Act
      first[0] = 12345;
      const second = TimeToneResolver.toneOfHour(99);

      // Assert
      expect(second).toEqual([ 0, 0, 0, 0 ]);
    });
  });
});
//endregion plugins/time/core/managers/time-tone-resolver.test.js
