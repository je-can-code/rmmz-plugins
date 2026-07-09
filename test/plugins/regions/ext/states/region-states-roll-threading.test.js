//region plugins/regions/ext/states/region-states-roll-threading.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadRegionsStatesStackVm } from '../../regions-vm.js';

describe('J-Regions-States roll threading (out/regions/ext/J-Regions-States.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsStatesStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
    sandbox.$dataStates = sandbox.$dataStates || [];
    sandbox.$dataStates[12] = { id: 12, note: '' };
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
  });

  it('the one stepping on the region is both the roller and the recipient', () =>
  {
    const calls = [];
    sandbox.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return true;
    };

    sandbox.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);
    sandbox.$gameMap = map;

    const battler = {
      stateRate: () => 1,
      isStateAffected: () => false,
      addState: () => {},
      resetStateCounts: () => {},
      getPositiveRollsForSkill: () => 4,
      getNegativeRollsForSkill: () => 2,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
      isAccumulating: () => false,
      getEncoreRepeats: () => 0,
    };
    const jabsBattler = { getBattler: () => battler };

    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = () => true;
    ch.getJabsBattler = () => jabsBattler;
    ch.regionId = () => 7;
    ch.requestAnimation = () => {};

    ch.applyRegionStates();

    expect(calls).toEqual([ { percent: 100, rollForPositive: 5, rollForNegative: 2 } ]);
  });
});
//endregion plugins/regions/ext/states/region-states-roll-threading.test.js
