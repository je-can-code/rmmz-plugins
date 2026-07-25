//region plugins/abs/core/objects/game-unit.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_Unit augments (direct src import)', () =>
{
  let Game_Unit;
  let originalInBattle;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { Aliased: { Game_Unit: new Map() } } };

    function StubGameUnit()
    {
    }
    originalInBattle = vi.fn(() => false);
    StubGameUnit.prototype.inBattle = originalInBattle;
    globalThis.Game_Unit = StubGameUnit;

    await import('../../../../../src/plugins/abs/core/objects/Game_Unit.js');
    ({ Game_Unit } = globalThis);
  });

  beforeEach(() =>
  {
    originalInBattle.mockClear();
  });

  describe('inBattle', () =>
  {
    it('is always true when JABS is enabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
      const unit = new Game_Unit();

      expect(unit.inBattle()).toBe(true);
      expect(originalInBattle).not.toHaveBeenCalled();
    });

    it('falls through to the original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: false };
      originalInBattle.mockReturnValue(true);
      const unit = new Game_Unit();

      expect(unit.inBattle()).toBe(true);
      expect(originalInBattle).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/core/objects/game-unit.test.js
