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

    // patches globalThis.Game_BattlerBase.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
  });

  describe('baseCriticalMultiplier', () =>
  {
    it('defaults to 0.5', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act & Assert
      expect(battler.baseCriticalMultiplier()).toBe(0.5);
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
    it('defaults to 0.5', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act & Assert
      expect(battler.baseCriticalReduction()).toBe(0.5);
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
