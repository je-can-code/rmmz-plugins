//region plugins/_base/ext/save/save-file-modes.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('save file modes (direct src import)', () =>
{
  let SaveFileEntry;
  let SaveFileEntryMode;
  let SaveFileModeCatalog;
  let SaveFileModeDelete;
  let SaveFileModeLoad;
  let SaveFileModeRewind;
  let SaveFileModeSave;
  let SaveFileSystem;

  /**
   * Builds the row a mode would be handed for a slot holding something.
   * @param {number} savefileId The slot's id.
   * @param {object=} manifest What that slot's generation says about itself.
   * @returns {SaveFileEntry}
   */
  const filledEntry = (savefileId, manifest = { display: { mapName: 'The Kitchen' } }) =>
    new SaveFileEntry(savefileId, `file${savefileId}`, '', 'gen-0001', manifest);

  /**
   * Builds the row a mode would be handed for a slot nobody has saved to.
   * @param {number} savefileId The slot's id.
   * @returns {SaveFileEntry}
   */
  const emptyEntry = savefileId => new SaveFileEntry(savefileId, `file${savefileId}`, '', '', null);

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the source files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveFileSystem } = await import('../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveFileEntry } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileEntry.js'));
    ({ default: SaveFileEntryMode } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileEntryMode.js'));
    ({ default: SaveFileModeSave } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileModeSave.js'));
    ({ default: SaveFileModeLoad } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileModeLoad.js'));
    ({ default: SaveFileModeDelete } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileModeDelete.js'));
    ({ default: SaveFileModeRewind } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileModeRewind.js'));
    ({ default: SaveFileModeCatalog } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileModeCatalog.js'));
  });

  beforeEach(() =>
  {
    // the engine surfaces a mode reaches for, shaped the way the real callers hand them over:
    // `makeSavename` renders `file<N>`, and `maxSavefiles` is J-Base-Save's own override rather than
    // vanilla's twenty.
    globalThis.DataManager = {
      makeSavename: savefileId => `file${savefileId}`,
      maxSavefiles: () => 2,
      saveGame: vi.fn(() => Promise.resolve(0)),
      loadGame: vi.fn(() => Promise.resolve(0)),
      loadGeneration: vi.fn(() => Promise.resolve(0)),
      loadGlobalInfo: vi.fn(),
    };

    globalThis.StorageManager = { remove: vi.fn() };

    globalThis.$gameSystem = {
      savefileId: () => 1,
      setSavefileId: vi.fn(),
      onBeforeSave: vi.fn(),
    };

    globalThis.TextManager = {
      save: 'Save',
      saveMessage: 'Which file would you like to save to?',
      loadMessage: 'Which file would you like to load?',
    };

    globalThis.SoundManager = {
      playOk: vi.fn(),
      playSave: vi.fn(),
      playLoad: vi.fn(),
    };

    globalThis.Graphics = { frameCount: 0 };
  });

  //region availability
  describe('SaveFileEntryMode.offers()', () =>
  {
    it('offers save only from a save platform', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Platform, 'save')).toBe(true);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Menu, 'save')).toBe(false);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Title, 'save')).toBe(false);
    });

    it('offers load from everywhere', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Platform, 'load')).toBe(true);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Menu, 'load')).toBe(true);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Title, 'load')).toBe(true);
    });

    it('offers rewind only in-game, where there is a loaded game to rewind', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Platform, 'rewind')).toBe(true);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Menu, 'rewind')).toBe(true);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Title, 'rewind')).toBe(false);
    });

    it('offers delete only from the title screen, where nothing is loaded to interfere with', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Platform, 'delete')).toBe(false);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Menu, 'delete')).toBe(false);
      expect(SaveFileEntryMode.offers(SaveFileEntryMode.Title, 'delete')).toBe(true);
    });

    it('offers nothing at all for an origin nobody described, failing closed', () =>
    {
      // Arrange
      // Act
      const offered = SaveFileEntryMode.offers('nowhere', 'load');

      // Assert
      expect(offered).toBe(false);
    });
  });

  describe('SaveFileMode.isOfferedFrom()', () =>
  {
    it('answers each mode from the shared table rather than from itself', () =>
    {
      // Arrange
      const rewind = new SaveFileModeRewind();

      // Act
      // Assert
      expect(rewind.isOfferedFrom(SaveFileEntryMode.Platform)).toBe(true);
      expect(rewind.isOfferedFrom(SaveFileEntryMode.Title)).toBe(false);
    });
  });

  //endregion availability

  //region selectability
  describe('isEntrySelectable()', () =>
  {
    it('lets save write into an empty slot, which is where a first save goes', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const selectable = mode.isEntrySelectable(emptyEntry(1));

      // Assert
      expect(selectable).toBe(true);
    });

    it('lets save overwrite a full slot too', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const selectable = mode.isEntrySelectable(filledEntry(1));

      // Assert
      expect(selectable).toBe(true);
    });

    it('refuses to load an empty slot', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const selectable = mode.isEntrySelectable(emptyEntry(1));

      // Assert
      expect(selectable).toBe(false);
    });

    it('allows loading a slot that holds something', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const selectable = mode.isEntrySelectable(filledEntry(1));

      // Assert
      expect(selectable).toBe(true);
    });

    it('refuses to delete an empty slot', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      const selectable = mode.isEntrySelectable(emptyEntry(1));

      // Assert
      expect(selectable).toBe(false);
    });

    it('refuses to rewind to a generation whose manifest would not read', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const selectable = mode.isEntrySelectable(emptyEntry(1));

      // Assert
      expect(selectable).toBe(false);
    });
  });

  //endregion selectability

  //region confirmation
  describe('requiresConfirmation()', () =>
  {
    it('skips the question when loading from the title screen', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Title);

      // Assert
      expect(required).toBe(false);
    });

    it('asks when loading from a save platform, where a load costs unsaved progress', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Platform);

      // Assert
      expect(required).toBe(true);
    });

    it('asks when loading from the menu', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Menu);

      // Assert
      expect(required).toBe(true);
    });

    it('asks before saving, from anywhere save is offered', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Platform);

      // Assert
      expect(required).toBe(true);
    });

    it('asks before deleting, even though delete only exists where nothing is loaded', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Title);

      // Assert
      expect(required).toBe(true);
    });

    it('asks before rewinding', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const required = mode.requiresConfirmation(SaveFileEntryMode.Platform);

      // Assert
      expect(required).toBe(true);
    });
  });

  describe('confirmDefaultsToNo()', () =>
  {
    it('starts the cursor on the safe answer for the one irreversible command', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      const defaultsToNo = mode.confirmDefaultsToNo();

      // Assert
      expect(defaultsToNo).toBe(true);
    });

    it('starts on yes for a command that can be taken back', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const defaultsToNo = mode.confirmDefaultsToNo();

      // Assert
      expect(defaultsToNo).toBe(false);
    });
  });

  describe('confirmText()', () =>
  {
    it('names overwriting when saving over something', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const text = mode.confirmText(filledEntry(2));

      // Assert
      expect(text).toBe('Overwrite the save in slot 2?');
    });

    it('does not cry overwrite when the slot is empty', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const text = mode.confirmText(emptyEntry(2));

      // Assert
      expect(text).toBe('Save to slot 2?');
    });

    it('says permanent out loud when deleting', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      const question = mode.confirmText(filledEntry(1));
      const detail = mode.confirmDetail(filledEntry(1));

      // Assert- the warning lives on the second line rather than trailing the question, because
      // `drawTextEx` does not wrap and one sentence carrying both ran off the edge of the window.
      expect(question).toContain('Permanently delete');
      expect(detail).toContain('cannot be undone');
    });

    it('says nothing is deleted when rewinding, since the word invites the opposite', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const detail = mode.confirmDetail(filledEntry(1));

      // Assert
      expect(detail).toContain('Nothing is deleted');
    });

    it('leaves the second line empty for a command that needs no warning', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const detail = mode.confirmDetail(emptyEntry(2));

      // Assert- saving to an empty slot costs nothing, and inventing a reassurance to fill the line
      // would be noise. The window reserves the space either way so the answers do not shift.
      expect(detail).toBe('');
    });
  });

  //endregion confirmation

  //region rows
  describe('entries()', () =>
  {
    it('lists one row per slot the game renders, not vanilla twenty', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();
      vi.spyOn(SaveFileSystem, 'readableGeneration')
        .mockReturnValue({
          generationName: '',
          manifest: null,
        });

      // Act
      const entries = mode.entries();

      // Assert
      expect(entries).toHaveLength(2);
      expect(entries.map(entry => entry.savefileId())).toEqual([ 1, 2 ]);

      SaveFileSystem.readableGeneration.mockRestore();
    });

    it('lists the current slot\'s generations rather than slots, when rewinding', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      vi.spyOn(SaveFileSystem, 'loadOrder')
        .mockReturnValue([ 'gen-0003', 'gen-0002' ]);
      vi.spyOn(SaveFileSystem, 'readManifestQuietly')
        .mockReturnValue({ display: {} });

      // Act
      const entries = mode.entries();

      // Assert
      expect(entries.map(entry => entry.generationName())).toEqual([ 'gen-0003', 'gen-0002' ]);
      expect(entries.every(entry => entry.isGeneration())).toBe(true);

      SaveFileSystem.loadOrder.mockRestore();
      SaveFileSystem.readManifestQuietly.mockRestore();
    });
  });

  describe('SaveFileModeRewind.isEnabled()', () =>
  {
    it('is unavailable when no slot has been claimed at all', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      globalThis.$gameSystem.savefileId = () => 0;

      // Act
      const enabled = mode.isEnabled();

      // Assert
      expect(enabled).toBe(false);
    });

    it('is unavailable for a playthrough that has never saved, despite carrying a guessed slot id', () =>
    {
      // Arrange
      // `selectSavefileForNewGame` stamps a non-zero id at New Game before anything is written, so the
      // id alone would answer yes here.
      const mode = new SaveFileModeRewind();
      vi.spyOn(SaveFileSystem, 'loadOrder')
        .mockReturnValue([]);

      // Act
      const enabled = mode.isEnabled();

      // Assert
      expect(enabled).toBe(false);

      SaveFileSystem.loadOrder.mockRestore();
    });

    it('is unavailable with exactly one generation, since there is nowhere to step back to', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      vi.spyOn(SaveFileSystem, 'loadOrder')
        .mockReturnValue([ 'gen-0001' ]);

      // Act
      const enabled = mode.isEnabled();

      // Assert
      expect(enabled).toBe(false);

      SaveFileSystem.loadOrder.mockRestore();
    });

    it('is available once the slot holds more than one reachable generation', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      vi.spyOn(SaveFileSystem, 'loadOrder')
        .mockReturnValue([ 'gen-0002', 'gen-0001' ]);

      // Act
      const enabled = mode.isEnabled();

      // Assert
      expect(enabled).toBe(true);

      SaveFileSystem.loadOrder.mockRestore();
    });
  });

  //endregion rows

  //region elapsed time
  describe('SaveFileModeRewind.humanizeDuration()', () =>
  {
    it('collapses anything inside a minute to the same instant', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.humanizeDuration(45 * 1000);

      // Assert
      expect(text).toBe('moments');
    });

    it('reads in minutes below an hour', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.humanizeDuration(12 * 60 * 1000);

      // Assert
      expect(text).toBe('12 minutes');
    });

    it('reads in hours below a day', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.humanizeDuration(5 * 60 * 60 * 1000);

      // Assert
      expect(text).toBe('5 hours');
    });

    it('reads in days beyond that', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.humanizeDuration(3 * 24 * 60 * 60 * 1000);

      // Assert
      expect(text).toBe('3 days');
    });

    it('drops the plural for exactly one of a unit', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.humanizeDuration(60 * 60 * 1000);

      // Assert
      expect(text).toBe('1 hour');
    });
  });

  describe('SaveFileModeRewind.describeElapsed()', () =>
  {
    it('uses the wall clock inside the threshold, which is what a player is thinking in', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.describeElapsed(12 * 60 * 1000, 43200);

      // Assert
      expect(text).toBe('12 minutes ago');
    });

    it('falls back to the play clock past it, so a resumed save does not read "3 days" on every row', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // three days of wall clock, but only eighteen minutes of play since that save.
      const elapsedMs = 3 * 24 * 60 * 60 * 1000;
      const playtimeFrameDelta = 18 * 60 * 60;

      // Act
      const text = mode.describeElapsed(elapsedMs, playtimeFrameDelta);

      // Assert
      expect(text).toBe('18 minutes of play earlier');
    });

    it('treats the threshold itself as still inside the session', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const text = mode.describeElapsed(mode.elapsedThresholdMs(), 0);

      // Assert
      expect(text).toBe('2 hours ago');
    });
  });

  describe('leadText()', () =>
  {
    it('leads with where you were, for a mode listing slots', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const text = mode.leadText(filledEntry(1));

      // Assert
      expect(text).toBe('The Kitchen');
    });

    it('leads with how long ago, for the mode listing generations of one slot', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      const savedAt = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      const entry = filledEntry(1, {
        display: { mapName: 'The Kitchen' },
        savedAt,
        playtimeFrames: 0,
      });

      // Act
      const text = mode.leadText(entry);

      // Assert
      expect(text).toBe('5 minutes ago');
    });
  });

  //endregion elapsed time

  //region execution
  describe('execute()', () =>
  {
    it('stamps the slot and flushes plugin state before saving into it', async () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      await mode.execute(emptyEntry(2));

      // Assert
      expect(globalThis.$gameSystem.setSavefileId).toHaveBeenCalledWith(2);
      expect(globalThis.$gameSystem.onBeforeSave).toHaveBeenCalled();
      expect(globalThis.DataManager.saveGame).toHaveBeenCalledWith(2);
    });

    it('loads a whole slot, letting the storage layer pick the newest generation that works', async () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      await mode.execute(filledEntry(1));

      // Assert
      expect(globalThis.DataManager.loadGame).toHaveBeenCalledWith(1);
    });

    it('loads the one generation asked for when rewinding, rather than the slot', async () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();
      const entry = new SaveFileEntry(1, 'file1', 'gen-0002', 'gen-0002', { display: {} });

      // Act
      await mode.execute(entry);

      // Assert
      expect(globalThis.DataManager.loadGeneration).toHaveBeenCalledWith(1, 'gen-0002');
    });

    it('rebuilds the savefile index after a delete, so the title screen stops offering a gone save', async () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      await mode.execute(filledEntry(1));

      // Assert
      expect(globalThis.StorageManager.remove).toHaveBeenCalledWith('file1');
      expect(globalThis.DataManager.loadGlobalInfo).toHaveBeenCalled();
    });
  });

  describe('resumesGame()', () =>
  {
    it('is true for the modes that end with a map coming up', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(new SaveFileModeLoad().resumesGame()).toBe(true);
      expect(new SaveFileModeRewind().resumesGame()).toBe(true);
    });

    it('is false for the modes that leave the player in the scene', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(new SaveFileModeSave().resumesGame()).toBe(false);
      expect(new SaveFileModeDelete().resumesGame()).toBe(false);
    });
  });

  describe('playSuccessSound()', () =>
  {
    it('plays the save chime for a save', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      mode.playSuccessSound();

      // Assert
      expect(globalThis.SoundManager.playSave).toHaveBeenCalled();
    });

    it('plays the load chime for a rewind, because a rewind is a load', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      mode.playSuccessSound();

      // Assert
      expect(globalThis.SoundManager.playLoad).toHaveBeenCalled();
    });

    it('does not play the save chime for a delete', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      mode.playSuccessSound();

      // Assert
      expect(globalThis.SoundManager.playOk).toHaveBeenCalled();
      expect(globalThis.SoundManager.playSave).not.toHaveBeenCalled();
    });
  });

  //endregion execution

  //region catalog
  describe('SaveFileModeCatalog', () =>
  {
    it('holds every mode, in the order the command column offers them', () =>
    {
      // Arrange
      // Act
      const keys = SaveFileModeCatalog.all()
        .map(mode => mode.key());

      // Assert
      expect(keys).toEqual([ 'save', 'load', 'rewind', 'delete' ]);
    });

    it('finds a mode by the symbol its command carries', () =>
    {
      // Arrange
      // Act
      const mode = SaveFileModeCatalog.byKey('rewind');

      // Assert
      expect(mode.label()).toBe('Rewind');
    });

    it('answers with null for a symbol no mode claims, such as back', () =>
    {
      // Arrange
      // Act
      const mode = SaveFileModeCatalog.byKey('back');

      // Assert
      expect(mode).toBe(null);
    });
  });

  //endregion catalog
});
//endregion plugins/_base/ext/save/save-file-modes.test.js