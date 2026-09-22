//region plugins/weather/ext/time/core/forecast-voice.test.js
import { describe, expect, it } from 'vitest';
import ForecastVoice from '../../../../../../src/plugins/weather/ext/time/core/ForecastVoice.js';

/**
 * Somebody's opinion of the weather, instead of a readout of it.
 *
 * **Two things here are quietly load-bearing and both are tested against a near miss.** A line
 * belongs to an actor, and an actor who has not joined yet must never speak - a remark from
 * somebody the player has not met is a spoiler with a face attached. And a preset that writes
 * only `any` has to serve every strength, or an author owes forty-five states before the screen
 * says anything at all.
 */
describe('ForecastVoice', () =>
{
  // Jerald is 1 and Rupert is 2 in Chef Adventure; 9 is somebody not yet recruited.
  const jerald = 1;
  const rupert = 2;
  const stranger = 9;

  /**
   * Lines written for a few looks, in the shapes the config permits.
   * @returns {object}
   */
  const buildVoices = () => ({
    none: {
      any: [ { who: jerald, says: 'dry in here' } ],
    },
    rain: {
      any: [
        { who: jerald, says: 'wet one' },
        { who: rupert, says: 'i hate this' },
      ],
      heavy: [ { who: rupert, says: 'this is absurd' } ],
    },
    snow: {
      any: [ { who: stranger, says: 'a line from somebody not here' } ],
    },
  });

  describe('linesFor', () =>
  {
    it('reads the lines written for a look at any strength', () =>
    {
      // Arrange - `rain` at light, which has no strength-specific lines of its own.
      const result = ForecastVoice.linesFor(buildVoices(), { preset: 'rain', intensity: 'light' });

      // Assert.
      expect(result.map(line => line.says))
        .toEqual([ 'wet one', 'i hate this' ]);
    });

    it('prefers lines written for that exact strength', () =>
    {
      // Arrange - `rain` at heavy, which does. The `any` lines must not leak in beside them.
      const result = ForecastVoice.linesFor(buildVoices(), { preset: 'rain', intensity: 'heavy' });

      // Assert.
      expect(result.map(line => line.says))
        .toEqual([ 'this is absurd' ]);
    });

    it('reads the sheltered lines where nothing is falling', () =>
    {
      // Arrange - indoors, which is where most of the game happens.
      const result = ForecastVoice.linesFor(buildVoices(), null);

      // Assert.
      expect(result.map(line => line.says))
        .toEqual([ 'dry in here' ]);
    });

    it('reads nothing for a look nobody has written for', () =>
    {
      // Arrange - an ordinary state of a game still being written.
      const result = ForecastVoice.linesFor(buildVoices(), { preset: 'sakura', intensity: 'light' });

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('reads nothing for a look written with neither a strength nor an any', () =>
    {
      // Arrange - a half-authored entry, which should behave as unwritten rather than throw.
      const voices = buildVoices();
      voices.fog = {};

      // Act.
      const result = ForecastVoice.linesFor(voices, { preset: 'fog', intensity: 'light' });

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('spokenBy', () =>
  {
    it('keeps a line whose speaker is travelling with the player', () =>
    {
      // Arrange.
      const lines = [ { who: jerald, says: 'a' }, { who: stranger, says: 'b' } ];

      // Act.
      const result = ForecastVoice.spokenBy(lines, [ jerald, rupert ]);

      // Assert - the stranger's line is gone and Jerald's survives, so this is a filter rather
      // than an all-or-nothing gate.
      expect(result.map(line => line.says))
        .toEqual([ 'a' ]);
    });

    it('keeps nothing when nobody present has written a line', () =>
    {
      // Arrange.
      const lines = [ { who: stranger, says: 'b' } ];

      // Act.
      const result = ForecastVoice.spokenBy(lines, [ jerald, rupert ]);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('pick', () =>
  {
    it('picks the first line on a low roll', () =>
    {
      // Arrange.
      const lines = [ { says: 'a' }, { says: 'b' }, { says: 'c' } ];

      // Act.
      const result = ForecastVoice.pick(lines, 0.1);

      // Assert.
      expect(result.says)
        .toBe('a');
    });

    it('picks the middle line on a middling roll', () =>
    {
      // Arrange - the entry that a naive first-or-last implementation would never reach.
      const lines = [ { says: 'a' }, { says: 'b' }, { says: 'c' } ];

      // Act.
      const result = ForecastVoice.pick(lines, 0.5);

      // Assert.
      expect(result.says)
        .toBe('b');
    });

    it('picks the last line rather than running off the end', () =>
    {
      // Arrange - a roll of exactly one is outside [0, 1) but floating point produces it, and it
      // would otherwise index one past the array.
      const lines = [ { says: 'a' }, { says: 'b' }, { says: 'c' } ];

      // Act.
      const result = ForecastVoice.pick(lines, 1);

      // Assert.
      expect(result.says)
        .toBe('c');
    });

    it('picks nothing from nothing', () =>
    {
      // Act.
      const result = ForecastVoice.pick([], 0.5);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('remarkFor', () =>
  {
    it('hands back a line from somebody who is actually here', () =>
    {
      // Arrange - only Jerald is travelling, and the roll would otherwise reach Rupert's line.
      const result = ForecastVoice.remarkFor(
        buildVoices(),
        { preset: 'rain', intensity: 'light' },
        [ jerald ],
        0.9);

      // Assert - the filter happens before the roll, so a party of one always gets their own line
      // rather than sometimes getting nothing.
      expect(result)
        .toEqual({ who: jerald, says: 'wet one' });
    });

    it('says nothing when the only line belongs to somebody not yet met', () =>
    {
      // Arrange - `snow` is written, and written entirely by a stranger. A remark from them here
      // would be a spoiler with a face attached.
      const result = ForecastVoice.remarkFor(
        buildVoices(),
        { preset: 'snow', intensity: 'light' },
        [ jerald, rupert ],
        0.5);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('says nothing for a look nobody has written for', () =>
    {
      // Arrange.
      const result = ForecastVoice.remarkFor(
        buildVoices(),
        { preset: 'sakura', intensity: 'light' },
        [ jerald, rupert ],
        0.5);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('varies between the people who are here', () =>
    {
      // Arrange - both present, both with a line. Two rolls at opposite ends, which is what
      // separates "picks somebody" from "always picks the first author".
      const voices = buildVoices();
      const present = [ jerald, rupert ];

      // Act.
      const low = ForecastVoice.remarkFor(voices, { preset: 'rain', intensity: 'light' }, present, 0);
      const high = ForecastVoice.remarkFor(voices, { preset: 'rain', intensity: 'light' }, present, 0.9);

      // Assert.
      expect(low.who)
        .toBe(jerald);
      expect(high.who)
        .toBe(rupert);
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-voice.test.js