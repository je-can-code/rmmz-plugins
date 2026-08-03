//region plugins/level/_component/game-actor-getlevel-parambase.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installGameTempForLevelTests, installMinimalClassParamRows } from './fixtures/level-class-data.js';
import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Actor getLevel and paramBase (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // patches globalThis.Game_BattlerBase.prototype/statics and Game_Battler.prototype with
    // knownBaseParameterIds()/getAllNotes(), which level's own Game_Battler.js/Game_Temp.js rely on.
    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');

    // patches globalThis.Game_Actor.prototype with databaseData() -> this.actor(), which getAllNotes()
    // (and therefore getLevelSources()) relies on to include the actor's own database note.
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    // patches globalThis.Game_BattlerBase.prototype.initMembers with the _j._level cache slot that
    // Game_Battler.js's getLevel()/refreshLevel() rely on.
    await import('../../../../src/plugins/level/core/objects/Game_BattlerBase.js');

    // patches globalThis.Game_Battler.prototype and Game_Actor.prototype directly, no vm involved.
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

  it('level and lvl getters match getLevel()', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '<level:+3>', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 10;

    // Act
    const result = actor.getLevel();

    // Assert
    expect(result).toBe(13);
    expect(actor.level).toBe(13);
    expect(actor.lvl).toBe(13);
  });

  it('getLevel adds note tags from actor data, equips, states, and actor balance variable', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '<lv:+2>', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 7;
    globalThis.$gameVariables.setValue(141, 4);
    actor.equips = function()
    {
      return [ { id: 1, note: '<level:+5>' } ];
    };
    actor.allStates = function()
    {
      return [ { id: 1, note: '<lvl:+1>' } ];
    };

    // Act
    const result = actor.getLevel();

    // Assert
    expect(result).toBe(19);
  });

  it('paramBase indexes class curves by getLevel, not raw _level alone', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 8;
    actor.equips = function()
    {
      return [ { id: 1, note: '<level:+2>' } ];
    };

    // Act
    const result = actor.paramBase(2);

    // Assert
    expect(result).toBe(actor.currentClass().params[2][10]);
  });

  it('baseMaxLevel uses database cap when actor maxLevel is below 99', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 44, traits: [] };
    actor.initMembers();

    // Act
    const result = actor.baseMaxLevel();

    // Assert
    expect(result).toBe(44);
  });

  it('paramBase clamps the editor table index to row length minus one', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    globalThis.$dataClasses[1].params[2] = Array.from({ length: 40 }, (_, i) => i * 2);
    actor._level = 35;

    // Act
    const result = actor.paramBase(2);

    // Assert
    expect(result).toBe(70);
  });

  it('paramBase re-clamps after refreshLevel picks up a higher raw level', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    globalThis.$dataClasses[1].params[2] = Array.from({ length: 40 }, (_, i) => i * 2);
    actor._level = 60;

    // Act
    actor.refreshLevel();

    // Assert
    expect(actor.paramBase(2)).toBe(78);
  });

  it('getLevel uses a re-entrancy guard when nested getLevel runs during extractLevel', () =>
  {
    // Arrange- pin sources to only the actor database row so the re-entrancy math is predictable.
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '<level:+1>', classId: 1, maxLevel: 99, traits: [] };
    actor.initMembers();
    actor._level = 3;
    globalThis.$gameVariables.setValue(141, 2);
    actor.__testNoteSources = [ actor.__actorDb ];
    const prevExtract = globalThis.Game_Battler.prototype.extractLevel;
    actor.extractLevel = function(rpgData)
    {
      return 5 + prevExtract.call(this, rpgData) + this.getLevel();
    };

    // Act
    const result = actor.getLevel();

    // Assert
    expect(result).toBe(16);
  });
});
//endregion plugins/level/_component/game-actor-getlevel-parambase.test.js
