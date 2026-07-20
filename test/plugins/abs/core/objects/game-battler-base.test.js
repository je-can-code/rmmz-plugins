//region plugins/abs/core/objects/game-battler-base.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS Game_BattlerBase augments (direct src import)', () =>
{
  let Game_BattlerBase;

  beforeAll(async () =>
  {
    function StubGameBattlerBase()
    {
    }
    globalThis.Game_BattlerBase = StubGameBattlerBase;

    await import('../../../../../src/plugins/abs/core/objects/Game_BattlerBase.js');
    ({ Game_BattlerBase } = globalThis);
  });

  describe('cdr / globalCooldownReduction', () =>
  {
    it('globalCooldownReduction defaults to 0', () =>
    {
      const battler = new Game_BattlerBase();
      expect(battler.globalCooldownReduction()).toBe(0);
    });

    it('cdr reads through to globalCooldownReduction', () =>
    {
      const battler = new Game_BattlerBase();
      battler.globalCooldownReduction = () => 15;
      expect(battler.cdr).toBe(15);
    });
  });

  describe('per / parryExtensionRate', () =>
  {
    it('parryExtensionRate defaults to 0', () =>
    {
      const battler = new Game_BattlerBase();
      expect(battler.parryExtensionRate()).toBe(0);
    });

    it('per reads through to parryExtensionRate', () =>
    {
      const battler = new Game_BattlerBase();
      battler.parryExtensionRate = () => 50;
      expect(battler.per).toBe(50);
    });
  });
});
//endregion plugins/abs/core/objects/game-battler-base.test.js
