//region plugins/crit/game-battler.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { resetNaturalGrowthPluginSandbox } from '../natural/natural-vm.js';

describe('J-CriticalFactors Game_Battler (out/crit/J-CriticalFactors.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCriticalFactorsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetNaturalGrowthPluginSandbox(sandbox);
    clearRpgManagerCacheInVm(sandbox);
  });

  it('stores crit natural growth slots after initMembers when J.NATURAL is present', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor._j._natural._cdmPlus).toBe(0);
    expect(actor._j._natural._cdmRate).toBe(0);
    expect(actor._j._natural._cdrPlus).toBe(0);
    expect(actor._j._natural._cdrRate).toBe(0);
  });

  it('derives base critical multiplier from critMultiplierBase notes', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.__testNoteSources = [ { note: '<critMultiplierBase: 40>' } ];
    actor.initMembers();

    expect(actor.baseCriticalMultiplier()).toBe(0.4);
  });

  it('exposes longParam 28 and 29 as cdm and cdr getters', () =>
  {
    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(typeof actor.longParam(28)).toBe('number');
    expect(typeof actor.longParam(29)).toBe('number');
  });
});
//endregion plugins/crit/game-battler.test.js