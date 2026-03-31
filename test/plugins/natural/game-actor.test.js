//region plugins/natural/game-actor.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadNaturalGrowthPluginVm, resetNaturalGrowthPluginSandbox } from './natural-vm.js';
import { wrapActorRefreshCounter } from './test-helpers.js';

describe('J-NaturalGrowth Game_Actor (out/J-NaturalGrowth.js)', () =>
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

  it('paramBase, xparam, and sparam include natural bonuses from buff tags after refresh', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [
      { note: '<atkBuffPlus:[7]>\n<hitBuffPlus:[100]>\n<tgrBuffPlus:[200]>' },
    ];
    actor.initMembers();
    actor.refreshAllParameterBuffs();

    expect(actor.paramBase(2)).toBe(17);
    expect(actor.xparam(0)).toBeCloseTo(1.25);
    expect(actor.sparam(0)).toBe(3);
  });

  it('setup and onBattlerDataChange each trigger refreshAllParameterBuffs', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();
    const getCount = wrapActorRefreshCounter(sandbox, actor);

    actor.setup(1);
    // J-Base onSetup calls onBattlerDataChange; Natural setup also calls refreshAllParameterBuffs.
    expect(getCount()).toBe(2);

    actor.onBattlerDataChange();
    expect(getCount()).toBe(3);
  });

  it('levelUp stacks atk growth from getAllNotes note sources (equip-style)', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[5]>' } ];
    actor.initMembers();

    expect(actor.bParamGrowthPlus(2)).toBe(0);

    for (const expectedAtkGrowth of [ 5, 10 ])
    {
      actor.levelUp();
      expect(actor.bParamGrowthPlus(2)).toBe(expectedAtkGrowth);
    }
  });

  it('levelUp applies ex-, sp-, and max-TP growth tags once each', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [
      { note: '<hitGrowthPlus:[4]>\n<tgrGrowthPlus:[3]>\n<mtpGrowthPlus:[12]>' },
    ];
    actor.initMembers();
    actor.levelUp();

    expect(actor.xParamGrowthPlus(0)).toBe(4);
    expect(actor.sParamGrowthPlus(0)).toBe(3);
    expect(actor.maxTpGrowthPlus()).toBe(12);
  });

  it('levelUp adds atk growth rate using engine paramBase as formula base', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [ { note: '<atkGrowthRate:[10]>' } ];
    actor.initMembers();
    actor.levelUp();

    expect(actor.bParamGrowthRate(2)).toBe(10);
  });

  it('levelUp evaluates atk growth plus using a.level property (formula context)', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor._level = 4;
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[a.level]>' } ];
    actor.initMembers();
    actor.levelUp();

    expect(actor.bParamGrowthPlus(2)).toBe(4);
  });

  it('levelUp evaluates atk growth plus using a.lvl property (formula context)', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor._level = 6;
    actor.__testNoteSources = [ { note: '<atkGrowthPlus:[a.lvl]>' } ];
    actor.initMembers();
    actor.levelUp();

    expect(actor.bParamGrowthPlus(2)).toBe(6);
  });
});
//endregion plugins/natural/game-actor.test.js
