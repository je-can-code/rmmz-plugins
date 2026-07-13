//region level-sync.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from '../../fixtures/install-level-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * level/ext/sync/_metadata/initialization.js. Call this right before importing it.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
function setPluginContextToJLevelSync(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Level-Sync';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Resets $gameMap's content-sync-by-map-note state to inert defaults, mirroring what a freshly
 * loaded map with no sync note would look like. A manual stub, not real Game_Map- the map-note
 * parsing path (onMapLoaded) needs a much heavier $dataMap/RPGManager setup than these tests need.
 */
function clearMapSync()
{
  globalThis.$gameMap = {
    _j: { _levelSync: { _contentSyncLevel: null, _contentSyncUplevel: false } },
    getMapContentSyncLevel: globalThis.Game_Map.prototype.getMapContentSyncLevel,
    isMapContentSyncUplevel: globalThis.Game_Map.prototype.isMapContentSyncUplevel,
  };
}

function setMapSync(level, uplevel = false)
{
  globalThis.$gameMap._j._levelSync._contentSyncLevel = level;
  globalThis.$gameMap._j._levelSync._contentSyncUplevel = uplevel;
}

function makeActor(realLevel)
{
  const actor = new globalThis.Game_Actor();
  actor.initMembers();
  actor._level = realLevel;
  return actor;
}

describe('J-Level-Sync (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJLevel();
    await import('../../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/level/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/level/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/level/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/level/core/objects/Game_System.js');

    installPluginManagerWithParams(globalThis, 'J-Level-Sync', {
      'sync-indicator-icon': '75',
      'sync-affects-exp': 'false',
    });

    setPluginContextToJLevelSync();
    await import('../../../../../src/plugins/level/ext/sync/_metadata/initialization.js');

    // patches globalThis.Game_System.prototype/Game_Actor.prototype/Game_Map.prototype directly.
    await import('../../../../../src/plugins/level/ext/sync/objects/Game_System.js');
    await import('../../../../../src/plugins/level/ext/sync/objects/Game_Actor.js');
    await import('../../../../../src/plugins/level/ext/sync/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    clearMapSync();
  });

  describe('cap-only sync (uplevel = false)', () =>
  {
    it('clamps an overleveled actor down to the sync level', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(50);
    });

    it('leaves an underleveled actor at their real level', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(30);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(30);
    });

    it('leaves an actor at the sync level unchanged', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(50);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(50);
    });
  });

  describe('uplevel sync (uplevel = true)', () =>
  {
    it('clamps an overleveled actor down to the sync level', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, true);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(50);
    });

    it('boosts an underleveled actor up to the sync level', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, true);
      const actor = makeActor(30);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(50);
    });
  });

  describe('save data integrity', () =>
  {
    it('does not mutate _level after cap-only sync', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);

      // Act
      actor.getLevel();

      // Assert
      expect(actor._level).toBe(90);
    });

    it('does not mutate _level after uplevel sync', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, true);
      const actor = makeActor(30);

      // Act
      actor.getLevel();

      // Assert
      expect(actor._level).toBe(30);
    });
  });

  describe('session priority over map note', () =>
  {
    it('session level wins over a conflicting map note', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      setMapSync(30, false);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(50);
    });

    it('map note applies when no session is active', () =>
    {
      // Arrange
      setMapSync(40, false);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(40);
    });

    it('underleveled actor is unaffected by map note in cap-only mode', () =>
    {
      // Arrange
      setMapSync(40, false);
      const actor = makeActor(20);

      // Act
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(20);
    });
  });

  describe('clearContentSyncSession', () =>
  {
    it('restores the real effective level after clearing a session', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);
      actor.getLevel();

      // Act
      globalThis.$gameSystem.clearContentSyncSession();
      const result = actor.getLevel();

      // Assert
      expect(result).toBe(90);
    });
  });

  describe('isContentSynced()', () =>
  {
    it('returns false when no sync is active', () =>
    {
      // Arrange
      const actor = makeActor(50);

      // Act
      const result = actor.isContentSynced();

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when a session is active', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);

      // Act
      const result = actor.isContentSynced();

      // Assert
      expect(result).toBe(true);
    });

    it('returns true when a map note sync is active', () =>
    {
      // Arrange
      setMapSync(40, false);
      const actor = makeActor(90);

      // Act
      const result = actor.isContentSynced();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false after clearing the session', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);
      globalThis.$gameSystem.clearContentSyncSession();

      // Act
      const result = actor.isContentSynced();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getLevelForExp()', () =>
  {
    it('returns real _level when sync-affects-exp is false (default)', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevelForExp();

      // Assert
      expect(result).toBe(90);
    });

    it('returns real _level when no sync is active regardless of parameter', () =>
    {
      // Arrange
      const actor = makeActor(75);

      // Act
      const result = actor.getLevelForExp();

      // Assert
      expect(result).toBe(75);
    });

    it('returns the synced level when sync-affects-exp is true', () =>
    {
      // Arrange
      const previousSyncAffectsExp = globalThis.J.LEVEL.EXT.SYNC.Metadata.syncAffectsExp;
      globalThis.J.LEVEL.EXT.SYNC.Metadata.syncAffectsExp = true;
      globalThis.$gameSystem.setContentSyncSession(50, false);
      const actor = makeActor(90);

      // Act
      const result = actor.getLevelForExp();

      // Assert
      expect(result).toBe(50);
      globalThis.J.LEVEL.EXT.SYNC.Metadata.syncAffectsExp = previousSyncAffectsExp;
    });
  });
});
//endregion level-sync.test.js
