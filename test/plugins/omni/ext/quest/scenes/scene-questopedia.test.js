//region plugins/omni/ext/quest/scenes/scene-questopedia.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';
import { installQuestConfig, SAMPLE_QUEST_CONFIG } from '../../../_component/fixtures/install-omni-host-globals.js';

/**
 * Builds one objective row shaped the way `data/config.quest.json` shapes it.
 * @param {number} id The objective's id, which is also its position.
 * @param {boolean} hiddenByDefault Whether the objective stays out of the journal until it activates.
 * @returns {object}
 */
const objective = (id, hiddenByDefault) => ({
  id,
  type: 'Indiscriminate',
  description: `Objective ${id}`,
  logs: {
    inactive: '',
    active: `Working on ${id}.`,
    completed: `Finished ${id}.`,
    failed: '',
    missed: '',
  },
  fulfillment: {
    indiscriminate: { hint: `Do the thing ${id}.` },
    destination: { mapId: -1, x1: -1, x2: -1, y1: -1, y2: -1 },
    fetch: { type: -1, id: 0, amount: 0 },
    slay: { id: 0, amount: 0 },
    quest: { keys: [] },
  },
  hiddenByDefault,
  isOptional: false,
});

/**
 * The shared sample, extended with a main quest that has objectives and a category holding nothing.
 *
 * The sample's only real quest has no objectives, and a quest with no objectives cannot be unlocked
 * (there is nothing to activate), so tracking and the objectives pane need a quest of their own. The
 * empty category is what proves the panes clear rather than describe a quest from the tab before.
 * @type {{quests: object[], categories: object[], tags: object[]}}
 */
const SCENE_QUEST_CONFIG = {
  quests: [
    ...SAMPLE_QUEST_CONFIG.quests,
    {
      name: 'Main One',
      key: 'main-one',
      categoryKey: 'main',
      tagKeys: [ 'foraging' ],
      unknownHint: 'Something main is afoot.',
      overview: 'A main quest with three objectives, one of them never hidden.',
      recommendedLevel: 1,
      objectives: [ objective(0, true), objective(1, false), objective(2, true) ],
    },
  ],
  categories: [
    ...SAMPLE_QUEST_CONFIG.categories,
    {
      name: 'Hunt',
      key: 'hunt',
      iconIndex: 4,
    },
  ],
  tags: SAMPLE_QUEST_CONFIG.tags,
};

/**
 * The facet layout and the category ring are seams between the scene, J-Base's chrome and the
 * quest windows, and none of them exists until all three are real. So this boots the actual view
 * layer and loads the actual bundles, the way the shipped game does.
 */
