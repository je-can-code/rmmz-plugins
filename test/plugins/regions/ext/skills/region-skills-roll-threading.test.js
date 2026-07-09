//region plugins/regions/ext/skills/region-skills-roll-threading.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadRegionsSkillsStackVm } from '../../regions-vm.js';

describe('J-Regions-Skills roll threading (out/regions/ext/J-Regions-Skills.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsSkillsStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
    sandbox.$dataSkills = sandbox.$dataSkills || [];
    sandbox.$dataSkills[9] = { id: 9, note: '' };
    sandbox.$jabsEngine.__forceMapActionCalls = [];
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

    sandbox.$dataMap = { note: '<regionSkill:[4, 9, 100, 1, false]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);
    sandbox.$gameMap = map;

    const walkerBattler = {
      getPositiveRollsForSkill: () => 2,
      getNegativeRollsForSkill: () => 1,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
      isAccumulating: () => false,
      getEncoreRepeats: () => 0,
    };
    const targetJabsBattler = {
      getX: () => 3,
      getY: () => 8,
      getTeam: () => 0,
      getBattler: () => walkerBattler,
    };

    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = () => true;
    ch.getJabsBattler = () => targetJabsBattler;
    ch.regionId = () => 4;

    ch.executeRegionSkills();

    expect(calls).toEqual([ { percent: 100, rollForPositive: 3, rollForNegative: 1 } ]);
  });
});
//endregion plugins/regions/ext/skills/region-skills-roll-threading.test.js
