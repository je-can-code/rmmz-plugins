//region plugins/_base/ext/save/save-data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

describe('DataManager savefile summary and generation loading (direct src import)', () =>
{
  let SaveFileSystem;
  let SaveManifest;
  let fake;

  /**
   * The engine global this module augments, in the shape the engine leaves it in.
   *
   * `makeSavefileInfo` returns vanilla's five fields, because the whole point of the extension is that
   * it adds to them without disturbing what `Window_SavefileList` reads by name.
   */
  const installEngineDataManager = () =>
  {
    globalThis.DataManager = {
      _globalInfo: [],

      /**
       * Vanilla's savefile summary: the five fields the stock load menu draws.
       * @returns {object} The savefile info.
       */
      makeSavefileInfo()
      {
        return {
          title: 'Chef Adventure',
          characters: [],
          faces: [],
          playtime: '00:10:00',
          timestamp: 1000,
        };
      },

      /**
       * Vanilla's slot-name builder.
       * @param {number} savefileId The slot number.
       * @returns {string} The save name.
       */
      makeSavename(savefileId)
      {
        return `file${savefileId}`;
      },

      /**
       * Stands in for the engine allocating a fresh object graph.
       */
      createGameObjects()
      {
        this.createdGameObjects = true;
      },

      /**
       * Stands in for the engine pushing decoded contents into that graph.
       * @param {object} contents The decoded save contents.
       */
      extractSaveContents(contents)
      {
        this.extractedContents = contents;
      },

      /**
       * Stands in for the engine's post-load repair pass.
       */
      correctDataErrors()
      {
        this.correctedDataErrors = true;
      },
    };
  };

  /**
   * The party the summary is built from: a leader, a roster, and some gold.
   */
  const installGameGlobals = () =>
  {
    const member = actorId => ({
      name: () => `actor-${actorId}`,
      level: 12,
      actorId: () => actorId,
    });

    globalThis.$gameParty = {
      leader: () => member(1),
      gold: () => 4200,
      allMembers: () => [ member(1), member(2) ],
    };

    globalThis.$gameMap = {
      displayName: () => 'Rocky Beach',
      mapId: () => 7,
    };

    globalThis.$dataMapInfos = [ null, null, null, null, null, null, null, { name: 'MAP007' } ];
  };

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = {
      BASE: {
        EXT: {
          SAVE: {
            Metadata: { retainedSaveGenerations: 3 },
            Aliased: { DataManager: new Map() },
          },
        },
      },
    };

    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveFileSystem } = await import(
      '../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveManifest } = await import('../../../../../src/plugins/_base/ext/save/core/SaveManifest.js'));

    // the augment binds to whichever engine global is standing there at import, and it captures the
    // original method into the alias map as it goes- so both have to be in place before this import,
    // and it has to happen exactly once. Re-importing under `vi.resetModules` would build a second
    // `SaveFileSystem` for the module to close over, leaving every spy below aimed at the wrong copy.
    installEngineDataManager();

    await import('../../../../../src/plugins/_base/ext/save/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    fake = installFakeSaveFilesystem();

    installGameGlobals();

    // the derived index is the one piece of state that carries between tests.
    DataManager._globalInfo = [];
  });

  //region the savefile summary
  describe('makeSavefileInfo()', () =>
  {
    it('keeps the five vanilla fields the stock load menu reads by name', () =>
    {
      // Arrange
      // Act
      const info = DataManager.makeSavefileInfo();

      // Assert
      expect(info.title).toBe('Chef Adventure');
      expect(info.playtime).toBe('00:10:00');
      expect(info.timestamp).toBe(1000);
    });

    it('adds the leader, level, gold and map so a menu never has to open a world', () =>
    {
      // Arrange
      // Act
      const info = DataManager.makeSavefileInfo();

      // Assert
      expect(info.leaderName).toBe('actor-1');
      expect(info.level).toBe(12);
      expect(info.gold).toBe(4200);
      expect(info.mapName).toBe('Rocky Beach');
    });

    it('writes the roster as actor ids rather than as members', () =>
    {
      // Arrange
      // Act
      const info = DataManager.makeSavefileInfo();

      // Assert
      expect(info.party).toEqual([ 1, 2 ]);
    });
  });

  describe('savefileMapName()', () =>
  {
    it('prefers the display name, which is the name the player has actually seen', () =>
    {
      // Arrange
      // Act
      const name = DataManager.savefileMapName();

      // Assert
      expect(name).toBe('Rocky Beach');
    });

    it('falls back to the editor name for the many maps with no display name set', () =>
    {
      // Arrange
      globalThis.$gameMap.displayName = () => '';

      // Act
      const name = DataManager.savefileMapName();

      // Assert
      expect(name).toBe('MAP007');
    });
  });
  //endregion the savefile summary

  //region the slot range
  describe('maxSavefiles()', () =>
  {
    it('agrees with the range loadGlobalInfo walks, which is the whole reason the knob exists', () =>
    {
      // Arrange
      const readManifest = vi.spyOn(SaveFileSystem, 'readManifest')
        .mockReturnValue(null);

      // Act
      DataManager.loadGlobalInfo();

      // Assert
      expect(readManifest).toHaveBeenCalledTimes(DataManager.maxSavefiles());

      readManifest.mockRestore();
    });

    it('starts at slot one, leaving index zero empty as vanilla does', () =>
    {
      // Arrange
      const readManifest = vi.spyOn(SaveFileSystem, 'readManifest')
        .mockReturnValue(null);

      // Act
      DataManager.loadGlobalInfo();

      // Assert
      expect(readManifest).toHaveBeenCalledWith('file1');
      expect(readManifest).not.toHaveBeenCalledWith('file0');

      readManifest.mockRestore();
    });
  });
  //endregion the slot range

  //region the derived index
  describe('loadGlobalInfo()', () =>
  {
    it('builds the index out of each slot manifest, so it cannot disagree with what it indexes', () =>
    {
      // Arrange
      const display = { title: 'Chef Adventure', leaderName: 'actor-1' };
      const readManifest = vi.spyOn(SaveFileSystem, 'readManifest')
        .mockImplementation(saveName => saveName === 'file1'
          ? { display }
          : null);

      // Act
      DataManager.loadGlobalInfo();

      // Assert
      expect(DataManager._globalInfo[1]).toBe(display);

      readManifest.mockRestore();
    });

    it('skips a slot with no manifest rather than leaving a hole that reads as a save', () =>
    {
      // Arrange
      const readManifest = vi.spyOn(SaveFileSystem, 'readManifest')
        .mockReturnValue(null);

      // Act
      DataManager.loadGlobalInfo();

      // Assert
      expect(DataManager._globalInfo.filter(entry => entry !== undefined)).toEqual([]);

      readManifest.mockRestore();
    });
  });

  describe('saveGlobalInfo()', () =>
  {
    it('writes nothing, because the index is derived from the manifests rather than stored', () =>
    {
      // Arrange
      const writesBefore = fake.writeCount;

      // Act
      DataManager.saveGlobalInfo();

      // Assert
      expect(fake.writeCount).toBe(writesBefore);
    });
  });
  //endregion the derived index

  //region loading one generation
  describe('loadGeneration()', () =>
  {
    it('replaces the running game rather than merely decoding the generation', async () =>
    {
      // Arrange
      const contents = { map: 1 };

      // the fake filesystem stands in for the fs primitives only; the pipeline method this delegates
      // to has its own suite, so here it is the seam being observed rather than the thing under test.
      const loadGeneration = vi.fn(() => Promise.resolve(contents));
      globalThis.StorageManager.loadGeneration = loadGeneration;

      // Act
      const result = await DataManager.loadGeneration(2, 'gen-0007');

      // Assert
      expect(loadGeneration).toHaveBeenCalledWith('file2', 'gen-0007');
      expect(DataManager.createdGameObjects).toBe(true);
      expect(DataManager.extractedContents).toBe(contents);
      expect(DataManager.correctedDataErrors).toBe(true);
      expect(result).toBe(0);
    });
  });
  //endregion loading one generation

  //region the manifest shape this relies on
  describe('the display block a manifest carries', () =>
  {
    it('is the savefile info, so the index and the summary cannot drift apart', () =>
    {
      // Arrange
      const info = DataManager.makeSavefileInfo();

      // Act
      const manifest = SaveManifest.create([ 'world.json' ], info, 100, 'playthrough-a');

      // Assert
      expect(manifest.display).toBe(info);
    });
  });
  //endregion the manifest shape this relies on
});
//endregion plugins/_base/ext/save/save-data-manager.test.js