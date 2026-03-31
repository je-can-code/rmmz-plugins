//region plugins/natural/game-battler.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadNaturalGrowthPluginVm, resetNaturalGrowthPluginSandbox } from './natural-vm.js';

describe('J-NaturalGrowth Game_Battler (out/J-NaturalGrowth.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadNaturalGrowthPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetNaturalGrowthPluginSandbox(sandbox);
  });

  it('runs patched initMembers and exposes zeroed natural growth via battler getters', () =>
  {
    const battler = new sandbox.Game_Battler();
    battler.initMembers();

    expect(battler.maxTpGrowthPlus()).toBe(0);
    expect(battler.maxTpGrowthRate()).toBe(0);
    expect(battler.maxTpBuffPlus()).toBe(0);
    expect(battler.maxTpBuffRate()).toBe(0);

    for (let paramId = 0; paramId < 8; paramId++)
    {
      expect(battler.bParamGrowthPlus(paramId)).toBe(0);
      expect(battler.bParamGrowthRate(paramId)).toBe(0);
    }

    expect(battler.xParamGrowthPlus(0)).toBe(0);
    expect(battler.sParamGrowthPlus(0)).toBe(0);
    expect(battler.expPlus()).toBe(0);
    expect(battler.goldPlus()).toBe(0);
  });

  it('refreshAllParameterBuffs fills buff getters from notes; clearAllParameterBuffs clears buffs but not growth', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkBuffPlus:[4]>' } ];
    actor.initMembers();
    actor.refreshAllParameterBuffs();

    expect(actor.bParamBuffPlus(2)).toBe(4);

    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[6]>' } ];
    actor.levelUp();

    expect(actor.bParamGrowthPlus(2)).toBe(6);

    actor.clearAllParameterBuffs();

    expect(actor.bParamBuffPlus(2)).toBe(0);
    expect(actor.bParamGrowthPlus(2)).toBe(6);
  });
});
//endregion plugins/natural/game-battler.test.js
