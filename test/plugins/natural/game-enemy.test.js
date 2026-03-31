//region plugins/natural/game-enemy.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadNaturalGrowthPluginVm, resetNaturalGrowthPluginSandbox } from './natural-vm.js';

describe('J-NaturalGrowth Game_Enemy (out/J-NaturalGrowth.js)', () =>
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

  it('setup refreshes reward bonuses from notes; exp, gold, and sdpPoints include bonuses', () =>
  {
    sandbox.J.SDP = {};

    const enemy = new sandbox.Game_Enemy();
    enemy._enemyDb = { exp: 100, gold: 50, sdpPoints: 2, actions: [] };
    enemy.__testNoteSources = [
      { note: '<expPlus:[25]>\n<goldPlus:[10]>\n<sdpPlus:[3]>' },
    ];
    enemy.initMembers();
    sandbox.Game_Enemy.prototype.setup.call(enemy, 1, 0, 0);

    expect(enemy.exp()).toBe(125);
    expect(enemy.gold()).toBe(60);
    expect(enemy.sdpPoints()).toBe(5);
  });

  it('paramBase includes buff-only natural bonuses (no permanent growth)', () =>
  {
    const enemy = new sandbox.Game_Enemy();
    enemy._enemyDb = { exp: 0, gold: 0, sdpPoints: 0, actions: [] };
    enemy.__testNoteSources = [ { note: '<defBuffPlus:[8]>' } ];
    enemy.initMembers();
    enemy.refreshAllParameterBuffs();

    expect(enemy.paramBase(3)).toBe(8);
  });
});
//endregion plugins/natural/game-enemy.test.js
