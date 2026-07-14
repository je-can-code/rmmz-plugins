//region plugins/map/_component/plugin-command-toggle-minimap.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMapHostGlobals, setPluginContextToJBase, setPluginContextToJMap } from './fixtures/install-map-host-globals.js';

describe('J-MAP plugin command toggle-minimap (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../../src/plugins/map/core/_metadata/initialization.js');

    // registers the plugin command as an import-time side effect, no vm involved.
    await import('../../../../src/plugins/map/core/_metadata/pluginCommands.js');
  });

  it('forces hide when map is blocked (even if commanded to show)', () =>
  {
    // Arrange
    globalThis.$gameMap.isMinimapBlocked = () => true;
    const mini = { visible: true };
    const scene = new globalThis.Scene_Map();
    scene.getMiniMap = function()
    {
      return mini;
    };
    globalThis.SceneManager._scene = scene;
    const cmd = globalThis.PluginManager.__commands.get('J-MAP:toggle-minimap');

    // Act
    cmd({ action: 'true' });

    // Assert
    expect(globalThis.$gameSystem.isMinimapVisible()).toBe(false);
    expect(mini.visible).toBe(false);
  });

  it('honors shouldShow when not blocked and updates minimap visibility on Scene_Map', () =>
  {
    // Arrange
    globalThis.$gameMap.isMinimapBlocked = () => false;
    const mini = { visible: false };
    const scene = new globalThis.Scene_Map();
    scene.getMiniMap = function()
    {
      return mini;
    };
    globalThis.SceneManager._scene = scene;
    const cmd = globalThis.PluginManager.__commands.get('J-MAP:toggle-minimap');

    // Act
    cmd({ action: 'true' });

    // Assert
    expect(globalThis.$gameSystem.isMinimapVisible()).toBe(true);
    expect(mini.visible).toBe(true);

    cmd({ action: 'false' });
    expect(globalThis.$gameSystem.isMinimapVisible()).toBe(false);
    expect(mini.visible).toBe(false);
  });
});
//endregion plugins/map/_component/plugin-command-toggle-minimap.test.js