describe('Scene_Questopedia (real view layer)', () =>
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

    // the quest bundle reads these prototypes at load, outside its own J.ABS guard. Nothing here
    // executes a combat hook, so bare functions carrying the aliased methods are enough.
    globalThis.JABS_Engine = function JABS_Engine() {};
    globalThis.JABS_Battler = function JABS_Battler() {};
    globalThis.JABS_MetricsManager = { isItemSlot: () => false };
    globalThis.JABS_StandardController = function JABS_StandardController() {};
    globalThis.JABS_StandardController.prototype.update = function() {};
    globalThis.Window_JabsRemapActions = function Window_JabsRemapActions() {};
    globalThis.Window_JabsRemapActions.prototype.buildPostExtensionGroups = function() {};
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

    // the quest bundle builds its metadata from the config file the moment it loads.
    installQuestConfig(globalThis, SCENE_QUEST_CONFIG);

    const questBundle = path.join(repoRoot, 'out/omni/ext/J-OMNI-Quests.js');
    vm.runInThisContext(fs.readFileSync(questBundle, 'utf-8'), { filename: questBundle });
  });

  beforeEach(() =>
  {
    // the harness built the party before the bundles aliased its initialization, so it carries no
    // questopedia trackings. Rebuilding it here also resets every quest between tests.
    globalThis.DataManager.createGameObjects();
  });

  /**
   * Builds and creates the scene, which lays out every window.
   * @returns {object} The created scene.
   */
  const createScene = () =>
  {
    const scene = new globalThis.Scene_Questopedia();
    scene.create();

    return scene;
  };

  /**
   * The symbols of the rows the quest list currently shows.
   * @param {object} scene The created scene.
   * @returns {string[]}
   */
  const listedQuestKeys = scene => scene.getQuestopediaListWindow()
    .commandList()
    .map(command => command.symbol);

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
        scene.getCategoryStripWindow(),
        scene.getQuestopediaListWindow(),
        scene.getQuestopediaDescriptionWindow(),
        scene.getQuestopediaObjectivesWindow(),
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

    it('stacks the list beneath the strip and the objectives beneath the description', () =>
    {
      // Arrange
      const scene = createScene();
      const strip = scene.getCategoryStripWindow();
      const list = scene.getQuestopediaListWindow();
      const description = scene.getQuestopediaDescriptionWindow();
      const objectives = scene.getQuestopediaObjectivesWindow();

      // Act & Assert: the column pieces share an x and meet edge to edge; so do the right-side pieces.
      expect(list.x).toBe(strip.x);
      expect(list.y).toBe(strip.y + strip.height);
      expect(objectives.x).toBe(description.x);
      expect(objectives.y).toBe(description.y + description.height);
      expect(description.x).toBe(list.x + list.width);
    });
  });

  describe('control legend', () =>
  {
    it('teaches the category triggers and the track button', () =>
    {
      // Arrange & Act
      const scene = createScene();
      const entries = scene.getControlLegendWindow()
        .entries();

      // Assert
      expect(entries.map(entry => entry.label)).toEqual([ 'category', 'track' ]);
      expect(entries.at(0).semantic).toEqual([ 'content-prev', 'content-next' ]);
      expect(entries.at(1).semantic).toBe('ok');
    });
  });

  describe('category ring', () =>
  {
    it('opens on the first authored category with the strip naming it', () =>
    {
      // Arrange & Act
      const scene = createScene();

      // Assert: the strip and the list agree, and the list holds only that category's quest.
      expect(scene.getCategoryStripWindow()
        .activePosition().key).toBe('main');
      expect(listedQuestKeys(scene)).toEqual([ 'main-one' ]);
    });

    it('walking the ring repoints the strip and refilters the list', () =>
    {
      // Arrange: the side category holds a different quest, which is the sibling that has to appear.
      const scene = createScene();

      // Act
      scene.cycleQuestCategories(true);

      // Assert
      expect(scene.getCategoryStripWindow()
        .activePosition().key).toBe('side');
      expect(listedQuestKeys(scene)).toEqual([ 'gather-herbs' ]);
      expect(scene.getQuestopediaListWindow().active).toBe(true);
    });

    it('walking backwards from the first category wraps to the last', () =>
    {
      // Arrange
      const scene = createScene();

      // Act
      scene.cycleQuestCategories(false);

      // Assert
      expect(scene.getCategoryStripWindow()
        .activePosition().key).toBe('hunt');
    });

    it('clears both panes when the category holds nothing', () =>
    {
      // Arrange: hunt is the empty category, two steps forward from main.
      const scene = createScene();

      // Act
      scene.cycleQuestCategories(true);
      scene.cycleQuestCategories(true);

      // Assert: nothing is described, and the objectives pane says so in its one placeholder row.
      expect(listedQuestKeys(scene)).toEqual([]);
      expect(scene.getQuestopediaDescriptionWindow()
        .getCurrentQuest()).toBeNull();
      expect(scene.getQuestopediaObjectivesWindow()
        .maxItems()).toBe(1);
      expect(scene.getQuestopediaObjectivesWindow()
        .commandSymbol(0)).toBe(0);
    });
  });

  describe('tracking', () =>
  {
    it('confirming an unlocked quest tracks it and hands the cursor back', () =>
    {
      // Arrange: only an unlocked quest can be tracked, so it is unlocked before the scene lists it.
      globalThis.QuestManager.unlockQuestByKey('main-one');
      const scene = createScene();
      const list = scene.getQuestopediaListWindow();
      list.select(0);

      // Act
      scene.onQuestopediaListSelection();

      // Assert
      expect(globalThis.QuestManager.quest('main-one')
        .isTracked()).toBe(true);
      expect(list.active).toBe(true);
    });

    it('confirming a tracked quest untracks it', () =>
    {
      // Arrange
      globalThis.QuestManager.unlockQuestByKey('main-one');
      globalThis.QuestManager.setQuestTrackingByKey('main-one', true);
      const scene = createScene();
      scene.getQuestopediaListWindow()
        .select(0);

      // Act
      scene.onQuestopediaListSelection();

      // Assert
      expect(globalThis.QuestManager.quest('main-one')
        .isTracked()).toBe(false);
    });
  });

  describe('objectives pane', () =>
  {
    it('builds one row per known objective, each with its fulfillment and log beneath', () =>
    {
      // Arrange: unlocking activates objective 0; objective 1 was never hidden; objective 2 is the
      // hidden sibling that must stay out of the pane.
      globalThis.QuestManager.unlockQuestByKey('main-one');
      const scene = createScene();
      const objectives = scene.getQuestopediaObjectivesWindow();

      // Act
      scene.getQuestopediaListWindow()
        .select(0);

      // Assert
      expect(objectives.maxItems()).toBe(2);
      expect(objectives.commandSymbol(0)).toBe(0);
      expect(objectives.commandSymbol(1)).toBe(1);
      expect(objectives.commandSubtext(0)).toEqual([ 'Do the thing 0.', 'Working on 0.' ]);
    });

    it('follows the description when the highlighted quest is still unknown', () =>
    {
      // Arrange: nothing unlocked, so every objective is hidden and inactive.
      const scene = createScene();

      // Act
      scene.getQuestopediaListWindow()
        .select(0);

      // Assert: the description still names the quest; the objectives pane shows its placeholder.
      expect(scene.getQuestopediaDescriptionWindow()
        .getCurrentQuest().key).toBe('main-one');
      expect(scene.getQuestopediaObjectivesWindow()
        .maxItems()).toBe(1);
    });
  });
});
//endregion plugins/omni/ext/quest/scenes/scene-questopedia.test.js
