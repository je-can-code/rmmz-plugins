//region plugins/regions/ext/skills/region-skills-ext.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadRegionsSkillsStackVm } from '../../regions-vm.js';

describe('J-Regions-Skills Game_Map (out/regions/ext/J-Regions-Skills.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsSkillsStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('refreshRegionSkills parses map note into region skill data', () =>
  {
    sandbox.$dataMap = { note: '<regionSkill:[1, 5, 100, 2, false]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);

    const datas = map.getRegionSkillsByRegionId(1);
    expect(datas.length).toBe(1);
    expect(datas[0].regionId).toBe(1);
    expect(datas[0].skillId).toBe(5);
    expect(datas[0].chance).toBe(100);
    expect(datas[0].casterId).toBe(2);
    expect(datas[0].isFriendly).toBe(false);
  });
});

describe('J-Regions-Skills Game_Character executeRegionSkills', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsSkillsStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('calls forceMapAction when chance succeeds', () =>
  {
    sandbox.$dataMap = { note: '<regionSkill:[4, 9, 100, 1, false]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);
    sandbox.$gameMap = map;

    sandbox.$jabsEngine.__forceMapActionCalls = [];

    const targetJabsBattler = {
      getX()
      {
        return 3;
      },
      getY()
      {
        return 8;
      },
      getTeam()
      {
        return 0;
      },
      getBattler()
      {
        return {
          getPositiveRollsForSkill: () => 0,
          getNegativeRollsForSkill: () => 0,
          isVeryLucky: () => false,
          isVeryCursed: () => false,
          isAccumulating: () => false,
          getEncoreRepeats: () => 0,
        };
      },
    };

    const ch = new sandbox.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = function()
    {
      return true;
    };
    ch.getJabsBattler = function()
    {
      return targetJabsBattler;
    };
    ch.regionId = function()
    {
      return 4;
    };

    ch.executeRegionSkills();

    const calls = sandbox.$jabsEngine.__forceMapActionCalls;
    expect(calls.length).toBe(1);
    expect(calls[0][1]).toBe(9);
    expect(calls[0][3]).toBe(3);
    expect(calls[0][4]).toBe(8);
  });
});
//endregion plugins/regions/ext/skills/region-skills-ext.test.js
