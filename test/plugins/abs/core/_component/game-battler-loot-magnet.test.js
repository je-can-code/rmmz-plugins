//region plugins/abs/core/_component/game-battler-loot-magnet.test.js
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

describe('J-ABS Game_Battler loot magnet modifiers (direct src import)', () =>
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

  describe('getLootMagnetBuff', () =>
  {
    it('sums every <lootMagnetBuff:N> tag across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<lootMagnetBuff:8>', '<lootMagnetBuff:2>' ]);

      // Act & Assert
      expect(battler.getLootMagnetBuff()).toBe(10);
    });

    it('is 0 when no matching tag is present', () =>
    {
      // Arrange- the sibling tags below are the near misses this accessor must decline. rangeBuff
      // is the accessor's own idiom applied to a different axis, and lootMagnetRate shares its
      // prefix, so a regex loose in either direction would report a non-zero total here.
      const battler = buildBattler([ '<rangeBuff:5>', '<lootMagnetRate:1.5>' ]);

      // Act & Assert
      expect(battler.getLootMagnetBuff()).toBe(0);
    });
  });

  describe('getLootMagnetRate', () =>
  {
    it('accumulates each tag\'s delta from 1.0', () =>
    {
      // Arrange- 1.0 + (1.5 - 1.0) + (2.0 - 1.0) = 2.5.
      const battler = buildBattler([ '<lootMagnetRate:1.5>', '<lootMagnetRate:2.0>' ]);

      // Act & Assert
      expect(battler.getLootMagnetRate()).toBeCloseTo(2.5);
    });

    it('is exactly 1.0 when no matching tag is present', () =>
    {
      // Arrange- rangeRate is the same idiom on a different axis and lootMagnetBuff shares the
      // prefix; either being picked up would push this off 1.0.
      const battler = buildBattler([ '<rangeRate:2.0>', '<lootMagnetBuff:8>' ]);

      // Act & Assert
      expect(battler.getLootMagnetRate()).toBe(1.0);
    });
  });

  describe('getLootMagnetRadius', () =>
  {
    it('is the configured base when the battler carries no tags', () =>
    {
      // Arrange- the fixture's config declares a base radius of 3.
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getLootMagnetRadius()).toBe(3);
    });

    it('adds the flat buff to the configured base', () =>
    {
      // Arrange- base 3 plus a flat 8.
      const battler = buildBattler([ '<lootMagnetBuff:8>' ]);

      // Act & Assert
      expect(battler.getLootMagnetRadius()).toBe(11);
    });

    it('applies the rate after the buff rather than before it', () =>
    {
      // Arrange- both tags present, so the two orderings disagree: (3 + 8) * 2 is 22, while
      // 3 * 2 + 8 would be 14. Only one of those can be observed here.
      const battler = buildBattler([ '<lootMagnetBuff:8>', '<lootMagnetRate:2.0>' ]);

      // Act & Assert
      expect(battler.getLootMagnetRadius()).toBe(22);
    });

    it('floors a negative result at 0', () =>
    {
      // Arrange- a buff large enough to drive the base below zero. Without the floor this reads
      // -96, which as a radius would compare as "nothing is ever in range" rather than clamping.
      const battler = buildBattler([ '<lootMagnetBuff:-99>' ]);

      // Act & Assert
      expect(battler.getLootMagnetRadius()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-loot-magnet.test.js
