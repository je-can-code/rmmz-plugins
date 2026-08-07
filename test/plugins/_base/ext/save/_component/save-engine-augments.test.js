//region plugins/_base/ext/save/_component/save-engine-augments.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';
import { installFakeSaveFilesystem } from '../fixtures/install-fake-save-filesystem.js';

/**
 * The five places J-Base-Save reaches into the engine and changes where saving goes.
 *
 * These are alias patches on engine prototypes rather than classes of their own, so there is no unit
 * of them to test in isolation - the patch only exists once the ship has been loaded over a real
 * engine. That is the whole reason they sit together in one component test: what is being checked is
 * that loading the ship actually rewires the four entry points it claims to, and a stubbed engine
 * would have nothing to rewire.
 */
describe('J-Base-Save engine augments', () =>
{
  let Scene_Files;
  let SaveFileEntryMode;
  let ProfileManager;
  let engineStorageManager;

  /**
   * Swaps in an empty disk without taking the rest of `StorageManager` away with it.
   *
   * The fake covers the `fs*` surface and nothing else, but the engine's own boot sequence still runs
   * through here - `ConfigManager.load` reaches for `loadObject` on the way past. Chaining the fake in
   * front of the real manager rather than replacing it is what leaves those reachable.
   */
  const installChainedFakeFilesystem = () =>
  {
    const fake = installFakeSaveFilesystem();

    Object.setPrototypeOf(globalThis.StorageManager, engineStorageManager);

    // the engine's own document reads bottom out in `localforage`, which is a browser library and is
    // not here. Answering at the storage boundary leaves every engine layer above it running for real.
    globalThis.StorageManager.loadObject = () => Promise.resolve({});

    return fake;
  };

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    engineStorageManager = globalThis.StorageManager;

    // an empty disk before anything reads one, because the profile document is read during boot.
    installChainedFakeFilesystem();

    // J-Base owns `Scene_MenuFacetBase`, `WindowCommandBuilder` and `MenuSection`, all three of which
    // the patches below are built on. Loading the shipped bundle is how a J-Base global reaches a
    // test, since a plugin source file may never import across a ship boundary.
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

    ({ default: ProfileManager } = await import(
      '../../../../../../src/plugins/_base/ext/save/managers/ProfileManager.js'));
    ({ default: SaveFileEntryMode } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileEntryMode.js'));
    ({ default: Scene_Files } = await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Files.js'));

    // the four patches themselves, imported for the side effect of being applied. Importing the source
    // rather than running the bundle is deliberate: a bundle loaded through `vm` is invisible to the
    // coverage mapper, so a test driven that way proves the behavior and reports nothing.
    await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Boot.js');
    await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Map.js');
    await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Title.js');
    await import('../../../../../../src/plugins/_base/ext/save/scenes/Scene_Menu.js');
    await import('../../../../../../src/plugins/_base/ext/save/windows/Window_MenuCommand.js');
  });

  beforeEach(() =>
  {
    installChainedFakeFilesystem();

    // `SceneManager.push` reads the outgoing scene's constructor to remember where to come back to.
    globalThis.SceneManager._scene = new Scene_Base();
    globalThis.SceneManager._nextScene = null;
    globalThis.SceneManager._stack = [];
  });

  //region the boot sequence waits on the third document
  describe('Scene_Boot.loadPlayerData()', () =>
  {
    it('reads the profile document alongside the engine\'s own two', () =>
    {
      // Arrange
      const scene = new Scene_Boot();
      const load = vi.spyOn(ProfileManager, 'load');

      // Act
      scene.loadPlayerData();

      // Assert: installation and slot are the engine's scopes; this one is the ship's, and nothing
      // else in the boot sequence would ever ask for it.
      expect(load)
        .toHaveBeenCalled();

      load.mockRestore();
    });
  });

  describe('Scene_Boot.isPlayerDataLoaded()', () =>
  {
    it('holds the boot sequence while the profile document is still arriving', () =>
    {
      // Arrange
      const scene = new Scene_Boot();
      const isLoaded = vi.spyOn(ProfileManager, 'isLoaded')
        .mockReturnValue(false);

      // Act
      const loaded = scene.isPlayerDataLoaded();

      // Assert
      expect(loaded)
        .toBe(false);

      isLoaded.mockRestore();
    });

    it('lets the boot sequence proceed once the profile document has arrived', () =>
    {
      // Arrange
      const scene = new Scene_Boot();
      scene.loadPlayerData();
      const isLoaded = vi.spyOn(ProfileManager, 'isLoaded')
        .mockReturnValue(true);

      // Act
      const loaded = scene.isPlayerDataLoaded();

      // Assert
      expect(loaded)
        .toBe(true);

      isLoaded.mockRestore();
    });
  });
  //endregion the boot sequence waits on the third document

  //region the map still fades in after a load
  describe('Scene_Map.needsFadeIn()', () =>
  {
    it('fades in when the map was reached by loading from the files scene', () =>
    {
      // Arrange: `isPreviousScene` compares constructor identity outright, so the files scene has to
      // name itself here - inheriting from `Scene_Load` would not have satisfied it either.
      const scene = new Scene_Map();
      globalThis.SceneManager._previousClass = Scene_Files;

      // Act
      const needsFadeIn = scene.needsFadeIn();

      // Assert
      expect(needsFadeIn)
        .toBe(true);
    });

    it('leaves the engine\'s own answer alone when the map was reached from anywhere else', () =>
    {
      // Arrange
      const scene = new Scene_Map();
      globalThis.SceneManager._previousClass = Scene_Menu;

      // Act
      const needsFadeIn = scene.needsFadeIn();

      // Assert
      expect(needsFadeIn)
        .toBe(false);
    });
  });
  //endregion the map still fades in after a load

  //region the three doors into the files scene
  describe('Scene_Title.commandContinue()', () =>
  {
    it('opens the files scene knowing it came from the title', () =>
    {
      // Arrange
      const scene = new Scene_Title();
      const close = vi.fn();
      scene.commandWindow = () => ({ close });

      // Act
      scene.commandContinue();

      // Assert: arriving with the title's origin is what drops Rewind and Save and adds Delete.
      expect(globalThis.SceneManager._nextScene)
        .toBeInstanceOf(Scene_Files);
      expect(globalThis.SceneManager._nextScene.entryMode())
        .toBe(SaveFileEntryMode.Title);
    });

    it('closes the title\'s own command window on the way out', () =>
    {
      // Arrange
      const scene = new Scene_Title();
      const close = vi.fn();
      scene.commandWindow = () => ({ close });

      // Act
      scene.commandContinue();

      // Assert
      expect(close)
        .toHaveBeenCalled();
    });
  });

  describe('Scene_Menu.commandSave()', () =>
  {
    it('opens the files scene knowing it came from the menu, which is what withholds saving', () =>
    {
      // Arrange
      const scene = new Scene_Menu();

      // Act
      scene.commandSave();

      // Assert
      expect(globalThis.SceneManager._nextScene.entryMode())
        .toBe(SaveFileEntryMode.Menu);
    });
  });

  describe('Scene_Files.callFromSavePoint()', () =>
  {
    it('opens the files scene knowing it came from a platform, which is the only origin that saves', () =>
    {
      // Arrange
      // Act
      Scene_Files.callFromSavePoint();

      // Assert
      expect(globalThis.SceneManager._nextScene.entryMode())
        .toBe(SaveFileEntryMode.Platform);
    });
  });
  //endregion the three doors into the files scene

  //region the menu command that is no longer a save command
  describe('Window_MenuCommand.addSaveCommand()', () =>
  {
    /**
     * Finds the files row among whatever else the menu is offering.
     * @param {Window_MenuCommand} window The menu to read.
     * @returns {object} The built command.
     */
    const filesCommandOf = window => window._list.find(command => command.symbol === 'save');

    it('offers the files scene under a name that describes what it now does', () =>
    {
      // Arrange
      const window = new Window_MenuCommand(new Rectangle(0, 0, 400, 400));

      // Act
      const files = filesCommandOf(window);

      // Assert: the symbol stays `save` because every consumer of it is a handler registration
      // somewhere else, but nothing the player sees says save anymore.
      expect(files.name)
        .toBe('Files');
    });

    it('offers it ungated, so a game that switched saving off keeps its Load and Rewind', () =>
    {
      // Arrange: an event turning saving off is ordinary in a game built around save platforms, and
      // vanilla's gate would take Load and Rewind away as collateral damage.
      globalThis.$gameSystem.disableSave();
      const window = new Window_MenuCommand(new Rectangle(0, 0, 400, 400));

      // Act
      const files = filesCommandOf(window);

      // Assert
      expect(files)
        .not.toBeUndefined();
      expect(files.enabled)
        .toBe(true);

      globalThis.$gameSystem.enableSave();
    });
  });
  //endregion the menu command that is no longer a save command
});
//endregion plugins/_base/ext/save/_component/save-engine-augments.test.js