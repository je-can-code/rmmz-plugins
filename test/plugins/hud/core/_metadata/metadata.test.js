//region plugins/hud/core/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
} from '../../_component/fixtures/install-hud-host-globals.js';

const HUD_INIT_PATH = '../../../../../src/plugins/hud/core/_metadata/initialization.js';

describe('J-HUD metadata (direct src import)', () =>
{
  /** @type {Map<string, Function>} the plugin commands this ship registers at import time. */
  let handlers;

  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    // capture the commands as they register rather than reaching into PluginManager afterward.
    handlers = new Map();
    const previousPluginManager = globalThis.PluginManager;
    globalThis.PluginManager = {
      parameters: name => previousPluginManager.parameters(name),
      registerCommand: (pluginName, commandName, handler) => handlers.set(commandName, handler),
    };

    setPluginContextToJHud();
    await import(HUD_INIT_PATH);
  });

  describe('plugin commands', () =>
  {
    it('registers every hud command under the J-HUD plugin name', () =>
    {
      // Arrange & Act (registration happened in beforeAll)

      // Assert
      expect([ ...handlers.keys() ]).toEqual([
        'hideHud', 'showHud', 'hideAllies', 'showAllies', 'refreshHud', 'refreshImageCache',
      ]);
    });

    it('hideHud asks the hud manager to hide', () =>
    {
      // Arrange- every command defers to the manager rather than touching sprites directly, so the
      // request survives the hud not being on screen yet.
      globalThis.$hudManager = { requestHideHud: vi.fn() };

      // Act
      handlers.get('hideHud')();

      // Assert
      expect(globalThis.$hudManager.requestHideHud).toHaveBeenCalled();
    });

    it('showHud asks the hud manager to show', () =>
    {
      // Arrange
      globalThis.$hudManager = { requestShowHud: vi.fn() };

      // Act
      handlers.get('showHud')();

      // Assert
      expect(globalThis.$hudManager.requestShowHud).toHaveBeenCalled();
    });

    it('hideAllies asks the hud manager to hide the ally frames', () =>
    {
      // Arrange
      globalThis.$hudManager = { requestHideAllies: vi.fn() };

      // Act
      handlers.get('hideAllies')();

      // Assert
      expect(globalThis.$hudManager.requestHideAllies).toHaveBeenCalled();
    });

    it('showAllies asks the hud manager to show the ally frames', () =>
    {
      // Arrange
      globalThis.$hudManager = { requestShowAllies: vi.fn() };

      // Act
      handlers.get('showAllies')();

      // Assert
      expect(globalThis.$hudManager.requestShowAllies).toHaveBeenCalled();
    });

    it('refreshHud asks the hud manager to refresh', () =>
    {
      // Arrange
      globalThis.$hudManager = { requestRefreshHud: vi.fn() };

      // Act
      handlers.get('refreshHud')();

      // Assert
      expect(globalThis.$hudManager.requestRefreshHud).toHaveBeenCalled();
    });

    it('refreshImageCache asks the hud manager to rebuild its image cache', () =>
    {
      // Arrange- face and icon bitmaps are cached, so swapping an actor's graphic mid-game needs
      // an explicit nudge rather than waiting for the next natural refresh.
      globalThis.$hudManager = { requestRefreshImageCache: vi.fn() };

      // Act
      handlers.get('refreshImageCache')();

      // Assert
      expect(globalThis.$hudManager.requestRefreshImageCache).toHaveBeenCalled();
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below the hud's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJHud();

      // Act & Assert
      await expect(import(HUD_INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJHud();

      // Act & Assert
      await expect(import(HUD_INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/hud/core/_metadata/metadata.test.js
