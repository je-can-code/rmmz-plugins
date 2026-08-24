//region plugins/diff/ext/affix/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The chance alias multiplies whatever the base resolver produced rather than replacing it, so that
 * an event comment or enemy note still decides the baseline and the difficulty only says how much of
 * it applies. Both halves of that are tested: the multiplication itself, and the fact that what is
 * multiplied is the resolved value and not the plugin default.
 */
describe('Game_Event affix chance scaling (direct src import)', () =>
{
  let baseResolvedPrefixChance;
  let baseResolvedSuffixChance;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      DIFFICULTY: { EXT: { AFFIX: { Aliased: { Game_Event: new Map() } } } },
    };

    globalThis.Game_Event = function Game_Event()
    {
    };

    // stands in for the base resolver, whose own precedence chain is J-Passive-Affix's business.
    globalThis.Game_Event.prototype.getResolvedPassiveAffixPrefixChance = function()
    {
      return baseResolvedPrefixChance;
    };

    globalThis.Game_Event.prototype.getResolvedPassiveAffixSuffixChance = function()
    {
      return baseResolvedSuffixChance;
    };

    // the engine's own numeric clamp, which the alias relies on to keep the result rollable.
    Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };

    await import('../../../../../../src/plugins/diff/ext/affix/objects/Game_Event.js');
  });

  /**
   * Points the extension metadata at fixed combined factors.
   * @param {number} prefixFactor The factor to scale a prefix chance by.
   * @param {number} suffixFactor The factor to scale a suffix chance by.
   */
  function installFactors(prefixFactor, suffixFactor)
  {
    globalThis.J.DIFFICULTY.EXT.AFFIX.Metadata = {
      prefixChanceFactor: () => prefixFactor,
      suffixChanceFactor: () => suffixFactor,
    };
  }

  beforeEach(() =>
  {
    baseResolvedPrefixChance = 8;
    baseResolvedSuffixChance = 8;
    installFactors(1, 1);
  });

  describe('getResolvedPassiveAffixPrefixChance', () =>
  {
    it('leaves the resolved chance alone at an identity factor', () =>
    {
      // Arrange & Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(8);
    });

    it('scales the resolved chance by the combined factor', () =>
    {
      // Arrange
      installFactors(1.5, 1);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(12);
    });

    it('scales whatever the base resolver produced, not a fixed default', () =>
    {
      // Arrange- a different baseline, so "multiplied the resolved value" and "multiplied the
      // plugin default" give different answers.
      baseResolvedPrefixChance = 40;
      installFactors(1.5, 1);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(60);
    });

    it('clamps a scaled chance back down to one hundred', () =>
    {
      // Arrange- the base resolver's plugin-default branch does not clamp at all, and multiplying
      // can leave the range regardless of where it started.
      baseResolvedPrefixChance = 80;
      installFactors(2, 1);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(100);
    });

    it('leaves a chance pinned to zero at zero', () =>
    {
      // Arrange- a boss opted out of affixes stays opted out however generous the difficulty is,
      // because no multiplier moves zero.
      baseResolvedPrefixChance = 0;
      installFactors(5, 1);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(0);
    });

    it('suppresses the slot entirely at a factor of zero', () =>
    {
      // Arrange
      installFactors(0, 1);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixPrefixChance({});

      // Assert
      expect(chance).toBe(0);
    });
  });

  describe('getResolvedPassiveAffixSuffixChance', () =>
  {
    it('leaves the resolved chance alone at an identity factor', () =>
    {
      // Arrange & Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixSuffixChance({});

      // Assert
      expect(chance).toBe(8);
    });

    it('scales the resolved chance by the combined suffix factor', () =>
    {
      // Arrange- the two factors differ, so an alias reading the prefix factor would be caught.
      installFactors(5, 2);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixSuffixChance({});

      // Assert
      expect(chance).toBe(16);
    });

    it('clamps a scaled chance back down to one hundred', () =>
    {
      // Arrange
      baseResolvedSuffixChance = 60;
      installFactors(1, 3);

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixSuffixChance({});

      // Assert
      expect(chance).toBe(100);
    });

    it('reads the suffix baseline rather than the prefix one', () =>
    {
      // Arrange- the two baselines differ, so a mixed-up alias gives the wrong number.
      baseResolvedPrefixChance = 90;
      baseResolvedSuffixChance = 20;

      // Act
      const chance = new globalThis.Game_Event().getResolvedPassiveAffixSuffixChance({});

      // Assert
      expect(chance).toBe(20);
    });
  });
});
//endregion plugins/diff/ext/affix/objects/game-event.test.js