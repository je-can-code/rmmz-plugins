//region plugins/abs/ext/hitstop/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) postPrimaryBattleEffects. */
  let originalPostPrimaryBattleEffects;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          HITSTOP: {
            Aliased: { JABS_Engine: new Map() },
          },
        },
      },
    };

    // JABS_HitstopManager is a downstream dependency (a sibling manager file); mock its static API.
    vi.doMock('../../../../../../src/plugins/abs/ext/hitstop/managers/JABS_HitstopManager.js', () => ({
      default: { apply: vi.fn() },
    }));

    function JABS_Engine()
    {
    }

    originalPostPrimaryBattleEffects = vi.fn();
    JABS_Engine.prototype.postPrimaryBattleEffects = originalPostPrimaryBattleEffects;
    globalThis.JABS_Engine = JABS_Engine;

    // the file under test- patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/hitstop/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalPostPrimaryBattleEffects.mockReset();
  });

  function buildEngine()
  {
    return Object.create(globalThis.JABS_Engine.prototype);
  }

  describe('postPrimaryBattleEffects', () =>
  {
    it('performs the original logic then tries to apply hitstop', () =>
    {
      // Arrange
      const engine = buildEngine();
      engine.tryApplyHitstop = vi.fn();
      const action = { id: 'action' };
      const target = { id: 'target' };

      // Act
      engine.postPrimaryBattleEffects(action, target);

      // Assert
      expect(originalPostPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
      expect(engine.tryApplyHitstop).toHaveBeenCalledWith(action, target);
    });
  });

  describe('tryApplyHitstop', () =>
  {
    it('applies hitstop via the manager using the action caster as attacker', async () =>
    {
      // Arrange
      const { default: JABS_HitstopManager } =
        await import('../../../../../../src/plugins/abs/ext/hitstop/managers/JABS_HitstopManager.js');
      const engine = buildEngine();
      const attacker = { id: 'attacker' };
      const action = { getCaster: () => attacker };
      const target = { id: 'target' };

      // Act
      engine.tryApplyHitstop(action, target);

      // Assert
      expect(JABS_HitstopManager.apply).toHaveBeenCalledWith(action, attacker, target);
    });
  });
});
//endregion plugins/abs/ext/hitstop/managers/jabs-engine.test.js
