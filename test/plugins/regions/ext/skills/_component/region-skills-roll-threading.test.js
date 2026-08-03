//region plugins/regions/ext/skills/_component/region-skills-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRegionsSkillsStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsSkills,
} from '../../../_component/fixtures/install-regions-host-globals.js';

describe('J-Regions-Skills roll threading (direct src import)', () =>
{
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsSkillsStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsSkills();
    await import('../../../../../../src/plugins/regions/ext/skills/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/ext/skills/objects/Game_Map.js');
    await import('../../../../../../src/plugins/regions/ext/skills/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    globalThis.$dataSkills = globalThis.$dataSkills || [];
    globalThis.$dataSkills[9] = { id: 9, note: '' };
    globalThis.$jabsEngine.__forceMapActionCalls = [];
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  it('threads the walker as both the roller and the recipient of the region-skill roll', () =>
  {
    // Arrange
    const calls = [];
    globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return true;
    };

    globalThis.$dataMap = { note: '<regionSkill:[4, 9, 100, 1, false]>' };
    const map = new globalThis.Game_Map();
    map.initialize();
    map.setup(1);
    globalThis.$gameMap = map;

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

    const ch = new globalThis.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = () => true;
    ch.getJabsBattler = () => targetJabsBattler;
    ch.regionId = () => 4;

    // Act
    ch.executeRegionSkills();

    // Assert
    expect(calls).toEqual([ { percent: 100, rollForPositive: 3, rollForNegative: 1 } ]);
  });
});
//endregion plugins/regions/ext/skills/_component/region-skills-roll-threading.test.js
