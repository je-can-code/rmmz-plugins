//region plugins/abs/core/_component/game-battler-cdr-per.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override, so refreshCdr/
 * refreshPer can be driven without a full actor/enemy database object.
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

describe('J-ABS Game_Battler CDR/PER (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype with getAllNotes/initMembers/etc, which J-ABS's
    // own Game_Battler.js aliases and builds on top of.
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('CDR', () =>
  {
    it('cdr getter delegates to globalCooldownReduction', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setGlobalCooldownReduction(0.25);

      // Act & Assert
      expect(battler.cdr).toBe(0.25);
    });

    it('setGlobalCooldownReduction assigns the cached value read back by globalCooldownReduction', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setGlobalCooldownReduction(0.5);

      // Assert
      expect(battler.globalCooldownReduction()).toBe(0.5);
    });

    it('refreshCdr sums <cdr:[FORMULA]> tags across all note sources and converts to decimal', () =>
    {
      // Arrange- 10 + 5 = 15 percent-points, converted to 0.15 decimal.
      const battler = buildBattler([ '<cdr:[10]>', '<cdr:[5]>' ]);

      // Act
      battler.refreshCdr();

      // Assert
      expect(battler.globalCooldownReduction()).toBeCloseTo(0.15);
    });

    it('refreshCdr resets to zero when no note sources grant any CDR', () =>
    {
      // Arrange
      const battler = buildBattler([ '<some-other-tag:1>' ]);
      battler.setGlobalCooldownReduction(0.9);

      // Act
      battler.refreshCdr();

      // Assert
      expect(battler.globalCooldownReduction()).toBe(0);
    });
  });

  describe('PER', () =>
  {
    it('per getter delegates to parryExtensionRate', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setParryExtensionRate(0.4);

      // Act & Assert
      expect(battler.per).toBe(0.4);
    });

    it('setParryExtensionRate assigns the cached value read back by parryExtensionRate', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setParryExtensionRate(0.3);

      // Assert
      expect(battler.parryExtensionRate()).toBe(0.3);
    });

    it('refreshPer sums <per:[FORMULA]> tags across all note sources and converts to decimal', () =>
    {
      // Arrange- 20 + 30 = 50 percent-points, converted to 0.5 decimal.
      const battler = buildBattler([ '<per:[20]>', '<per:[30]>' ]);

      // Act
      battler.refreshPer();

      // Assert
      expect(battler.parryExtensionRate()).toBeCloseTo(0.5);
    });

    it('refreshPer resets to zero when no note sources grant any PER', () =>
    {
      // Arrange
      const battler = buildBattler([]);
      battler.setParryExtensionRate(0.9);

      // Act
      battler.refreshPer();

      // Assert
      expect(battler.parryExtensionRate()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-cdr-per.test.js
