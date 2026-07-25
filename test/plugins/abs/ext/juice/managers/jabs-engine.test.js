//region plugins/abs/ext/juice/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalPostPrimaryBattleEffects;
  let originalExecuteMapAction;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Aliased: { JABS_Engine: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js', () => ({
      default: { onPostPrimaryBattleEffects: vi.fn(), onExecuteMapAction: vi.fn() },
    }));

    function JABS_Engine()
    {
    }

    originalPostPrimaryBattleEffects = vi.fn();
    originalExecuteMapAction = vi.fn();
    JABS_Engine.prototype.postPrimaryBattleEffects = originalPostPrimaryBattleEffects;
    JABS_Engine.prototype.executeMapAction = originalExecuteMapAction;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/abs/ext/juice/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalPostPrimaryBattleEffects.mockReset();
    originalExecuteMapAction.mockReset();
  });

  function buildEngine()
  {
    return Object.create(globalThis.JABS_Engine.prototype);
  }

  describe('postPrimaryBattleEffects', () =>
  {
    it('performs the original logic then layers juice on the target', async () =>
    {
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      const engine = buildEngine();
      const action = { id: 'action' };
      const target = { id: 'target' };

      engine.postPrimaryBattleEffects(action, target);

      expect(originalPostPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
      expect(JuiceHookManager.onPostPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
    });
  });

  describe('executeMapAction', () =>
  {
    it('performs the original logic then attaches caster-side juice', async () =>
    {
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      const engine = buildEngine();
      const caster = { id: 'caster' };
      const action = { id: 'action' };

      engine.executeMapAction(caster, action, 3, 4);

      expect(originalExecuteMapAction).toHaveBeenCalledWith(caster, action, 3, 4);
      expect(JuiceHookManager.onExecuteMapAction).toHaveBeenCalledWith(caster, action);
    });
  });
});
//endregion plugins/abs/ext/juice/managers/jabs-engine.test.js
