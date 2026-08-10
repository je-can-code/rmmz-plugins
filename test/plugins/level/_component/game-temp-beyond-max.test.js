//region plugins/level/_component/game-temp-beyond-max.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installGameTempForLevelTests, installMinimalClassParamRows } from './fixtures/level-class-data.js';
import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster beyond-max param curves (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/level/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/level/core/objects/Game_Temp.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables._data = [];
    globalThis.RPGManager.clearCache();
    installMinimalClassParamRows(globalThis);
    installGameTempForLevelTests(globalThis);
  });

  it('paramBase reads the extrapolated row when getLevel is greater than 99', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 100;
    const editor99 = actor.currentClass().params[3].at(99);

    // Act
    const valueAt100 = actor.paramBase(3);

    // Assert
    expect(actor.getLevel()).toBe(100);
    expect(valueAt100).not.toBe(editor99);
  });

  it('paramBase\'s extrapolated value matches Game_Temp\'s own beyond-max cache', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 100;
    const valueAt100 = actor.paramBase(3);
    if (globalThis.$gameTemp.hasCachedBeyondMaxData() === false)
    {
      globalThis.$gameTemp.buildBeyondMaxData();
    }

    // Act
    const beyondRow = globalThis.$gameTemp.getBeyondMaxData(1).at(3);

    // Assert
    expect(valueAt100).toBe(beyondRow.at(100));
  });

  it('paramBase clamps the beyond-max index to the extrapolated row length', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor.getLevel = function()
    {
      return 5000;
    };
    if (globalThis.$gameTemp.hasCachedBeyondMaxData() === false)
    {
      globalThis.$gameTemp.buildBeyondMaxData();
    }
    const beyondRow = globalThis.$gameTemp.getBeyondMaxData(1).at(2);
    const expected = beyondRow[beyondRow.length - 1];

    // Act
    const result = actor.paramBase(2);

    // Assert
    expect(result).toBe(expected);
  });

  it('buildBeyondMaxData mirrors the Game_Temp helper used at setupNewGame', () =>
  {
    // Arrange & Act
    globalThis.$gameTemp.buildBeyondMaxData();

    // Assert
    expect(globalThis.$gameTemp.hasCachedBeyondMaxData()).toBe(true);
    const row = globalThis.$gameTemp.getBeyondMaxData(1).at(0);
    expect(row.length).toBeGreaterThanOrEqual(1000);
    expect(row[999]).toBeDefined();
  });

  describe('authored growth curves', () =>
  {
    it('evaluates the class\'s own curve for a param that has one tagged', () =>
    {
      // Arrange- an authored curve is the source of truth past 99, replacing the slope guess
      // outright. That is the whole point of the tag: a designer who wants a specific late-game
      // shape gets it, rather than whatever the last five baked levels happened to imply.
      globalThis.$dataClasses[1].note = '<atkGrowthCurve:[a.level * 10]>';
      globalThis.RPGManager.clearCache();

      // Act
      globalThis.$gameTemp.buildBeyondMaxData();

      // Assert
      const atkRow = globalThis.$gameTemp.getBeyondMaxData(1)
        .at(2);
      expect(atkRow[150]).toBe(1500);
      expect(atkRow[999]).toBe(9990);
    });

    it('still extrapolates a slope for the params the same class left untagged', () =>
    {
      // Arrange- tagging one param must not opt the other seven out of growing.
      globalThis.$dataClasses[1].note = '<atkGrowthCurve:[a.level * 10]>';
      globalThis.RPGManager.clearCache();

      // Act
      globalThis.$gameTemp.buildBeyondMaxData();

      // Assert
      const defRow = globalThis.$gameTemp.getBeyondMaxData(1)
        .at(3);
      expect(defRow[150]).not.toBe(1500);
      expect(defRow[150]).toBeGreaterThan(defRow[100]);
    });
  });
});
//endregion plugins/level/_component/game-temp-beyond-max.test.js
