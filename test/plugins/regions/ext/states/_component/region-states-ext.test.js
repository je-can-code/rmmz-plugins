//region plugins/regions/ext/states/_component/region-states-ext.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { buildFateBattlerStub } from '../../../../_base/core/_component/fixtures/install-jabs-fate.js';
import {
  installRegionsStatesStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsStates,
} from '../../../_component/fixtures/install-regions-host-globals.js';

/**
 * Builds a battler stand-in with the state-tracking surface applyRegionStates() relies on, on top of everything
 * J-ABS's shared state roll reads at its neutral answer: no resistance, no luck, no lucky or cursed rolls. A tag at
 * 100% therefore reaches the real dice at 100 and always lands.
 * @param {Array<{stateId: number, attacker: object}>} added Tracks addState calls.
 * @param {Array<{stateId: number, attacker: object}>} reset Tracks resetStateCounts calls.
 * @returns {object}
 */
function buildRegionStatesBattler(added, reset)
{
  return buildFateBattlerStub({
    isStateAffected(stateId)
    {
      return added.some(entry => entry.stateId === stateId);
    },
    addState(stateId, attacker)
    {
      added.push({ stateId, attacker });
    },
    resetStateCounts(stateId, attacker)
    {
      reset.push({ stateId, attacker });
    },
  });
}

describe('J-Regions-States Game_Map / Game_Character (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsStatesStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsStates();
    await import('../../../../../../src/plugins/regions/ext/states/_metadata/initialization.js');

    // patches globalThis.Game_Map.prototype/Game_Character.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/regions/ext/states/objects/Game_Map.js');
    await import('../../../../../../src/plugins/regions/ext/states/objects/Game_Character.js');
  });

  describe('Game_Map.refreshRegionStates', () =>
  {
    let regionStateData;

    beforeAll(() =>
    {
      globalThis.$dataMap = { note: '<regionAddState:[1, 3, 100, 0]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);

      [ regionStateData ] = map.getRegionStatesByRegionId(1);
    });

    it('parses exactly one region state data for the tagged region', () =>
    {
      // Arrange & Act & Assert
      expect(regionStateData).toBeDefined();
    });

    it('parses the region id', () =>
    {
      // Arrange & Act & Assert
      expect(regionStateData.regionId).toBe(1);
    });

    it('parses the state id', () =>
    {
      // Arrange & Act & Assert
      expect(regionStateData.stateId).toBe(3);
    });

    it('parses the chance of application', () =>
    {
      // Arrange & Act & Assert
      expect(regionStateData.chance).toBe(100);
    });

    it('parses the animation id', () =>
    {
      // Arrange & Act & Assert
      expect(regionStateData.animationId).toBe(0);
    });
  });

  describe('Game_Map.refreshRegionStates with optional trailing args', () =>
  {
    it('parses a 3-arg tag (no animationId) and defaults animationId to 0', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionAddState:[2, 5, 25]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);
      const [ regionStateData ] = map.getRegionStatesByRegionId(2);

      // Assert
      expect(regionStateData.chance).toBe(25);
      expect(regionStateData.animationId).toBe(0);
    });

    it('parses a 2-arg tag (no chance/animationId) and defaults chance to 100', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionAddState:[12, 40]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);
      const [ regionStateData ] = map.getRegionStatesByRegionId(12);

      // Assert
      expect(regionStateData.stateId).toBe(40);
      expect(regionStateData.chance).toBe(100);
      expect(regionStateData.animationId).toBe(0);
    });
  });

  describe('Game_Character.applyRegionStates', () =>
  {
    it('applies the tagged state when the chance succeeds', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);
      globalThis.$gameMap = map;

      const added = [];
      const battler = buildRegionStatesBattler(added, []);
      const jabsBattler = { getBattler: () => battler };

      const ch = new globalThis.Game_Character();
      ch.initMembers();
      ch.hasJabsBattler = function()
      {
        return true;
      };
      ch.getJabsBattler = function()
      {
        return jabsBattler;
      };
      ch.regionId = function()
      {
        return 7;
      };
      ch.requestAnimation = function()
      {
      };

      // Act
      ch.applyRegionStates();

      // Assert
      expect(added).toEqual([ { stateId: 12, attacker: battler } ]);
    });

    it('skips region states when the character is not visible', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();
      ch.isVehicle = function()
      {
        return false;
      };
      ch.isVisible = function()
      {
        return false;
      };
      ch.hasJabsBattler = function()
      {
        return true;
      };

      // Act & Assert
      expect(ch.canHandleRegionStates()).toBe(false);
    });

    it('reapplies the state through addState, never a bare count reset, on a second applyRegionStates cycle', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
      const map = new globalThis.Game_Map();
      map.initialize();
      map.setup(1);
      globalThis.$gameMap = map;

      const added = [];
      const reset = [];
      const battler = buildRegionStatesBattler(added, reset);
      const jabsBattler = { getBattler: () => battler };

      const ch = new globalThis.Game_Character();
      ch.initMembers();
      ch.hasJabsBattler = function()
      {
        return true;
      };
      ch.getJabsBattler = function()
      {
        return jabsBattler;
      };
      ch.regionId = function()
      {
        return 7;
      };
      ch.requestAnimation = function()
      {
      };

      // Act
      ch.applyRegionStates();
      ch.applyRegionStates();

      // Assert- the second cycle lands on a battler already carrying the state, and still goes through the add.
      expect(added).toEqual([ { stateId: 12, attacker: battler }, { stateId: 12, attacker: battler } ]);
      expect(reset).toEqual([]);
    });
  });
});
//endregion plugins/regions/ext/states/_component/region-states-ext.test.js
