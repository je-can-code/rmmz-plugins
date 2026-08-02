//region plugins/abs/core/_component/game-battler-range-modifiers.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  return battler;
}

describe('J-ABS Game_Battler range modifiers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('flat buffs', () =>
  {
    it('getRangeBuff sums all <rangeBuff:N> tags', () =>
    {
      expect(buildBattler([ '<rangeBuff:1>', '<rangeBuff:2>' ]).getRangeBuff()).toBe(3);
    });

    it('getRangeBuff is 0 with no matching tags', () =>
    {
      expect(buildBattler().getRangeBuff()).toBe(0);
    });

    it('getRadiusBuff sums all <radiusBuff:N> tags', () =>
    {
      expect(buildBattler([ '<radiusBuff:2>' ]).getRadiusBuff()).toBe(2);
    });

    it('getProximityBuff sums all <proximityBuff:N> tags', () =>
    {
      expect(buildBattler([ '<proximityBuff:3>' ]).getProximityBuff()).toBe(3);
    });

    it('getThicknessBuff sums all <thicknessBuff:N> tags', () =>
    {
      expect(buildBattler([ '<thicknessBuff:1>' ]).getThicknessBuff()).toBe(1);
    });
  });

  describe('multiplicative rates', () =>
  {
    it('getRangeRate starts at 1.0 and accumulates each tag\'s delta from 1.0', () =>
    {
      // Arrange- 1.0 + (1.5-1.0) + (2.0-1.0) = 2.5.
      const battler = buildBattler([ '<rangeRate:1.5>', '<rangeRate:2.0>' ]);

      // Act & Assert
      expect(battler.getRangeRate()).toBeCloseTo(2.5);
    });

    it('getRangeRate is exactly 1.0 with no matching tags', () =>
    {
      expect(buildBattler().getRangeRate()).toBe(1.0);
    });

    it('getRadiusRate starts at 0 and accumulates each tag\'s delta from 1.0', () =>
    {
      // Arrange- (1.5-1.0) = 0.5.
      const battler = buildBattler([ '<radiusRate:1.5>' ]);

      // Act & Assert
      expect(battler.getRadiusRate()).toBeCloseTo(0.5);
    });

    it('getRadiusRate is exactly 0 with no matching tags', () =>
    {
      expect(buildBattler().getRadiusRate()).toBe(0);
    });

    it('getProximityRate starts at 0 and accumulates each tag\'s delta from 1.0', () =>
    {
      // Arrange- (2.0-1.0) = 1.0.
      const battler = buildBattler([ '<proximityRate:2.0>' ]);

      // Act & Assert
      expect(battler.getProximityRate()).toBeCloseTo(1.0);
    });

    it('getThicknessRate starts at 0 and accumulates each tag\'s delta from 1.0', () =>
    {
      // Arrange- (0.5-1.0) = -0.5.
      const battler = buildBattler([ '<thicknessRate:0.5>' ]);

      // Act & Assert
      expect(battler.getThicknessRate()).toBeCloseTo(-0.5);
    });
  });

  describe('ignoreAllParry', () =>
  {
    it('is true with an <unparryable> tag on any note source', () =>
    {
      expect(buildBattler([ '<unparryable>' ]).ignoreAllParry()).toBe(true);
    });

    it('is false with no matching tag', () =>
    {
      expect(buildBattler().ignoreAllParry()).toBe(false);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-range-modifiers.test.js
