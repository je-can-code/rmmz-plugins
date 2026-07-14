//region plugins/regions/ext/skills/_component/region-skills-ext.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installRegionsSkillsStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsSkills,
} from '../../../_component/fixtures/install-regions-host-globals.js';

describe('J-Regions-Skills Game_Map / Game_Character (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsSkillsStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsSkills();
    await import('../../../../../../src/plugins/regions/ext/skills/_metadata/initialization.js');

    // patches globalThis.Game_Map.prototype/Game_Character.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/regions/ext/skills/objects/Game_Map.js');
    await import('../../../../../../src/plugins/regions/ext/skills/objects/Game_Character.js');
  });

  describe('Game_Map.refreshRegionSkills', () =>
  {
    let regionSkillData;

    beforeAll(() =>
    {
      globalThis.$dataMap = { note: '<regionSkill:[1, 5, 100, 2, false]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);

      [ regionSkillData ] = map.getRegionSkillsByRegionId(1);
    });

    it('parses exactly one region skill data for the tagged region', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData).toBeDefined();
    });

    it('parses the region id', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData.regionId).toBe(1);
    });

    it('parses the skill id', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData.skillId).toBe(5);
    });

    it('parses the chance of application', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData.chance).toBe(100);
    });

    it('parses the caster id', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData.casterId).toBe(2);
    });

    it('parses the isFriendly flag', () =>
    {
      // Arrange & Act & Assert
      expect(regionSkillData.isFriendly).toBe(false);
    });
  });

  describe('Game_Character.executeRegionSkills', () =>
  {
    it('calls forceMapAction with the skill and target coordinates when the chance succeeds', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionSkill:[4, 9, 100, 1, false]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);
      globalThis.$gameMap = map;
      globalThis.$jabsEngine.__forceMapActionCalls = [];

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

      const ch = new globalThis.Game_Character();
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

      // Act
      ch.executeRegionSkills();

      // Assert
      const calls = globalThis.$jabsEngine.__forceMapActionCalls;
      expect(calls.length).toBe(1);
    });

    it('forces the map action using the tagged skill id and the target battler coordinates', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionSkill:[4, 9, 100, 1, false]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);
      globalThis.$gameMap = map;
      globalThis.$jabsEngine.__forceMapActionCalls = [];

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

      const ch = new globalThis.Game_Character();
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

      // Act
      ch.executeRegionSkills();

      // Assert
      const [ call ] = globalThis.$jabsEngine.__forceMapActionCalls;
      expect(call[1]).toBe(9);
      expect(call[3]).toBe(3);
      expect(call[4]).toBe(8);
    });
  });
});
//endregion plugins/regions/ext/skills/_component/region-skills-ext.test.js
