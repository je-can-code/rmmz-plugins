//region plugins/_base/ext/save/scenes/scene-files.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';
import { installFakeSaveFilesystem } from '../fixtures/install-fake-save-filesystem.js';

/**
 * One scene for saving, loading, deleting and rewinding, against the real engine.
 *
 * Almost everything worth guarding in this scene is a seam. Which window holds the cursor after a
 * handler runs, whether the confirmation opens on the safe answer, whether a failed command leaves
 * the player somewhere they can try again - none of those is logic that could be extracted to a
 * service, because all of them are statements about two real objects and the engine between them.
 */
describe('Scene_Files', () =>
{
  let Scene_Files;
  let SaveFileEntryMode;
  let SaveFileModeLoad;
  let SaveFileModeSave;
  let SaveFileModeDelete;
  let SaveFileEntry;
  let SaveThumbnail;
  let engineStorageManager;

  /**
   * Swaps in an empty disk without taking the rest of `StorageManager` away with it.
   *
   * The fake covers the `fs*` surface and nothing else, while the engine layers above it still run
   * for real. Chaining it in front rather than replacing outright is what leaves those reachable.
   */
  const installChainedFakeFilesystem = () =>
  {
    const fake = installFakeSaveFilesystem();

    Object.setPrototypeOf(globalThis.StorageManager, engineStorageManager);

    globalThis.StorageManager.loadObject = () => Promise.resolve({});

    return fake;
  };

  /**
   * Builds the scene the way an entry point does, already told where it was opened from.
   * @param {string=} entryMode The origin to arrive with; defaults to a save platform.
   * @returns {Scene_Files} The prepared, created scene.
   */
  const buildScene = (entryMode = SaveFileEntryMode.Platform) =>
  {
    const scene = new Scene_Files();
    scene.prepare(entryMode);
    scene.create();

    return scene;
  };

  /**
   * Builds the row a mode would be handed for a slot holding something.
   * @param {number} savefileId The slot's id.
   * @returns {SaveFileEntry} The filled row.
   */
  const filledEntry = savefileId => new SaveFileEntry(
    savefileId,
    `file${savefileId}`,
    String.empty,
    'gen-0001',
    { display: { mapName: 'The Kitchen' } });

  /**
   * Points the scene's list at a mode holding one filled row, with the cursor on it.
   * @param {Scene_Files} scene The scene to arrange.
   * @param {SaveFileMode} mode The mode to drive the list with.
   */
  const chooseModeAndRow = (scene, mode) =>
  {
    scene.onModeChosen(mode);
    scene.listWindow()
      .setEntries([ filledEntry(1) ]);
    scene.listWindow()
      .refresh();
    scene.listWindow()
      .select(0);
  };

  /**
   * Lets the promise chain inside {@link Scene_Files.executeCurrentMode} settle.
   * @returns {Promise<void>} Resolves once every queued microtask has run.
   */
  const settle = () => new Promise(resolve =>
  {
    setTimeout(resolve, 0);
  });

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    engineStorageManager = globalThis.StorageManager;
    installChainedFakeFilesystem();

    // J-Base owns `Scene_MenuFacetBase` and `WindowCommandBuilder`, which this scene and all three of
    // its windows are built on. Loading the shipped bundle is how a J-Base global reaches a test,
    // since a plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    // what `_metadata/initialization.js` establishes for this ship, declared here instead: that file
    // reads the `__PLUGIN_NAME__` build-time define, which only exists inside a bundle.
    J.BASE.EXT.SAVE = {
      Metadata: { retainedSaveGenerations: 3 },
      Aliased: {
        Scene_Boot: new Map(),
        Scene_Map: new Map(),
      },
    };

    ({ default: SaveFileEntry } = await import('../../../../../../src/plugins/_base/ext/save/core/SaveFileEntry.js'));
    ({ default: SaveThumbnail } = await import('../../../../../../src/plugins/_base/ext/save/core/SaveThumbnail.js'));
    ({ default: SaveFileEntryMode } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileEntryMode.js'));
    ({ default: SaveFileModeLoad } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileModeLoad.js'));
    ({ default: SaveFileModeSave } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileModeSave.js'));
    ({ default: SaveFileModeDelete } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileModeDelete.js'));
    ({ default: Scene_Files } = await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Files.js'));
  });

  beforeEach(() =>
  {
    installChainedFakeFilesystem();

    globalThis.DataManager.maxSavefiles = () => 2;

    globalThis.SceneManager._scene = new Scene_Base();
    globalThis.SceneManager._nextScene = null;
    globalThis.SceneManager._stack = [];
  });

  //region what the scene starts as
  describe('initMembers()', () =>
  {
    it('defaults to the title as its origin, which is the most restrictive of the three', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Files();

      // Assert
      expect(scene.entryMode())
        .toBe(SaveFileEntryMode.Title);
    });

    it('seeds the three window trackers empty, since nothing is built until create', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Files();

      // Assert
      expect(scene.commandWindow())
        .toBeNull();
      expect(scene.listWindow())
        .toBeNull();
      expect(scene.confirmWindow())
        .toBeNull();
    });

    it('starts with no load having succeeded, which is what terminate reads', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Files();

      // Assert
      expect(scene.hasLoadSucceeded())
        .toBe(false);
    });

    it('reaches Scene_Base through the whole initMembers chain', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Files();

      // Assert: undefined here means a class in the chain overrode initMembers without calling super,
      // and every modal in this scene would throw the first time it opened.
      expect(scene._j._modalDimmerWindow)
        .toBeNull();
    });
  });

  describe('prepare()', () =>
  {
    it('receives where the scene was opened from', () =>
    {
      // Arrange
      const scene = new Scene_Files();

      // Act
      scene.prepare(SaveFileEntryMode.Menu);

      // Assert
      expect(scene.entryMode())
        .toBe(SaveFileEntryMode.Menu);
    });
  });
  //endregion what the scene starts as

  //region the windows it builds
  describe('create()', () =>
  {
    it('builds all three of its own windows and adds them to the scene', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert
      [ scene.commandWindow(), scene.listWindow(), scene.confirmWindow() ].forEach(window =>
      {
        expect(scene._windowLayer.children)
          .toContain(window);
      });
    });
  });

  describe('createFilesCommandWindow()', () =>
  {
    it('builds its commands from the origin the scene arrived with', () =>
    {
      // Arrange
      // Act: the menu withholds saving, because saving is the platform's job.
      const scene = buildScene(SaveFileEntryMode.Menu);

      // Assert
      const symbols = scene.commandWindow()._list.map(command => command.symbol);
      expect(symbols)
        .not.toContain('save');
      expect(symbols)
        .toContain('load');
    });

    it('starts with row zero selected, so the help strip describes something from the outset', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert: `Window_Command.initialize` already selected a list that did not exist yet, and a
      // refresh does not describe the selection again.
      expect(scene.commandWindow()
        .index())
        .toBe(0);
    });

    it('wires one handler per mode, so a command the origin withholds simply never fires', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      const modeKeys = scene.commandWindow()
        .modes()
        .map(mode => mode.key());

      // Assert
      modeKeys.forEach(key =>
      {
        expect(scene.commandWindow()
          .isHandled(key))
          .toBe(true);
      });
    });

    it('describes its highlighted command into the shared help window', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert
      expect(scene.commandWindow()._helpWindow)
        .toBe(scene.helpWindow());
    });
  });

  describe('createFilesListWindow()', () =>
  {
    it('leaves the list visible but unfocused until a command is chosen', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert
      expect(scene.listWindow().active)
        .toBe(false);
      expect(scene.listWindow()
        .index())
        .toBe(-1);
    });

    it('tells the capture how large a picture this list will actually draw', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert: the window is the only thing that knows, since the size falls out of the screen, the
      // help window and the control legend - working that chain out twice would be a copy that drifts.
      expect(SaveThumbnail.requestedHeight())
        .toBe(scene.listWindow()
          .thumbnailHeight());
    });
  });

  describe('createFilesConfirmWindow()', () =>
  {
    it('keeps the prompt out of the way until there is something to ask', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert
      expect(scene.confirmWindow().visible)
        .toBe(false);
      expect(scene.confirmWindow().active)
        .toBe(false);
    });
  });
  //endregion the windows it builds

  //region layout
  describe('filesCommandWindowRect()', () =>
  {
    it('gives the command column the full height of the facet area', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      const rectangle = scene.filesCommandWindowRect();

      // Assert
      expect(rectangle.height)
        .toBe(scene.facetAreaRect().height);
    });
  });

  describe('filesListWindowRect()', () =>
  {
    it('claims everything the command column does not', () =>
    {
      // Arrange
      const scene = buildScene();
      const facetArea = scene.facetAreaRect();

      // Act
      const rectangle = scene.filesListWindowRect();

      // Assert
      expect(rectangle.x + rectangle.width)
        .toBe(facetArea.x + facetArea.width);
    });
  });

  describe('filesConfirmWindowRect()', () =>
  {
    it('centres the prompt over the list, so the row being asked about stays beside the question', () =>
    {
      // Arrange
      const scene = buildScene();
      const listArea = scene.filesListWindowRect();

      // Act
      const rectangle = scene.filesConfirmWindowRect();

      // Assert
      const listCenterX = listArea.x + Math.floor(listArea.width / 2);
      const promptCenterX = rectangle.x + Math.floor(rectangle.width / 2);
      expect(Math.abs(promptCenterX - listCenterX))
        .toBeLessThanOrEqual(1);
    });

    it('takes half the list\'s width', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      const rectangle = scene.filesConfirmWindowRect();

      // Assert
      expect(rectangle.width)
        .toBe(Math.floor(scene.filesListWindowRect().width * scene.confirmWidthRatio()));
    });
  });

  describe('confirmLineCount()', () =>
  {
    it('is tall enough for the question and the two answers below it', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      const lines = scene.confirmLineCount();

      // Assert
      expect(lines)
        .toBe(scene.confirmWindow()
          .promptLineCount() + 2);
    });
  });
  //endregion layout

  //region moving between the two columns
  describe('onModeChosen()', () =>
  {
    it('points the list at the chosen mode\'s rows', () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeLoad();

      // Act
      scene.onModeChosen(mode);

      // Assert
      expect(scene.currentMode())
        .toBe(mode);
    });

    it('hands the cursor to the list and stands the command column down', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      scene.onModeChosen(new SaveFileModeLoad());

      // Assert: exactly one window may hold focus, or the scene reads every input twice.
      expect(scene.commandWindow().active)
        .toBe(false);
      expect(scene.listWindow().active)
        .toBe(true);
      expect(scene.listWindow()
        .index())
        .toBe(0);
    });
  });

  describe('onListCancelled()', () =>
  {
    it('returns focus to the commands and leaves the list holding nothing', () =>
    {
      // Arrange
      const scene = buildScene();
      scene.onModeChosen(new SaveFileModeLoad());

      // Act
      scene.onListCancelled();

      // Assert
      expect(scene.listWindow().active)
        .toBe(false);
      expect(scene.listWindow()
        .index())
        .toBe(-1);
      expect(scene.commandWindow().active)
        .toBe(true);
    });
  });
  //endregion moving between the two columns

  //region asking before acting
  describe('onEntryChosen()', () =>
  {
    it('asks first for anything the mode considers worth a question', () =>
    {
      // Arrange
      const scene = buildScene(SaveFileEntryMode.Platform);
      chooseModeAndRow(scene, new SaveFileModeLoad());

      // Act
      scene.onEntryChosen();

      // Assert
      expect(scene.confirmWindow().visible)
        .toBe(true);
    });

    it('acts immediately where confirming would ask the player to agree to what they just asked', () =>
    {
      // Arrange: loading from the title screen is the one case with no game in memory to cost.
      const scene = buildScene(SaveFileEntryMode.Title);
      const mode = new SaveFileModeLoad();
      chooseModeAndRow(scene, mode);
      const execute = vi.spyOn(mode, 'execute')
        .mockReturnValue(new Promise(() => {}));

      // Act
      scene.onEntryChosen();

      // Assert
      expect(scene.confirmWindow().visible)
        .toBe(false);
      expect(execute)
        .toHaveBeenCalled();

      execute.mockRestore();
    });
  });

  describe('openConfirmation()', () =>
  {
    it('raises the prompt over the list and takes the list\'s focus away', () =>
    {
      // Arrange
      const scene = buildScene();
      chooseModeAndRow(scene, new SaveFileModeLoad());

      // Act
      scene.openConfirmation();

      // Assert
      expect(scene.confirmWindow().active)
        .toBe(true);
      expect(scene.listWindow().active)
        .toBe(false);
    });

    it('asks about the row the cursor is actually on', () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeLoad();
      chooseModeAndRow(scene, mode);

      // Act
      scene.openConfirmation();

      // Assert
      expect(scene.confirmWindow()
        .prompt())
        .toBe(mode.confirmText(filledEntry(1)));
    });

    it('opens on yes for everything that can be undone', () =>
    {
      // Arrange
      const scene = buildScene();
      chooseModeAndRow(scene, new SaveFileModeLoad());

      // Act
      scene.openConfirmation();

      // Assert
      expect(scene.confirmWindow()
        .index())
        .toBe(0);
    });

    it('opens on no for the one command that cannot', () =>
    {
      // Arrange
      const scene = buildScene(SaveFileEntryMode.Title);
      chooseModeAndRow(scene, new SaveFileModeDelete());

      // Act
      scene.openConfirmation();

      // Assert: starting on the safe answer anywhere else would add a keypress to the thing the
      // player just asked for.
      expect(scene.confirmWindow()
        .index())
        .toBe(1);
    });
  });

  describe('onDenied()', () =>
  {
    it('puts the prompt away and gives the list back its focus', () =>
    {
      // Arrange
      const scene = buildScene();
      chooseModeAndRow(scene, new SaveFileModeLoad());
      scene.openConfirmation();

      // Act
      scene.onDenied();

      // Assert
      expect(scene.confirmWindow().visible)
        .toBe(false);
      expect(scene.listWindow().active)
        .toBe(true);
    });
  });

  describe('onConfirmed()', () =>
  {
    it('puts the prompt away and runs the command', () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeLoad();
      chooseModeAndRow(scene, mode);
      scene.openConfirmation();
      const execute = vi.spyOn(mode, 'execute')
        .mockReturnValue(new Promise(() => {}));

      // Act
      scene.onConfirmed();

      // Assert
      expect(scene.confirmWindow().visible)
        .toBe(false);
      expect(execute)
        .toHaveBeenCalledWith(expect.anything());

      execute.mockRestore();
    });
  });
  //endregion asking before acting

  //region running the command
  describe('executeCurrentMode()', () =>
  {
    it('hands the highlighted row to the mode', () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeSave();
      chooseModeAndRow(scene, mode);
      const execute = vi.spyOn(mode, 'execute')
        .mockReturnValue(new Promise(() => {}));

      // Act
      scene.executeCurrentMode();

      // Assert
      expect(execute.mock.calls[0][0].savefileId())
        .toBe(1);

      execute.mockRestore();
    });
  });

  describe('onExecuteSuccess()', () =>
  {
    it('leaves the player in the scene after a command that does not resume the game', async () =>
    {
      // Arrange: vanilla pops the scene after a save; this deliberately does not, because the player
      // is standing on a save platform and anything else they wanted here would cost them a walk back.
      const scene = buildScene();
      const mode = new SaveFileModeSave();
      chooseModeAndRow(scene, mode);
      vi.spyOn(mode, 'execute')
        .mockResolvedValue(0);
      vi.spyOn(mode, 'playSuccessSound')
        .mockImplementation(() => {});

      // Act
      scene.executeCurrentMode();
      await settle();

      // Assert
      expect(scene.commandWindow().active)
        .toBe(true);
      expect(scene.listWindow().active)
        .toBe(false);
      expect(scene.listWindow()
        .index())
        .toBe(-1);

      vi.restoreAllMocks();
    });

    it('goes to the map after a command that does resume the game', async () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeLoad();
      chooseModeAndRow(scene, mode);
      vi.spyOn(mode, 'execute')
        .mockResolvedValue(0);
      vi.spyOn(mode, 'playSuccessSound')
        .mockImplementation(() => {});
      vi.spyOn(scene, 'fadeOutAll')
        .mockImplementation(() => {});

      // Act
      scene.executeCurrentMode();
      await settle();

      // Assert
      expect(globalThis.SceneManager._nextScene)
        .toBeInstanceOf(Scene_Map);
      expect(scene.hasLoadSucceeded())
        .toBe(true);

      vi.restoreAllMocks();
    });
  });

  describe('onExecuteFailure()', () =>
  {
    it('leaves the player on the list to try something else', async () =>
    {
      // Arrange
      const scene = buildScene();
      const mode = new SaveFileModeSave();
      chooseModeAndRow(scene, mode);
      vi.spyOn(mode, 'execute')
        .mockRejectedValue(new Error('the disk is full'));
      const buzzer = vi.spyOn(SoundManager, 'playBuzzer')
        .mockImplementation(() => {});
      const logged = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      scene.executeCurrentMode();
      await settle();

      // Assert
      expect(buzzer)
        .toHaveBeenCalled();
      expect(scene.listWindow().active)
        .toBe(true);

      logged.mockRestore();
      vi.restoreAllMocks();
    });
  });
  //endregion running the command

  //region what a load owes the game it just started
  describe('reloadMapIfUpdated()', () =>
  {
    it('rebuilds the map when the game\'s data has moved on since the save', () =>
    {
      // Arrange
      const scene = buildScene();
      vi.spyOn(globalThis.$gameSystem, 'versionId')
        .mockReturnValue(globalThis.$dataSystem.versionId + 1);
      const reserveTransfer = vi.spyOn(globalThis.$gamePlayer, 'reserveTransfer');
      const requestMapReload = vi.spyOn(globalThis.$gamePlayer, 'requestMapReload');

      // Act
      scene.reloadMapIfUpdated();

      // Assert
      expect(reserveTransfer)
        .toHaveBeenCalled();
      expect(requestMapReload)
        .toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('leaves the map alone when the save matches the data it was written against', () =>
    {
      // Arrange
      const scene = buildScene();
      vi.spyOn(globalThis.$gameSystem, 'versionId')
        .mockReturnValue(globalThis.$dataSystem.versionId);
      const requestMapReload = vi.spyOn(globalThis.$gamePlayer, 'requestMapReload');

      // Act
      scene.reloadMapIfUpdated();

      // Assert
      expect(requestMapReload)
        .not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('terminate()', () =>
  {
    it('gives a freshly loaded game the after-load pass a great deal of plugin state re-applies in', () =>
    {
      // Arrange
      const scene = buildScene();
      scene.flagLoadSucceeded();
      const onAfterLoad = vi.spyOn(globalThis.$gameSystem, 'onAfterLoad')
        .mockImplementation(() => {});

      // Act
      scene.terminate();

      // Assert: this scene does not inherit from `Scene_Load`, so without this the state that
      // re-seeds itself in `onAfterLoad` simply never would - silently, and only after a load.
      expect(onAfterLoad)
        .toHaveBeenCalled();

      onAfterLoad.mockRestore();
    });

    it('owes the game nothing when the player only saved or deleted', () =>
    {
      // Arrange
      const scene = buildScene();
      const onAfterLoad = vi.spyOn(globalThis.$gameSystem, 'onAfterLoad')
        .mockImplementation(() => {});

      // Act
      scene.terminate();

      // Assert
      expect(onAfterLoad)
        .not.toHaveBeenCalled();

      onAfterLoad.mockRestore();
    });
  });
  //endregion what a load owes the game it just started

  //region the legend
  describe('controlLegendEntries()', () =>
  {
    it('names only semantics something in this scene actually binds', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      const semantics = scene.controlLegendEntries()
        .map(entry => entry.semantic);

      // Assert: a legend advertising a control nothing handles is a feature that does not exist.
      expect(semantics)
        .toEqual([ 'ok', 'cancel' ]);
      expect(scene.commandWindow()
        .isHandled('cancel'))
        .toBe(true);
    });
  });
  //endregion the legend
});
//endregion plugins/_base/ext/save/scenes/scene-files.test.js