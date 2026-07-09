//region plugins/crit/game-battler-base.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';

/**
 * Exercises Game_BattlerBase.js's own additions directly against `new sandbox.Game_BattlerBase()`,
 * distinct from game-battler.test.js/game-battler-crit-math.test.js which exercise the
 * Game_Battler.prototype overrides that actors/enemies actually use in practice. Game_BattlerBase's
 * versions are the engine-wide fallback for any battler type that doesn't get Game_Battler.js's
 * richer note/natural/sdp-aware implementations.
 */
describe('J-CriticalFactors Game_BattlerBase (out/crit/J-CriticalFactors.js)', () =>
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

  it('baseCriticalMultiplier defaults to 0.5', () =>
  {
    const battler = new sandbox.Game_BattlerBase();

    expect(battler.baseCriticalMultiplier()).toBe(0.5);
  });

  it('criticalDamageMultiplier defaults to 0.0', () =>
  {
    const battler = new sandbox.Game_BattlerBase();

    expect(battler.criticalDamageMultiplier()).toBe(0.0);
  });

  it('baseCriticalReduction defaults to 0.5', () =>
  {
    const battler = new sandbox.Game_BattlerBase();

    expect(battler.baseCriticalReduction()).toBe(0.5);
  });

  it('criticalDamageReduction defaults to 0.0', () =>
  {
    const battler = new sandbox.Game_BattlerBase();

    expect(battler.criticalDamageReduction()).toBe(0.0);
  });

  it('cdm getter delegates to criticalDamageMultiplier()', () =>
  {
    const battler = new sandbox.Game_BattlerBase();
    battler.criticalDamageMultiplier = () => 0.75;

    expect(battler.cdm).toBe(0.75);
  });

  it('ctr getter delegates to criticalDamageReduction()', () =>
  {
    const battler = new sandbox.Game_BattlerBase();
    battler.criticalDamageReduction = () => 0.35;

    expect(battler.ctr).toBe(0.35);
  });
});
//endregion plugins/crit/game-battler-base.test.js
