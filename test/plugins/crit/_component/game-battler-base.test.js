//region plugins/crit/_component/game-battler-base.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Exercises Game_BattlerBase.js's own additions directly against `new Game_BattlerBase()`, distinct
 * from game-battler.test.js/game-battler-crit-math.test.js which exercise the Game_Battler.prototype
 * overrides that actors/enemies actually use in practice. Game_BattlerBase's versions are the
 * engine-wide fallback for any battler type that doesn't get Game_Battler.js's richer
 * note/natural/sdp-aware implementations.
 */
describe('J-CriticalFactors Game_BattlerBase (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    function Game_BattlerBase()
    {
    }

    globalThis.Game_BattlerBase = Game_BattlerBase;

    // stand-in for the plugin-configured floor values normally parsed off the plugin parameters
    // by J_CriticalFactorsPluginMetadata; Game_BattlerBase.js reads these directly.
    globalThis.J = globalThis.J || {};
    globalThis.J.CRIT = { Metadata: { baseCdmFactor: 0.5, baseCtrFactor: 0.5 } };

    // patches globalThis.Game_BattlerBase.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
  });

  describe('baseCriticalMultiplier', () =>
  {
    it('reads the configured floor straight off J.CRIT.Metadata.baseCdmFactor', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();
      const savedFactor = globalThis.J.CRIT.Metadata.baseCdmFactor;
      globalThis.J.CRIT.Metadata.baseCdmFactor = 0.75;

      // Act & Assert
      expect(battler.baseCriticalMultiplier()).toBe(0.75);

      globalThis.J.CRIT.Metadata.baseCdmFactor = savedFactor;
    });
  });

  describe('criticalDamageMultiplier', () =>
  {
    it('defaults to 0.0', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act & Assert
      expect(battler.criticalDamageMultiplier()).toBe(0.0);
    });
  });

  describe('baseCriticalReduction', () =>
  {
    it('reads the configured floor straight off J.CRIT.Metadata.baseCtrFactor', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();
      const savedFactor = globalThis.J.CRIT.Metadata.baseCtrFactor;
      globalThis.J.CRIT.Metadata.baseCtrFactor = 0.25;

      // Act & Assert
      expect(battler.baseCriticalReduction()).toBe(0.25);

      globalThis.J.CRIT.Metadata.baseCtrFactor = savedFactor;
    });
  });

  describe('criticalDamageReduction', () =>
  {
    it('defaults to 0.0', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act & Assert
      expect(battler.criticalDamageReduction()).toBe(0.0);
    });
  });

  describe('cdm', () =>
  {
    it('delegates to criticalDamageMultiplier()', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();
      battler.criticalDamageMultiplier = () => 0.75;

      // Act & Assert
      expect(battler.cdm).toBe(0.75);
    });
  });

  describe('ctr', () =>
  {
    it('delegates to criticalDamageReduction()', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();
      battler.criticalDamageReduction = () => 0.35;

      // Act & Assert
      expect(battler.ctr).toBe(0.35);
    });
  });
});
//endregion plugins/crit/_component/game-battler-base.test.js
