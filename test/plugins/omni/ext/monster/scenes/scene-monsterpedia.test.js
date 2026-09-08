//region plugins/omni/ext/monster/scenes/scene-monsterpedia.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';

/**
 * The facet layout is a seam between the scene, J-Base's chrome and the monster windows, and it does
 * not exist until all three are real. So this boots the actual view layer and loads the actual
 * bundles, the way the shipped game does.
 */
describe('Scene_Monsterpedia (real view layer)', () =>
{
  beforeAll(() =>
  {
    // Arrange: the real engine first, then the bundles on top of it.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);

    globalThis.PluginManager.parameters = name =>
    {
      const found = globalThis.$plugins.find(plugin => plugin.name === name);

      return found
        ? found.parameters
        : realParameters(name);
    };

    // the monster bundle aliases J-ABS globals that ship in another bundle entirely. Only their
    // existence matters here; nothing in this test executes a combat hook.
    globalThis.JABS_Engine = function JABS_Engine() {};
    globalThis.JABS_Battler = function JABS_Battler() {};
    globalThis.JABS_MetricsManager = { isItemSlot: () => false };
    globalThis.Game_Enemy = globalThis.Game_Enemy ?? function Game_Enemy() {};

    [
      'out/base/J-Base.js',
      'out/base/ext/J-Base-Save.js',
      'out/omni/J-Omnipedia.js',
      'out/omni/ext/J-OMNI-Monsters.js',
    ].forEach(relative =>
    {
      const bundle = path.join(repoRoot, relative);

      vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
    });
  });

  beforeEach(() =>
  {
    // the harness built the party before the bundles aliased its initialization, so it carries no
    // monsterpedia observations. Rebuilding it here also resets them between tests.
    globalThis.DataManager.createGameObjects();
  });

  /**
   * Builds and creates the scene, which lays out every window.
   * @returns {object} The created scene.
   */
  const createScene = () =>
  {
    const scene = new globalThis.Scene_Monsterpedia();
    scene.create();

    return scene;
  };

  describe('layout', () =>
  {
    it('reserves no help strip across the top', () =>
    {
      // Arrange & Act
      const scene = createScene();

      // Assert: the region starts at the very top, because there is no help window to sit above it.
      expect(scene.facetAreaRect().y).toBe(0);
    });

    it('lays both windows inside the facet region and above the legend', () =>
    {
      // Arrange
      const scene = createScene();
      const facetArea = scene.facetAreaRect();
      const legend = scene.getControlLegendWindow();
      const windows = [ scene.getMonsterpediaListWindow(), scene.getMonsterpediaDetailWindow() ];

      // Act & Assert: each window's far edges stay inside the region, and above where the legend begins.
      windows.forEach(window =>
      {
        expect(window.x).toBeGreaterThanOrEqual(facetArea.x);
        expect(window.y).toBeGreaterThanOrEqual(facetArea.y);
        expect(window.x + window.width).toBeLessThanOrEqual(facetArea.x + facetArea.width);
        expect(window.y + window.height).toBeLessThanOrEqual(facetArea.y + facetArea.height);
        expect(window.y + window.height).toBeLessThanOrEqual(legend.y);
      });
    });

    it('gives the list the whole column and the detail everything beside it', () =>
    {
      // Arrange
      const scene = createScene();
      const facetArea = scene.facetAreaRect();
      const list = scene.getMonsterpediaListWindow();
      const detail = scene.getMonsterpediaDetailWindow();

      // Act & Assert: the list is exactly one command column tall as the region; the detail starts
      // where it ends and runs to the region's far edge.
      expect(list.width).toBe(scene.commandColumnWidth());
      expect(list.height).toBe(facetArea.height);
      expect(detail.x).toBe(list.x + list.width);
      expect(detail.x + detail.width).toBe(facetArea.x + facetArea.width);
      expect(detail.height).toBe(facetArea.height);
    });
  });

  describe('control legend', () =>
  {
    it('has nothing to teach', () =>
    {
      // Arrange & Act
      const scene = createScene();

      // Assert: cancel is self-evident, and the legend window is still there to keep the chrome uniform.
      expect(scene.controlLegendEntries()).toEqual([]);
      expect(scene.getControlLegendWindow()).not.toBeNull();
    });
  });

  describe('wiring', () =>
  {
    it('activates the list so the cursor has somewhere to live', () =>
    {
      // Arrange & Act
      const scene = createScene();

      // Assert
      expect(scene.getMonsterpediaListWindow().active).toBe(true);
    });

    it('binds cancel on the list to leaving the scene', () =>
    {
      // Arrange
      const scene = createScene();
      const realPop = globalThis.SceneManager.pop;
      let pops = 0;
      globalThis.SceneManager.pop = () => pops++;

      // Act
      try
      {
        scene.getMonsterpediaListWindow()
          .callHandler('cancel');
      }
      finally
      {
        // spies on a bare global leak into later tests in this file, so this is restored by hand.
        globalThis.SceneManager.pop = realPop;
      }

      // Assert
      expect(pops).toBe(1);
    });

    it('points the detail at whatever the list has highlighted', () =>
    {
      // Arrange: with no observable enemies seeded, the list is empty and highlights nothing.
      const scene = createScene();
      const detail = scene.getMonsterpediaDetailWindow();

      // Act
      scene.onMonsterpediaIndexChange();

      // Assert: the detail reflects the list's own answer rather than something it made up.
      expect(detail.getObservations()).toBe(scene.getMonsterpediaListWindow()
        .currentExt());
    });
  });
});
//endregion plugins/omni/ext/monster/scenes/scene-monsterpedia.test.js
