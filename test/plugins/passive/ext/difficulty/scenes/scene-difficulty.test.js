//region plugins/passive/ext/difficulty/scenes/scene-difficulty.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDifficultySceneRealm,
  SCENE_DRIVE_TAG,
} from '../_component/fixtures/install-difficulty-scene-realm.js';

/**
 * The difficulty scene, against the real engine, J-Base's facet skeleton, and a real difficulty system.
 *
 * Nearly everything here is a seam: which windows the region holds and where, which rows the two effect lists
 * show for the highlighted layer, and whether the list holds the cursor again after a toggle. The rows' own
 * rules are DifficultyEffects' and are tested there; these tests prove the scene hands it the right layer at
 * the right moment.
 */
describe('Scene_Difficulty', () =>
{
  let Scene_Difficulty;

  /**
   * Builds and creates the scene the way the scene manager does.
   * @returns {Scene_Difficulty}
   */
  const buildScene = () =>
  {
    const scene = new Scene_Difficulty();
    scene.create();

    return scene;
  };

  /**
   * Reads a window's rectangle back as [x, y, width, height].
   * @param {Window_Base} window The window to read.
   * @returns {number[]}
   */
  const rectOf = window => [ window.x, window.y, window.width, window.height ];

  /**
   * Reads an effects list's rows back as [name, value, value color] triples.
   * @param {Window_Command} window The list to read.
   * @returns {Array<[string, string, number]>}
   */
  const rowsOf = window => window.commandList()
    .map(command => [ command.name, command.rightText, command.rightColor ]);

  beforeAll(async () =>
  {
    await installDifficultySceneRealm();

    ({ default: Scene_Difficulty } = await import(
      '../../../../../../src/plugins/passive/ext/difficulty/scenes/Scene_Difficulty.js'));
  });

  beforeEach(() =>
  {
    // every test opens on Crimson in force and Saffron off, with nothing spent.
    globalThis.$gameSystem.getDifficultyConfigByKey('001_crimson').enabled = true;
    globalThis.$gameSystem.getDifficultyConfigByKey('002_saffron').enabled = false;
    globalThis.$gameSystem.setLayerPoints(0);
    globalThis.$gameTemp.refreshAppliedDifficulty();
  });

  //region init
  describe('initMembers()', () =>
  {
    it('starts with no windows', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Difficulty();

      // Assert
      expect(scene.getPointsWindow())
        .toBeNull();
      expect(scene.getDifficultyListWindow())
        .toBeNull();
      expect(scene.getActorEffectsWindow())
        .toBeNull();
      expect(scene.getEnemyEffectsWindow())
        .toBeNull();
    });

    it('reaches Scene_Base through the whole initMembers chain', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Difficulty();

      // Assert- undefined here means a class in the chain overrode initMembers without calling super.
      expect(scene._j._modalDimmerWindow)
        .toBeNull();
    });

    it('initializes once, from the engine\'s own constructor', () =>
    {
      // Arrange
      const initMembers = vi.spyOn(Scene_Difficulty.prototype, 'initMembers');

      // Act
      const scene = new Scene_Difficulty();

      // Assert
      expect(initMembers)
        .toHaveBeenCalledTimes(1);
      expect(initMembers.mock.contexts)
        .toContain(scene);

      initMembers.mockRestore();
    });
  });
  //endregion init

  //region create
  describe('create()', () =>
  {
    it('stacks the points over the list in the command column', () =>
    {
      // Arrange & Act
      const scene = buildScene();

      // Assert- the list starts where the points end and runs to the bottom of the region.
      expect(rectOf(scene.getPointsWindow()))
        .toEqual([ 0, 96, 422, 96 ]);
      expect(rectOf(scene.getDifficultyListWindow()))
        .toEqual([ 0, 192, 422, 828 ]);
    });

    it('splits the rest of the region between the two sides, the enemies taking the remainder', () =>
    {
      // Arrange & Act
      const scene = buildScene();

      // Assert
      expect(rectOf(scene.getActorEffectsWindow()))
        .toEqual([ 422, 96, 749, 924 ]);
      expect(rectOf(scene.getEnemyEffectsWindow()))
        .toEqual([ 1171, 96, 749, 924 ]);
    });

    it('gives the list the cursor, and neither effects list any', () =>
    {
      // Arrange & Act
      const scene = buildScene();

      // Assert
      expect(scene.getDifficultyListWindow().active)
        .toBe(true);
      expect(scene.getActorEffectsWindow().active)
        .toBe(false);
      expect(scene.getEnemyEffectsWindow().active)
        .toBe(false);
    });

    it('opens on the applied row, listing what every layer in force does', () =>
    {
      // Arrange & Act- only Crimson is on, handing both sides ATK x2.
      const scene = buildScene();

      // Assert- the same boost reads easier for the party and harder on the enemies.
      expect(rowsOf(scene.getActorEffectsWindow()))
        .toEqual([ [ 'Actor Effects', '', 0 ], [ 'Attack', '+100%', 24 ] ]);
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([ [ 'Enemy Effects', '', 0 ], [ 'Attack', '+100%', 25 ] ]);
    });

    it('describes the applied row in the help strip', () =>
    {
      // Arrange & Act
      const scene = buildScene();

      // Assert
      expect(scene.helpWindow()._text)
        .toBe('The combined effects of all enabled difficulties.');
    });
  });

  describe('controlLegendEntries()', () =>
  {
    it('teaches toggling a layer and going back', () =>
    {
      // Arrange
      const scene = new Scene_Difficulty();

      // Act
      const labels = scene.controlLegendEntries()
        .map(entry => entry.label);

      // Assert
      expect(labels)
        .toEqual([ 'toggle layer', 'back' ]);
    });
  });
  //endregion create

  //region hovering
  describe('onHoverChange()', () =>
  {
    it('lists a layer\'s own states when the cursor moves onto it', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act- moving the cursor fires the list's index hook, which is what the scene wired. Row 2 is Saffron.
      scene.getDifficultyListWindow()
        .select(2);

      // Assert- Saffron's party state cuts ATK (harder) and MCR (easier); its enemy state carries nothing.
      expect(rowsOf(scene.getActorEffectsWindow()))
        .toEqual([ [ 'Actor Effects', '', 0 ], [ 'Attack', '-50%', 25 ], [ 'Magi Cost', '-50%', 24 ] ]);
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([ [ 'Enemy Effects', '', 0 ], [ 'No effects.', '', 0 ] ]);
    });

    it('describes the highlighted layer in the help strip', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      scene.getDifficultyListWindow()
        .select(1);

      // Assert
      expect(scene.helpWindow()._text)
        .toBe('The crimson drive.');
    });
  });
  //endregion hovering

  //region toggling
  describe('onSelectDifficulty()', () =>
  {
    it('merges a layer turned on into the applied row', () =>
    {
      // Arrange
      const scene = buildScene();
      const list = scene.getDifficultyListWindow();
      list.select(2);

      // Act
      scene.onSelectDifficulty();
      list.select(0);

      // Assert- Crimson's ATK x2 and Saffron's ATK x0.5 net to one +50% row; the enemies keep Crimson's alone.
      expect(rowsOf(scene.getActorEffectsWindow()))
        .toEqual([ [ 'Actor Effects', '', 0 ], [ 'Attack', '+50%', 24 ], [ 'Magi Cost', '-50%', 24 ] ]);
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([ [ 'Enemy Effects', '', 0 ], [ 'Attack', '+100%', 25 ] ]);
    });

    it('spends the cost of a layer turned on', () =>
    {
      // Arrange
      const scene = buildScene();
      scene.getDifficultyListWindow()
        .select(2);

      // Act
      scene.onSelectDifficulty();

      // Assert
      expect(globalThis.$gameSystem.getLayerPoints())
        .toBe(2);
    });

    it('leaves the applied row with nothing to list once the last layer is off', () =>
    {
      // Arrange- Crimson is the only layer on.
      const scene = buildScene();
      const list = scene.getDifficultyListWindow();
      list.select(1);

      // Act
      scene.onSelectDifficulty();
      list.select(0);

      // Assert
      expect(rowsOf(scene.getActorEffectsWindow()))
        .toEqual([ [ 'Actor Effects', '', 0 ], [ 'No effects.', '', 0 ] ]);
    });

    it('hands the list back its input, which the confirm took away', () =>
    {
      // Arrange
      const scene = buildScene();
      const list = scene.getDifficultyListWindow();
      list.select(2);
      list.deactivate();

      // Act
      scene.onSelectDifficulty();

      // Assert
      expect(list.active)
        .toBe(true);
    });
  });
  //endregion toggling

  //region locked layers
  describe('a locked layer', () =>
  {
    afterEach(() =>
    {
      // every other test sees Saffron unlocked, the way the realm sets it up.
      globalThis.$gameSystem.getDifficultyConfigByKey('002_saffron').unlocked = true;
    });

    it('stays in the list behind a padlock, where it cannot be chosen', () =>
    {
      // Arrange- Saffron locked beside Crimson unlocked, so a list padlocking or dropping every row cannot pass.
      globalThis.$gameSystem.getDifficultyConfigByKey('002_saffron').unlocked = false;

      // Act
      const scene = buildScene();

      // Assert- rows 1 and 2 are Crimson and Saffron, beneath the applied row.
      const list = scene.getDifficultyListWindow();
      const rowAt = index => [ list.commandName(index), list.isCommandEnabled(index) ];
      expect([ rowAt(1), rowAt(2) ])
        .toEqual([ [ '\\I[0]Crimson', true ], [ '\\I[2530]\\I[0]Saffron', false ] ]);
    });
  });
  //endregion locked layers

  //region tag lines
  describe('tag lines', () =>
  {
    afterEach(() =>
    {
      // the registry is J-Base's static state, so a describer registered here must not outlive its test.
      globalThis.NotetagDescriber.describers()
        .delete(SCENE_DRIVE_TAG);
    });

    it('lists a described tag after the traits, toned by which way it cuts for its holder', () =>
    {
      // Arrange- Crimson's enemy state carries the tag; described as helping its holder, it reads harder.
      globalThis.NotetagDescriber.register(SCENE_DRIVE_TAG, ([ , amount ]) => [
        new globalThis.NotetagLine({
          text: 'Drive tag',
          value: `+${amount}`,
          holderImpact: globalThis.NotetagLine.Impacts.HELPS,
        }),
      ]);

      // Act
      const scene = buildScene();

      // Assert
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([ [ 'Enemy Effects', '', 0 ], [ 'Attack', '+100%', 25 ], [ 'Drive tag', '+5', 25 ] ]);
    });

    it('writes a described sentence with its value colored where it stands, toned from the player\'s side', () =>
    {
      // Arrange- the same tag written as a sentence; helping its holder on the enemies' side reads harder.
      globalThis.NotetagDescriber.register(SCENE_DRIVE_TAG, ([ , amount ]) => [
        new globalThis.NotetagLine({
          text: `Enemies gain ${globalThis.NotetagLine.ValueToken} drive.`,
          value: `+${amount}`,
          holderImpact: globalThis.NotetagLine.Impacts.HELPS,
        }),
      ]);

      // Act
      const scene = buildScene();

      // Assert
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([
          [ 'Enemy Effects', '', 0 ],
          [ 'Attack', '+100%', 25 ],
          [ 'Enemies gain \\C[25]\\*+5\\*\\C[0] drive.', '', 0 ],
        ]);
    });

    it('lists nothing for a tag nobody has described yet', () =>
    {
      // Arrange- the same state carries the same tag, and nothing is registered for it.
      // Act
      const scene = buildScene();

      // Assert
      expect(rowsOf(scene.getEnemyEffectsWindow()))
        .toEqual([ [ 'Enemy Effects', '', 0 ], [ 'Attack', '+100%', 25 ] ]);
    });
  });
  //endregion tag lines
});
//endregion plugins/passive/ext/difficulty/scenes/scene-difficulty.test.js
