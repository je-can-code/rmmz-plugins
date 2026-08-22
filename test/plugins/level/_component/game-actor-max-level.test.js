//region plugins/level/_component/game-actor-max-level.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Actor max level (direct src import)', () =>
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
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables._data = [];
    globalThis.RPGManager.clearCache();
  });

  it('raises real max level from maxLevelBoost notes, capped by the plugin trueMaxLevel', () =>
  {
    // Arrange
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.__testNoteSources = [ { note: '<maxLevelBoost:+25>' } ];
    actor.initMembers();
    actor.onBattlerDataChange();

    // Act
    const result = actor.getRealMaxLevel();

    // Assert
    expect(result).toBe(280);
  });

  it('hands back the plain max level untouched when nothing boosted it', () =>
  {
    // Arrange- the overwhelming majority of actors carry no boost at all, so this is the ordinary
    // path, and it deliberately skips the sum-and-clamp arithmetic entirely.
    const actor = new globalThis.Game_Actor();
    actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
    actor.__testNoteSources = [];
    actor.initMembers();
    actor.onBattlerDataChange();

    // Act
    const result = actor.getRealMaxLevel();

    // Assert
    expect(result).toBe(actor.baseMaxLevel());
  });

  describe('maxTp', () =>
  {
    it('uses the class\'s authored max-tp curve when one is tagged', () =>
    {
      // Arrange- unlike the eight base params, max tp has no baked `params[]` array to defer to, so
      // an authored curve is the only way it can grow at all.
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
      actor.initMembers();
      actor.onBattlerDataChange();
      actor.currentClass = () => ({ note: '<mtpGrowthCurve:[a.level * 2]>' });
      actor.getLevel = () => 40;

      // Act
      const result = actor.maxTp();

      // Assert
      expect(result).toBe(80);
    });

    it('never lets an authored curve drive max tp below zero', () =>
    {
      // Arrange- a curve authored with a negative constant would otherwise produce a battler who can
      // never hold any tp, which reads in-game as a broken resource bar rather than as a bad tag.
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
      actor.initMembers();
      actor.onBattlerDataChange();
      actor.currentClass = () => ({ note: '<mtpGrowthCurve:[a.level - 500]>' });
      actor.getLevel = () => 40;

      // Act
      const result = actor.maxTp();

      // Assert
      expect(result).toBe(0);
    });

    it('falls through to the engine\'s own answer for a class with no curve tagged', () =>
    {
      // Arrange- the engine's untagged answer is zero, which is indistinguishable from a curve
      // evaluated against nothing. A `<maxTp:N>` tag gives the fall-through a value of its own that
      // only the original calculation can produce.
      const actor = new globalThis.Game_Actor();
      actor.__actorDb = { id: 1, name: '', note: '', classId: 1, maxLevel: 99, traits: [] };
      actor.__testNoteSources = [ { note: '<maxTp:40>' } ];
      actor.initMembers();
      actor.onBattlerDataChange();
      actor.currentClass = () => ({ note: '' });

      // Act
      const result = actor.maxTp();

      // Assert- the point is that this file did not substitute a curve of its own for a class that
      // never asked for one.
      expect(result).toBe(40);
    });
  });
});
//endregion plugins/level/_component/game-actor-max-level.test.js
