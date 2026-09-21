//region plugins/_base/database/rpg-base-battler-elements.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * A battler's elemental profile is authored as traits, but read as identity: something strongly
 * resistant to fire is a fire creature, and something strongly weak to anti-undead damage is undead.
 * These two methods are the numeric half of that reading, deliberately knowing nothing about how any
 * particular project names its elements.
 */
describe('RPG_BaseBattler element inference (direct src import)', () =>
{
  let RPG_BaseBattler;

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: RPG_BaseBattler } = await import(
      '../../../../../src/plugins/_base/core/database/core/RPG_BaseBattler.js'));
  });

  beforeEach(() =>
  {
    // seven real elements plus RMMZ's unused index 0, which must never be inferred.
    globalThis.$dataSystem = {
      elements: [ '', 'Fire', 'Ice', 'Thunder', 'Water', 'Earth', 'Wind', 'Light' ],
    };
  });

  /**
   * Builds a battler stand-in carrying the given traits, without running any constructor.
   * @param {Array<{code: number, dataId: number, value: number}>} traits The database traits.
   * @returns {RPG_BaseBattler}
   */
  function buildBattler(traits)
  {
    const battler = Object.create(RPG_BaseBattler.prototype);
    battler.traits = traits;

    return battler;
  }

  /**
   * Builds an element rate trait.
   * @param {number} dataId The element id.
   * @param {number} value The rate multiplier.
   * @returns {{code: number, dataId: number, value: number}}
   */
  function elementRate(dataId, value)
  {
    return {
      code: 11,
      dataId,
      value,
    };
  }

  /**
   * Builds a non-element-rate trait, for proving the filter actually discriminates.
   * @param {number} dataId The trait's data id.
   * @param {number} value The trait's value.
   * @returns {{code: number, dataId: number, value: number}}
   */
  function attackElement(dataId, value)
  {
    return {
      code: 31,
      dataId,
      value,
    };
  }

  describe('elementRates', () =>
  {
    it('defaults every element to a neutral rate when no rate traits exist', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act
      const rates = battler.elementRates();

      // Assert
      expect(rates).toEqual([ 1, 1, 1, 1, 1, 1, 1, 1 ]);
    });

    it('applies a rate trait to its own element and leaves the others neutral', () =>
    {
      // Arrange
      const battler = buildBattler([ elementRate(2, 0.25) ]);

      // Act
      const rates = battler.elementRates();

      // Assert
      expect(rates[2]).toBe(0.25);
      expect(rates[1]).toBe(1);
      expect(rates[3]).toBe(1);
    });

    it('multiplies two rate traits that name the same element', () =>
    {
      // Arrange- stacking is how the engine itself accumulates element rates.
      const battler = buildBattler([ elementRate(4, 0.5), elementRate(4, 0.5) ]);

      // Act
      const rates = battler.elementRates();

      // Assert
      expect(rates[4]).toBe(0.25);
    });

    it('ignores traits that are not element rates', () =>
    {
      // Arrange- an attack-element trait names an element too, and must not be read as a rate.
      const battler = buildBattler([ attackElement(3, 0.1), elementRate(6, 3) ]);

      // Act
      const rates = battler.elementRates();

      // Assert
      expect(rates[3]).toBe(1);
      expect(rates[6]).toBe(3);
    });
  });

  describe('inferredElementIds', () =>
  {
    it('infers an element the battler strongly resists', () =>
    {
      // Arrange
      const battler = buildBattler([ elementRate(1, 0.2) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert
      expect(ids).toEqual([ 1 ]);
    });

    it('infers an element the battler is strongly weak to', () =>
    {
      // Arrange
      const battler = buildBattler([ elementRate(5, 2) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert
      expect(ids).toEqual([ 5 ]);
    });

    it('does not infer an element sitting between the two thresholds', () =>
    {
      // Arrange- a near-miss sibling that must survive: mild deviation is not identity.
      const battler = buildBattler([ elementRate(2, 0.9), elementRate(3, 0.2) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert- only the sharp one is identifying, proving the mild one was actually considered.
      expect(ids).toEqual([ 3 ]);
    });

    it('does not infer an element sitting exactly on the resist threshold', () =>
    {
      // Arrange- the comparison is strict, so the boundary value itself does not qualify.
      const battler = buildBattler([ elementRate(2, 0.75), elementRate(6, 0.1) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert
      expect(ids).toEqual([ 6 ]);
    });

    it('does not infer an element sitting exactly on the weakness threshold', () =>
    {
      // Arrange
      const battler = buildBattler([ elementRate(2, 1.25), elementRate(6, 4) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert
      expect(ids).toEqual([ 6 ]);
    });

    it('never infers element id zero, however sharply it deviates', () =>
    {
      // Arrange- index 0 is RMMZ's unused "no element" slot and characterizes nothing.
      const battler = buildBattler([ elementRate(0, 0.01), elementRate(7, 5) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert- element 7 proves the loop ran; element 0 proves it was deliberately skipped.
      expect(ids).toEqual([ 7 ]);
    });

    it('infers resisted and weak elements together, in ascending id order', () =>
    {
      // Arrange
      const battler = buildBattler([ elementRate(6, 3), elementRate(2, 0.1), elementRate(4, 1) ]);

      // Act
      const ids = battler.inferredElementIds(0.75, 1.25);

      // Assert
      expect(ids).toEqual([ 2, 6 ]);
    });
  });
});
//endregion plugins/_base/database/rpg-base-battler-elements.test.js
