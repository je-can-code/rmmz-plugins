//region plugins/_base/ext/save/save-file-mode-presentation.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('save file mode presentation (direct src import)', () =>
{
  let SaveFileEntry;
  let SaveFileMode;
  let SaveFileModeDelete;
  let SaveFileModeLoad;
  let SaveFileModeRewind;
  let SaveFileModeSave;
  let SaveFileSystem;

  /**
   * Builds the row a mode would be handed for a slot holding something.
   * @param {number} savefileId The slot's id.
   * @returns {SaveFileEntry}
   */
  const filledEntry = savefileId => new SaveFileEntry(
    savefileId,
    `file${savefileId}`,
    '',
    'gen-0004',
    { display: { mapName: 'The Kitchen' } });

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

    ({ default: SaveFileSystem } = await import(
      '../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveFileEntry } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileEntry.js'));
    ({ default: SaveFileMode } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileMode.js'));
    ({ default: SaveFileModeSave } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileModeSave.js'));
    ({ default: SaveFileModeLoad } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileModeLoad.js'));
    ({ default: SaveFileModeDelete } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileModeDelete.js'));
    ({ default: SaveFileModeRewind } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveFileModeRewind.js'));
  });

  beforeEach(() =>
  {
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

    globalThis.DataManager = { maxSavefiles: () => 2 };
  });

  //region the base class contract
  describe('SaveFileMode defaults', () =>
  {
    /**
     * The base class, which every default below is answered from.
     *
     * Instantiated directly on purpose: these are the answers a mode gets for free, and a subclass
     * that forgets to override one ships whatever is here. Pinning them is what makes "the scene asks,
     * it never decides" a checkable claim rather than a comment.
     * @type {SaveFileMode}
     */
    let mode;

    beforeEach(() =>
    {
      mode = new SaveFileMode();
    });

    it('names no command, so a subclass that forgets its key is selectable by nothing', () =>
    {
      // Arrange
      // Act
      const key = mode.key();

      // Assert
      expect(key).toBe('');
    });

    it('draws no label', () =>
    {
      // Arrange
      // Act
      const label = mode.label();

      // Assert
      expect(label).toBe('');
    });

    it('draws no icon', () =>
    {
      // Arrange
      // Act
      const iconIndex = mode.iconIndex();

      // Assert
      expect(iconIndex).toBe(0);
    });

    it('says nothing in the help window', () =>
    {
      // Arrange
      // Act
      const helpText = mode.helpText();

      // Assert
      expect(helpText).toBe('');
    });

    it('is enabled, because being useless is the exception a subclass declares', () =>
    {
      // Arrange
      // Act
      const isEnabled = mode.isEnabled();

      // Assert
      expect(isEnabled).toBe(true);
    });

    it('asks nothing in particular when confirming', () =>
    {
      // Arrange
      const entry = filledEntry(1);

      // Act
      const confirmText = mode.confirmText(entry);

      // Assert
      expect(confirmText).toBe('');
    });

    it('qualifies the question with nothing', () =>
    {
      // Arrange
      const entry = filledEntry(1);

      // Act
      const confirmDetail = mode.confirmDetail(entry);

      // Assert
      expect(confirmDetail).toBe('');
    });

    it('does nothing, and says so as a resolved promise so the scene has one success path', async () =>
    {
      // Arrange
      const entry = filledEntry(1);

      // Act
      const result = await mode.execute(entry);

      // Assert
      expect(result).toBeUndefined();
    });
  });
  //endregion the base class contract

  //region what the command column draws
  describe('the command column', () =>
  {
    it('names the save command with the engine term the database already has a word for', () =>
    {
      // Arrange
      const mode = new SaveFileModeSave();

      // Act
      const drawn = { key: mode.key(), label: mode.label(), helpText: mode.helpText() };

      // Assert
      expect(drawn).toEqual({
        key: 'save',
        label: 'Save',
        helpText: 'Which file would you like to save to?',
      });
    });

    it('names the load command', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const drawn = { key: mode.key(), label: mode.label(), helpText: mode.helpText() };

      // Assert
      expect(drawn).toEqual({
        key: 'load',
        label: 'Load',
        helpText: 'Which file would you like to load?',
      });
    });

    it('says permanent out loud for delete, which is the only unrecoverable command here', () =>
    {
      // Arrange
      const mode = new SaveFileModeDelete();

      // Act
      const drawn = { key: mode.key(), label: mode.label(), helpText: mode.helpText() };

      // Assert
      expect(drawn.key).toBe('delete');
      expect(drawn.label).toBe('Delete');
      expect(drawn.helpText).toContain('cannot be undone');
    });

    it('promises rewind deletes nothing, since players read it as resembling delete', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const helpText = mode.helpText();

      // Assert
      expect(helpText).toContain('Nothing is deleted');
    });
  });
  //endregion what the command column draws

  //region what the confirmation window asks
  describe('SaveFileModeLoad confirmation', () =>
  {
    it('names the slot in the question, so the row and the prompt cannot disagree', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const confirmText = mode.confirmText(filledEntry(2));

      // Assert
      expect(confirmText).toBe('Load slot 2?');
    });

    it('spells out the cost on its own line, because drawTextEx does not wrap', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const confirmDetail = mode.confirmDetail(filledEntry(2));

      // Assert
      expect(confirmDetail).toBe('Anything since your last save will be lost.');
    });

    it('puts the player back into the world on success', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      const resumesGame = mode.resumesGame();

      // Assert
      expect(resumesGame).toBe(true);
    });

    it('plays the load chime rather than the generic one, so the sound matches the action', () =>
    {
      // Arrange
      const mode = new SaveFileModeLoad();

      // Act
      mode.playSuccessSound();

      // Assert
      expect(SoundManager.playLoad).toHaveBeenCalledTimes(1);
      expect(SoundManager.playOk).not.toHaveBeenCalled();
    });
  });

  describe('SaveFileModeRewind confirmation', () =>
  {
    it('asks about stepping back rather than about a slot, since the rows are generations', () =>
    {
      // Arrange
      const mode = new SaveFileModeRewind();

      // Act
      const confirmText = mode.confirmText(filledEntry(1));

      // Assert
      expect(confirmText).toBe('Step back to this save?');
    });
  });
  //endregion what the confirmation window asks

  //region the row itself
  describe('SaveFileEntry', () =>
  {
    it('remembers which generation its manifest and picture came from', () =>
    {
      // Arrange
      const entry = filledEntry(1);

      // Act
      const sourceGenerationName = entry.sourceGenerationName();

      // Assert
      expect(sourceGenerationName).toBe('gen-0004');
    });

    it('has no picture when the row has nothing in it, since it names no generation', () =>
    {
      // Arrange
      const entry = emptyEntry(2);

      // Act
      const hasThumbnail = entry.hasThumbnail();

      // Assert
      expect(hasThumbnail).toBe(false);
    });

    it('asks the filesystem about a picture for a row that does hold a save', () =>
    {
      // Arrange
      const entry = filledEntry(1);
      const hasThumbnailOnDisk = vi.spyOn(SaveFileSystem, 'hasThumbnail')
        .mockReturnValue(true);

      // Act
      const hasThumbnail = entry.hasThumbnail();

      // Assert
      expect(hasThumbnail).toBe(true);
      expect(hasThumbnailOnDisk).toHaveBeenCalledWith('file1', 'gen-0004');

      hasThumbnailOnDisk.mockRestore();
    });

    it('loads its picture through a url, because an img cannot resolve a Windows path', () =>
    {
      // Arrange
      const entry = filledEntry(1);
      const thumbnailUrl = vi.spyOn(SaveFileSystem, 'thumbnailUrl')
        .mockReturnValue('file:///save/file1/gen-0004/thumbnail.png');

      // Act
      const url = entry.thumbnailUrl();

      // Assert
      expect(url).toBe('file:///save/file1/gen-0004/thumbnail.png');
      expect(thumbnailUrl).toHaveBeenCalledWith('file1', 'gen-0004');

      thumbnailUrl.mockRestore();
    });
  });
  //endregion the row itself
});
//endregion plugins/_base/ext/save/save-file-mode-presentation.test.js