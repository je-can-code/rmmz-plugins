//region plugins/sdp/core/managers/mastery-prose-resolver.test.js
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

/**
 * The resolver's contract is that it fails closed: a template renders only when every token in it
 * resolves, because a half-filled sentence would show a player a number that is not the number, at
 * the exact moment they are deciding whether to spend twenty rank-ups. Most tests below therefore
 * pin the empty string, so each pairs that with a positive case proving the render path actually runs.
 */
describe('MasteryProseResolver (direct src import)', () =>
{
  let MasteryProseResolver;

  const stateWithNote = (note) => ({ note });

  beforeAll(async () =>
  {
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        configurable: true,
      });
    }

    globalThis.$dataStates = [];

    ({ default: MasteryProseResolver } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryProseResolver.js'));
  });

  afterEach(() =>
  {
    globalThis.$dataStates = [];
  });

  //region resolve
  describe('resolve', () =>
  {
    it('renders a single-tag token into the sentence', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('Every cooldown runs {v.cdr} shorter.', 1470);

      // Assert
      expect(result).toBe('Every cooldown runs +30% shorter.');
    });

    it('yields nothing for a blank template', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve(String.empty, 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when the mastery state does not exist', () =>
    {
      // Arrange: 9999 is deliberately absent from the table seeded above.
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('Every cooldown runs {v.cdr} shorter.', 9999);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when a token names a tag the state does not carry', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('It runs {v.speedBoost} faster.', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when one token of several cannot resolve', () =>
    {
      // Arrange: the first token is satisfiable, so only the second can be failing the render.
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('{v.cdr} shorter and {v.lst} stolen.', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('renders a template carrying no tokens at all', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('A warchief does not wait.', 1470);

      // Assert
      expect(result).toBe('A warchief does not wait.');
    });

    it('reads the magnitude from a multi-argument tag', () =>
    {
      // Arrange
      globalThis.$dataStates[1101] = stateWithNote('<skillHistoryBonus:[0, 6, 4, unique]>');

      // Act
      const result = MasteryProseResolver.resolve('gain {v.skillHistoryBonus} damage', 1101);

      // Assert: the final argument is the mode word, so the value half is that word.
      expect(result).toBe('gain unique damage');
    });

    it('reads a bare tag written without brackets', () =>
    {
      // Arrange
      globalThis.$dataStates[1571] = stateWithNote('<sdpMultiplier:3>');

      // Act
      const result = MasteryProseResolver.resolve('{v.sdpMultiplier} more points', 1571);

      // Assert
      expect(result).toBe('+3% more points');
    });

    it('renders a negative magnitude without inventing a plus sign', () =>
    {
      // Arrange
      globalThis.$dataStates[1061] = stateWithNote('<speedBoost:[-5]>');

      // Act
      const result = MasteryProseResolver.resolve('slows by {v.speedBoost}', 1061);

      // Assert
      expect(result).toBe('slows by -5%');
    });

    it('refuses a bare token when the tag appears more than once', () =>
    {
      // Arrange: two occurrences make "the value of this tag" ambiguous, and guessing would print a
      // plausible wrong number.
      globalThis.$dataStates[1191] = stateWithNote('<boostElement:[8, 11]>\n<boostElement:[9, 22]>');

      // Act
      const result = MasteryProseResolver.resolve('strikes {v.boostElement} harder', 1191);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('picks the occurrence a selector names, leaving its sibling alone', () =>
    {
      // Arrange: the sibling shares the tag name and must survive the selection unchosen.
      globalThis.$dataStates[1191] = stateWithNote('<boostElement:[8, 11]>\n<boostElement:[9, 22]>');

      // Act
      const result = MasteryProseResolver.resolve('Void strikes {v.boostElement[9]} harder', 1191);

      // Assert
      expect(result).toBe('Void strikes +22% harder');
    });

    it('yields nothing when a selector matches no occurrence', () =>
    {
      // Arrange
      globalThis.$dataStates[1191] = stateWithNote('<boostElement:[8, 11]>\n<boostElement:[9, 22]>');

      // Act
      const result = MasteryProseResolver.resolve('strikes {v.boostElement[4]} harder', 1191);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a parameter token, which this build cannot resolve yet', () =>
    {
      // Arrange
      globalThis.$dataStates[1141] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('Endurance {p.def}.', 1141);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion resolve

  //region canResolve
  describe('canResolve', () =>
  {
    it('reports true for a template whose tokens all resolve', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.canResolve('runs {v.cdr} shorter', 1470);

      // Assert
      expect(result).toBe(true);
    });

    it('reports false for a template carrying an unresolvable token', () =>
    {
      // Arrange
      globalThis.$dataStates[1470] = stateWithNote('<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.canResolve('Endurance {p.def}.', 1470);

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion canResolve

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryProseResolver()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-prose-resolver.test.js