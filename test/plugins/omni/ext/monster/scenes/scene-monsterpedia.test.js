//region plugins/omni/ext/monster/scenes/scene-monsterpedia.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';
import { installOmniConfig } from '../../../_component/fixtures/install-omni-host-globals.js';

/**
 * Three pages rather than the game's two, so walking the ring forwards and walking it backwards from
 * the first page land in different places, and a ring walked the wrong way cannot pass.
 * @type {{monsterTypes: {key: string, name: string, iconIndex: number, showsStats: boolean}[]}}
 */
const SCENE_OMNI_CONFIG = {
  monsterTypes: [
    { key: 'enemy', name: 'Monsterpedia', iconIndex: 14, showsStats: true },
    { key: 'destructible', name: 'Destructapedia', iconIndex: 210, showsStats: false },
    { key: 'summon', name: 'Summonpedia', iconIndex: 77, showsStats: true },
  ],
};

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
    // existence matters here; nothing in this test executes a combat hook or pictures an enemy.
    globalThis.JABS_Engine = function JABS_Engine() {};
    globalThis.JABS_Battler = function JABS_Battler() {};
    globalThis.JABS_MetricsManager = { isItemSlot: () => false };
    globalThis.Game_Enemy = globalThis.Game_Enemy ?? function Game_Enemy() {};

    [
      'out/base/J-Base.js',
      'out/base/ext/J-Base-Save.js',
      'out/omni/J-Omnipedia.js',
    ].forEach(relative =>
    {
      const bundle = path.join(repoRoot, relative);

      vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
    });

    // the monster bundle reads its pages from the omnipedia's configuration the moment it loads.
    installOmniConfig(globalThis, SCENE_OMNI_CONFIG);

    const monsterBundle = path.join(repoRoot, 'out/omni/ext/J-OMNI-Monsters.js');
    vm.runInThisContext(fs.readFileSync(monsterBundle, 'utf-8'), { filename: monsterBundle });
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

    it('lays every window inside the facet region and above the legend', () =>
    {
      // Arrange
      const scene = createScene();
      const facetArea = scene.facetAreaRect();
      const legend = scene.getControlLegendWindow();
      const windows = [
        scene.getTypeStripWindow(),
        scene.getMonsterpediaListWindow(),
        scene.getMonsterpediaDetailWindow(),
      ];

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

    it('crowns the column with the strip, stacks the list beneath it, and gives the detail the rest', () =>
    {
      // Arrange
      const scene = createScene();
      const facetArea = scene.facetAreaRect();
      const strip = scene.getTypeStripWindow();
      const list = scene.getMonsterpediaListWindow();
      const detail = scene.getMonsterpediaDetailWindow();

      // Act & Assert: the strip and the list share the column and meet edge to edge, the list runs to
      // the bottom of the region, and the detail starts where the column ends and fills the far side.
      expect(strip.y).toBe(facetArea.y);
      expect(list.x).toBe(strip.x);
      expect(list.y).toBe(strip.y + strip.height);
      expect(list.width).toBe(scene.commandColumnWidth());
      expect(list.y + list.height).toBe(facetArea.y + facetArea.height);
      expect(detail.x).toBe(list.x + list.width);
      expect(detail.x + detail.width).toBe(facetArea.x + facetArea.width);
      expect(detail.height).toBe(facetArea.height);
    });
  });

  describe('control legend', () =>
  {
    it('teaches the shoulder triggers that flip between pages', () =>
    {
      // Arrange & Act
      const scene = createScene();
      const entries = scene.getControlLegendWindow()
        .entries();

      // Assert: cancel stays self-evident; the page triggers are the one thing worth teaching.
      expect(entries.map(entry => entry.label)).toEqual([ 'pedia' ]);
      expect(entries.at(0).semantic).toEqual([ 'content-prev', 'content-next' ]);
    });
  });

  describe('page ring', () =>
  {
    it('opens on the first authored page, with the strip and the list agreeing on it', () =>
    {
      // Arrange & Act
      const scene = createScene();

      // Assert
      expect(scene.getTypeStripWindow()
        .activePosition().key).toBe('enemy');
      expect(scene.getMonsterpediaListWindow()
        .getCurrentTypeKey()).toBe('enemy');
    });

    it('walking the ring forwards repoints the strip and the list, and hands the list its input back', () =>
    {
      // Arrange
      const scene = createScene();

      // Act
      scene.cycleMonsterTypes(true);

      // Assert
      expect(scene.getTypeStripWindow()
        .activePosition().key).toBe('destructible');
      expect(scene.getMonsterpediaListWindow()
        .getCurrentTypeKey()).toBe('destructible');
      expect(scene.getMonsterpediaListWindow().active).toBe(true);
    });

    it('walking backwards from the first page wraps to the last', () =>
    {
      // Arrange
      const scene = createScene();

      // Act
      scene.cycleMonsterTypes(false);

      // Assert
      expect(scene.getMonsterpediaListWindow()
        .getCurrentTypeKey()).toBe('summon');
    });

    it('binds the shoulder triggers on the list to walking the ring', () =>
    {
      // Arrange
      const scene = createScene();
      const list = scene.getMonsterpediaListWindow();

      // Act
      list.callHandler('content-next');
      list.callHandler('content-next');
      const afterTwoForward = list.getCurrentTypeKey();
      list.callHandler('content-prev');
      const afterOneBack = list.getCurrentTypeKey();

      // Assert
      expect(afterTwoForward).toBe('summon');
      expect(afterOneBack).toBe('destructible');
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
