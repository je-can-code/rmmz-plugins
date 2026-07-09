//region plugins/drops/drop-chance-roll-threading.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadDropsControlPluginVm, resetDropsControlPluginSandbox } from './drops-vm.js';

describe('J-DropsControl killer roll threading (out/drops/J-DropsControl.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDropsControlPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetDropsControlPluginSandbox(sandbox);
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
  });

  /**
   * Stubs RPGManager.chanceIn100 to record every argument and return a fixed outcome.
   * @param {boolean} outcome
   * @returns {{percent: number, rollForPositive: number, rollForNegative: number}[]}
   */
  function stubChanceIn100(outcome)
  {
    const calls = [];
    sandbox.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return outcome;
    };
    return calls;
  }

  it('defaults to a plain roll (no bonus) when no killer is provided', () =>
  {
    const calls = stubChanceIn100(true);
    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();

    enemy.didFindLoot(40);

    expect(calls).toEqual([ { percent: 40, rollForPositive: 1, rollForNegative: 0 } ]);
  });

  it('feeds the killer\'s own positive and negative rolls- the killer is both the roller and the recipient', () =>
  {
    const calls = stubChanceIn100(true);
    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();
    const killer = {
      getPositiveRolls: () => 2,
      getNegativeRolls: () => 3,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
    };

    enemy.didFindLoot(40, killer);

    expect(calls).toEqual([ { percent: 40, rollForPositive: 3, rollForNegative: 3 } ]);
  });
});
//endregion plugins/drops/drop-chance-roll-threading.test.js
