//region plugins/map/plugin-command-toggle-minimap.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMapPluginVm } from './map-vm.js';

describe('J-MAP plugin command toggle-minimap (out/J-Map.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadMapPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('forces hide when map is blocked (even if commanded to show)', () =>
  {
    sandbox.$gameMap.isMinimapBlocked = function()
    {
      return true;
    };

    const mini = { visible: true };
    const scene = new sandbox.Scene_Map();
    scene.getMiniMap = function()
    {
      return mini;
    };
    sandbox.SceneManager._scene = scene;

    // command was registered at load time.
    const cmd = sandbox.PluginManager.__commands.get('J-MAP:toggle-minimap');
    cmd({ action: 'true' });

    expect(sandbox.$gameSystem.isMinimapVisible()).toBe(false);
    expect(mini.visible).toBe(false);
  });

  it('honors shouldShow when not blocked and updates minimap visibility on Scene_Map', () =>
  {
    sandbox.$gameMap.isMinimapBlocked = function()
    {
      return false;
    };

    const mini = { visible: false };
    const scene = new sandbox.Scene_Map();
    scene.getMiniMap = function()
    {
      return mini;
    };
    sandbox.SceneManager._scene = scene;

    const cmd = sandbox.PluginManager.__commands.get('J-MAP:toggle-minimap');
    cmd({ action: 'true' });
    expect(sandbox.$gameSystem.isMinimapVisible()).toBe(true);
    expect(mini.visible).toBe(true);

    cmd({ action: 'false' });
    expect(sandbox.$gameSystem.isMinimapVisible()).toBe(false);
    expect(mini.visible).toBe(false);
  });
});
//endregion plugins/map/plugin-command-toggle-minimap.test.js

