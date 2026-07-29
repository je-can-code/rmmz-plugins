//region plugins/level/ext/sync/_component/map-notes-and-session.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from '../../../_component/fixtures/install-level-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * level/ext/sync/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
function setPluginContextToJLevelSync(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Level-Sync';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

describe('J-Level-Sync map notes and session storage (direct src import)', () =>
{
  /** @type {Map<string, Function>[]} */
  let registeredCommands;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));

    // both the level core and the sync extension alias onAfterLoad, and each captures whatever is on
    // the prototype at its own import time. The stub therefore has to exist before the *first* of
    // them loads, or core saves `undefined` and the whole alias chain dies on `.call`.
    globalThis.Game_System.prototype.onAfterLoad ??= function()
    {
    };

    setPluginContextToJLevel();
    await import('../../../../../../src/plugins/level/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/level/core/objects/Game_System.js');

    installPluginManagerWithParams(globalThis, 'J-Level-Sync', {
      'sync-indicator-icon': '75',
      'sync-affects-exp': 'false',
    });

    // capture command handlers as they register so they can be invoked directly later.
    registeredCommands = new Map();
    const previousRegister = globalThis.PluginManager.registerCommand;
    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      registeredCommands.set(commandName, handler);

      if (previousRegister) previousRegister(pluginName, commandName, handler);
    };

    setPluginContextToJLevelSync();
    await import('../../../../../../src/plugins/level/ext/sync/_metadata/initialization.js');

    await import('../../../../../../src/plugins/level/ext/sync/objects/Game_System.js');

    // the sync layer aliases both of these, capturing whatever exists at import time. Recording the
    // calls here is what lets the tests below prove the extension still calls through.
    globalThis.Game_Map.prototype.initialize = function()
    {
      this.originalInitializeRan = true;
    };
    globalThis.Game_Map.prototype.setup = function(mapId)
    {
      this.originalSetupMapId = mapId;
    };

    await import('../../../../../../src/plugins/level/ext/sync/objects/Game_Map.js');
    await import('../../../../../../src/plugins/level/ext/sync/_metadata/pluginCommands.js');
  });

  /** @type {object[]} */
  let partyMembers;
  let previousNatural;

  beforeEach(() =>
  {
    previousNatural = globalThis.J.NATURAL;

    partyMembers = [
      { refreshAllParameterBuffs: vi.fn(), onBattlerDataChange: vi.fn() },
      { refreshAllParameterBuffs: vi.fn(), onBattlerDataChange: vi.fn() },
    ];

    globalThis.$gameParty = { members: () => partyMembers };

    // the level *core* half of the onAfterLoad chain rebuilds beyond-max parameter data through
    // $gameTemp; the sync layer under test runs after it, so that hop has to succeed.
    globalThis.$gameTemp = { buildBeyondMaxData: vi.fn() };

    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$dataMap = { note: '' };
  });

  afterEach(() =>
  {
    globalThis.J.NATURAL = previousNatural;
  });

  describe('Game_System session storage', () =>
  {
    it('starts with no active session', () =>
    {
      // Arrange & Act & Assert- a fresh game is not synced to anything.
      expect(globalThis.$gameSystem.getContentSyncSession()).toBe(null);
      expect(globalThis.$gameSystem.hasContentSyncSession()).toBe(false);
    });

    it('records the level and uplevel flag of a started session', () =>
    {
      // Arrange & Act
      globalThis.$gameSystem.setContentSyncSession(25, true);

      // Assert
      expect(globalThis.$gameSystem.getContentSyncSession()).toEqual({ level: 25, uplevel: true });
      expect(globalThis.$gameSystem.hasContentSyncSession()).toBe(true);
    });

    it('drops the session when cleared', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(25, true);

      // Act
      globalThis.$gameSystem.clearContentSyncSession();

      // Assert- clearing is what restores real effective levels after a synced dungeon.
      expect(globalThis.$gameSystem.hasContentSyncSession()).toBe(false);
    });

    it('rebuilds session storage when loading a save that predates this plugin', () =>
    {
      // Arrange- an older save has no `_levelSync` bucket at all, and reading through it blind would
      // throw on the very first sync check after loading.
      const system = new globalThis.Game_System();
      system.initialize();
      delete system._j._levelSync;

      // Act
      system.onAfterLoad();

      // Assert
      expect(system.getContentSyncSession()).toBe(null);
    });

    it('preserves an existing session across a save load', () =>
    {
      // Arrange- saving inside a synced dungeon and loading back in must not silently unsync.
      const system = new globalThis.Game_System();
      system.initialize();
      system.setContentSyncSession(30, false);

      // Act
      system.onAfterLoad();

      // Assert
      expect(system.getContentSyncSession()).toEqual({ level: 30, uplevel: false });
    });

    it('refreshes every party member after a save load', () =>
    {
      // Arrange- stats and HUD are derived from the effective level, so they need recomputing.
      const system = new globalThis.Game_System();
      system.initialize();

      // Act
      system.onAfterLoad();

      // Assert
      partyMembers.forEach(member => expect(member.onBattlerDataChange).toHaveBeenCalled());
    });

    it('refreshes parameter buffs on load only when J-Natural is present', () =>
    {
      // Arrange- the buff system is an optional sibling plugin.
      globalThis.J.NATURAL = {};
      const system = new globalThis.Game_System();
      system.initialize();

      // Act
      system.onAfterLoad();

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).toHaveBeenCalled());
    });

    it('skips parameter buff refresh on load when J-Natural is absent', () =>
    {
      // Arrange
      delete globalThis.J.NATURAL;
      const system = new globalThis.Game_System();
      system.initialize();

      // Act
      system.onAfterLoad();

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).not.toHaveBeenCalled());
    });
  });

  describe('Game_Map sync state', () =>
  {
    /**
     * Builds a map stand-in with the level-sync members initialized.
     * @returns {object}
     */
    const buildMap = () =>
    {
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initLevelSyncMembers();

      return map;
    };

    it('seeds sync state during map construction', () =>
    {
      // Arrange- getLevel can be consulted before any map is set up, so the accessors have to be
      // safe from the moment the map object exists.
      const map = Object.create(globalThis.Game_Map.prototype);

      // Act
      map.initialize();

      // Assert
      expect(map.originalInitializeRan).toBe(true);
      expect(map.getMapContentSyncLevel()).toBe(null);
    });

    it('re-reads sync tags whenever a new map is set up', () =>
    {
      // Arrange- each map carries its own sync note, so state cannot survive a transfer.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();
      globalThis.$dataMap = { note: '<levelSync:40>' };

      // Act
      map.setup(12);

      // Assert
      expect(map.originalSetupMapId).toBe(12);
      expect(map.getMapContentSyncLevel()).toBe(40);
    });

    it('clears a previous map sync level when the new map declares none', () =>
    {
      // Arrange- walking out of a synced dungeon into an ordinary map must drop the sync.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();
      globalThis.$dataMap = { note: '<levelSync:40>' };
      map.setup(12);

      // Act
      globalThis.$dataMap = { note: '' };
      map.setup(13);

      // Assert
      expect(map.getMapContentSyncLevel()).toBe(null);
    });

    it('refreshes the party on setup when no session is overriding the map', () =>
    {
      // Arrange- the map-note sync has to take effect on arrival, not on the next battle.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();

      // Act
      map.setup(12);

      // Assert
      partyMembers.forEach(member => expect(member.onBattlerDataChange).toHaveBeenCalled());
    });

    it('leaves the party alone on setup while a session is active', () =>
    {
      // Arrange- an explicit session outranks the map note, so there is nothing to re-apply.
      globalThis.$gameSystem.setContentSyncSession(30, false);
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();

      // Act
      map.setup(12);

      // Assert
      partyMembers.forEach(member => expect(member.onBattlerDataChange).not.toHaveBeenCalled());
    });

    it('refreshes parameter buffs on setup only when J-Natural is present', () =>
    {
      // Arrange
      globalThis.J.NATURAL = {};
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();

      // Act
      map.setup(12);

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).toHaveBeenCalled());
    });

    it('skips parameter buff refresh on setup when J-Natural is absent', () =>
    {
      // Arrange
      delete globalThis.J.NATURAL;
      const map = Object.create(globalThis.Game_Map.prototype);
      map.initialize();

      // Act
      map.setup(12);

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).not.toHaveBeenCalled());
    });

    it('initializes sync state to inert defaults', () =>
    {
      // Arrange & Act- accessors must be safe before the first setup() call.
      const map = buildMap();

      // Assert
      expect(map.getMapContentSyncLevel()).toBe(null);
      expect(map.isMapContentSyncUplevel()).toBe(false);
    });

    it('preserves sibling data already stored under the shared namespace', () =>
    {
      // Arrange- `_j` is shared across every J plugin.
      const map = Object.create(globalThis.Game_Map.prototype);
      map._j = { _someOtherPlugin: 'keep me' };

      // Act
      map.initLevelSyncMembers();

      // Assert
      expect(map._j._someOtherPlugin).toBe('keep me');
    });

    it('reads a sync level out of the map note', () =>
    {
      // Arrange
      const map = buildMap();
      globalThis.$dataMap = { note: '<levelSync:25>' };

      // Act
      map.parseMapContentSyncTags();

      // Assert
      expect(map.getMapContentSyncLevel()).toBe(25);
    });

    it('treats a missing sync level as no sync at all', () =>
    {
      // Arrange- most maps carry no tag, and those must stay unsynced rather than syncing to zero.
      const map = buildMap();
      globalThis.$dataMap = { note: '' };

      // Act
      map.parseMapContentSyncTags();

      // Assert
      expect(map.getMapContentSyncLevel()).toBe(null);
    });

    it('reads the uplevel flag out of the map note', () =>
    {
      // Arrange- uplevel means underleveled actors are boosted up rather than only clamped down.
      const map = buildMap();
      globalThis.$dataMap = { note: '<levelSync:25>\n<levelSyncUp>' };

      // Act
      map.parseMapContentSyncTags();

      // Assert
      expect(map.isMapContentSyncUplevel()).toBe(true);
    });

    it('defaults the uplevel flag to off when the tag is absent', () =>
    {
      // Arrange
      const map = buildMap();
      globalThis.$dataMap = { note: '<levelSync:25>' };

      // Act
      map.parseMapContentSyncTags();

      // Assert
      expect(map.isMapContentSyncUplevel()).toBe(false);
    });
  });

  describe('plugin commands', () =>
  {
    it('starts a session at the requested level', () =>
    {
      // Arrange- the arguments arrive from the editor as strings.
      const handler = registeredCommands.get('setContentSync');

      // Act
      handler({ level: '30', uplevel: 'true' });

      // Assert
      expect(globalThis.$gameSystem.getContentSyncSession()).toEqual({ level: 30, uplevel: true });
    });

    it('treats any uplevel argument other than the literal true as off', () =>
    {
      // Arrange
      const handler = registeredCommands.get('setContentSync');

      // Act
      handler({ level: '30', uplevel: 'false' });

      // Assert
      expect(globalThis.$gameSystem.getContentSyncSession()).toEqual({ level: 30, uplevel: false });
    });

    it('refreshes every party member when a session starts', () =>
    {
      // Arrange- the sync has to take visible effect immediately, not on the next battle.
      const handler = registeredCommands.get('setContentSync');

      // Act
      handler({ level: '30', uplevel: 'false' });

      // Assert
      partyMembers.forEach(member => expect(member.onBattlerDataChange).toHaveBeenCalled());
    });

    it('refreshes parameter buffs on session start only when J-Natural is present', () =>
    {
      // Arrange
      globalThis.J.NATURAL = {};
      const handler = registeredCommands.get('setContentSync');

      // Act
      handler({ level: '30', uplevel: 'false' });

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).toHaveBeenCalled());
    });

    it('skips parameter buff refresh on session start when J-Natural is absent', () =>
    {
      // Arrange
      delete globalThis.J.NATURAL;
      const handler = registeredCommands.get('setContentSync');

      // Act
      handler({ level: '30', uplevel: 'false' });

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).not.toHaveBeenCalled());
    });

    it('ends the active session', () =>
    {
      // Arrange
      globalThis.$gameSystem.setContentSyncSession(30, true);
      const handler = registeredCommands.get('clearContentSync');

      // Act
      handler();

      // Assert
      expect(globalThis.$gameSystem.hasContentSyncSession()).toBe(false);
    });

    it('refreshes every party member when a session ends', () =>
    {
      // Arrange- restoring real levels is just as visible a change as applying the sync was.
      globalThis.$gameSystem.setContentSyncSession(30, true);
      const handler = registeredCommands.get('clearContentSync');

      // Act
      handler();

      // Assert
      partyMembers.forEach(member => expect(member.onBattlerDataChange).toHaveBeenCalled());
    });

    it('refreshes parameter buffs on session end only when J-Natural is present', () =>
    {
      // Arrange
      globalThis.J.NATURAL = {};
      const handler = registeredCommands.get('clearContentSync');

      // Act
      handler();

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).toHaveBeenCalled());
    });

    it('skips parameter buff refresh on session end when J-Natural is absent', () =>
    {
      // Arrange
      delete globalThis.J.NATURAL;
      const handler = registeredCommands.get('clearContentSync');

      // Act
      handler();

      // Assert
      partyMembers.forEach(member => expect(member.refreshAllParameterBuffs).not.toHaveBeenCalled());
    });
  });
});
//endregion plugins/level/ext/sync/_component/map-notes-and-session.test.js
