//region plugins/regions/ext/states/region-states-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRegionsStatesStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsStates,
} from '../../fixtures/install-regions-host-globals.js';

describe('J-Regions-States roll threading (direct src import)', () =>
{
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsStatesStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsStates();
    await import('../../../../../src/plugins/regions/ext/states/_metadata/initialization.js');
    await import('../../../../../src/plugins/regions/ext/states/objects/Game_Map.js');
    await import('../../../../../src/plugins/regions/ext/states/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    globalThis.$dataStates = globalThis.$dataStates || [];
    globalThis.$dataStates[12] = { id: 12, note: '' };
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  it('threads the walker as both the roller and the recipient of the region-state roll', () =>
  {
    // Arrange
    const calls = [];
    globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return true;
    };

    globalThis.$dataMap = { note: '<regionAddState:[7, 12, 100, 0]>' };
    const map = new globalThis.Game_Map();
    map.initialize();
    map.setup(1);
    globalThis.$gameMap = map;

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

    const ch = new globalThis.Game_Character();
    ch.initMembers();
    ch.hasJabsBattler = () => true;
    ch.getJabsBattler = () => jabsBattler;
    ch.regionId = () => 7;
    ch.requestAnimation = () => {};

    // Act
    ch.applyRegionStates();

    // Assert
    expect(calls).toEqual([ { percent: 100, rollForPositive: 5, rollForNegative: 2 } ]);
  });
});
//endregion plugins/regions/ext/states/region-states-roll-threading.test.js
