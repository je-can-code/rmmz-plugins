//region plugins/lighting/ext/time/managers/time-tone-resolver.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installLightingTimeGlobals } from '../fixtures/install-lighting-time-globals.js';

describe('TimeToneResolver', () =>
{
  let TimeToneResolver;

  // the colours J-TIME shipped with, in the order a day cycles through them. the sequence opens on
  // the phase the clock calls id 0 - Night - and night is listed again at the end, because the last
  // phase of the day is travelling back toward it.
  const toneSequence = [
    [ -100, -100, -30, 100 ],
    [ -30, -15, 15, 64 ],
    [ 0, 0, 0, 0 ],
    [ 10, 10, 10, 10 ],
    [ 0, -30, -30, -30 ],
    [ -68, -68, 0, 68 ],
    [ -100, -100, -30, 100 ], ];

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingTimeGlobals();

    ({ default: TimeToneResolver } =
      await import('../../../../../../src/plugins/lighting/ext/time/managers/TimeToneResolver.js'));
  });

  describe('rateIntoPhase', () =>
  {
    it('opens a phase having travelled nowhere at all', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.rateIntoPhase(4);

      // Assert
      // this is the whole alignment: a phase begins sitting on its own value, which is what makes
      // the hours the clock calls Night actually look like night.
      expect(result).toBe(0);
    });

    it('reports a quarter of the way across on the second hour of a phase', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.rateIntoPhase(5);

      // Assert
      expect(result).toBe(0.25);
    });

    it('stops short of the destination on the final hour of a phase', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.rateIntoPhase(7);

      // Assert
      // never 1: the value it is travelling toward belongs to the next phase, and that phase opens
      // by sitting on it. arriving here would hold one value for two hours.
      expect(result).toBe(0.75);
    });

    it('restarts the journey on the first hour of the next phase', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.rateIntoPhase(8);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('toneOfHour', () =>
  {
    // the tone every hour of the day resolves to. this is the regression net for the day/night
    // cycle- if a tone here moves, the game looks different at that hour.
    //
    // read the six anchors rather than the whole list: hours 0, 4, 8, 12, 16 and 20 are each phase's
    // own colour exactly, because a phase opens on its namesake. the hours between them are the
    // fade, and every one of them was observed rather than derived.
    const expectedByHour = [
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
      [ -76, -76, -8, 76 ],
      [ -84, -84, -15, 84 ],
      [ -92, -92, -23, 92 ],
    ];

    expectedByHour.forEach((expected, hour) =>
    {
      it(`resolves hour ${hour} to its designated tone`, () =>
      {
        // Arrange
        // Act
        const result = TimeToneResolver.toneOfHour(hour, toneSequence);

        // Assert
        expect(result).toEqual(expected);
      });
    });

    it('opens a phase on that phase tone exactly', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.toneOfHour(4, toneSequence);

      // Assert
      // deliberately the second phase rather than the first: hour 0 would land on index zero whether
      // the phase was being looked up or ignored entirely, and could not tell those apart.
      expect(result).toEqual([ -30, -15, 15, 64 ]);
    });

    it('has not yet arrived at the next phase on the last hour of this one', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.toneOfHour(3, toneSequence);

      // Assert
      // the fade stops short of its destination on purpose - the next phase opens by sitting on it,
      // so arriving an hour early would hold the same tone for two hours and stall the cycle.
      expect(result).not.toEqual([ -30, -15, 15, 64 ]);
      expect(result).toEqual([ -47, -36, 4, 73 ]);
    });

    it('resolves an hour off the clock to a neutral tone', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.toneOfHour(99, toneSequence);

      // Assert
      expect(result).toEqual([ 0, 0, 0, 0 ]);
    });

    it('hands back a neutral tone the caller can keep without corrupting the next one', () =>
    {
      // Arrange
      const first = TimeToneResolver.toneOfHour(99, toneSequence);

      // Act
      first[0] = 12345;
      const second = TimeToneResolver.toneOfHour(99, toneSequence);

      // Assert
      expect(second).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('darknessOfHour', () =>
  {
    // every phase carries a different darkness on purpose. a sequence of identical values could not
    // tell "reads the phase it is in" apart from "reads any phase at all", and neither could one
    // where the interesting value sat at index zero.
    const darknessSequence = [ 0.5, 0.9, 0.4, 0, 0, 0.2, 0.5 ];

    it('lands on a phase darkness exactly at the first hour of that phase', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.darknessOfHour(4, darknessSequence);

      // Assert
      // the second phase rather than the first, so reading index zero by accident cannot pass.
      expect(result).toBe(0.9);
    });

    it('sits a quarter of the way toward the next phase on the hour after that', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.darknessOfHour(1, darknessSequence);

      // Assert
      expect(result).toBe(0.6);
    });

    it('travels downward when the next phase is brighter than this one', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.darknessOfHour(6, darknessSequence);

      // Assert
      // phase 1 sits at 0.9 and phase 2 at 0.4, so halfway across is genuinely a descent rather than
      // the climb every other case in this block measures.
      expect(result).toBeCloseTo(0.65, 10);
    });

    it('stays put across a phase whose neighbours agree with it', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.darknessOfHour(13, darknessSequence);

      // Assert
      expect(result).toBe(0);
    });

    it('takes no light away at an hour off the clock', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.darknessOfHour(99, darknessSequence);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('between', () =>
  {
    it('interpolates upward toward a brighter destination channel', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ 100, 0, 0, 0 ], 0.5);

      // Assert
      expect(result).toEqual([ 50, 0, 0, 0 ]);
    });

    it('interpolates downward toward a darker destination channel', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ -100, 0, 0, 0 ], 0.5);

      // Assert
      expect(result).toEqual([ -50, 0, 0, 0 ]);
    });

    it('moves each channel its own share of the distance', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 20, -40, 8 ], [ 100, 0, 40, 0 ], 0.5);

      // Assert
      expect(result).toEqual([ 50, 10, 0, 4 ]);
    });

    it('lands on the starting tone at a rate of zero', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 12, -34, 56, 7 ], [ 100, 100, 100, 100 ], 0);

      // Assert
      expect(result).toEqual([ 12, -34, 56, 7 ]);
    });

    it('lands on the destination tone at a rate of one', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 12, -34, 56, 7 ], [ 100, 100, 100, 100 ], 1);

      // Assert
      expect(result).toEqual([ 100, 100, 100, 100 ]);
    });

    it('rounds a fractional channel result, since tones are whole numbers', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.between([ 0, 0, 0, 0 ], [ 5, 0, 0, 0 ], 0.5);

      // Assert
      expect(result).toEqual([ 3, 0, 0, 0 ]);
    });
  });

  describe('isSameTone', () =>
  {
    it('returns false when the current tone is not yet a full rgba quad', () =>
    {
      // Arrange
      // Act
      const result = TimeToneResolver.isSameTone([], [ 0, 0, 0, 0 ]);

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
});
//endregion plugins/lighting/ext/time/managers/time-tone-resolver.test.js