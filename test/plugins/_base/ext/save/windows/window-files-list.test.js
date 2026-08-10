//region plugins/_base/ext/save/windows/window-files-list.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import {
  clearDrawnText,
  drawnText,
  installMinimalDatabase,
  installRmmzViewLayer,
} from '../../../../../setup/rmmz-view-harness.js';
import { installFakeSaveFilesystem } from '../fixtures/install-fake-save-filesystem.js';

/**
 * The list of files, against the real `Window_Command` rather than a stand-in.
 *
 * The rows here are real {@link SaveFileEntry} objects carrying real manifests, and the mode driving
 * them is a real {@link SaveFileMode} - the same two things the scene hands over. That matters more
 * than usual for this window, because its entire stated policy is that nothing drawn comes off a
 * `$game*` global, and a hand-shaped row stub would let a regression against that policy pass.
 */
describe('Window_FilesList', () =>
{
  let Window_FilesList;
  let SaveFileEntry;
  let SaveFileModeLoad;
  let SaveFileModeSave;
  let SaveFileSystem;
  let fakeFilesystem;

  /**
   * Builds the window the way the scene does, at the shape the facet area actually gives it.
   * @returns {Window_FilesList} The freshly constructed window.
   */
  const buildWindow = () => new Window_FilesList(new Rectangle(0, 0, 900, 500));

  /**
   * Builds the row a mode would be handed for a slot holding something.
   * @param {number} savefileId The slot's id.
   * @param {object=} display What that slot's manifest says about itself.
   * @returns {SaveFileEntry} The filled row.
   */
  const filledEntry = (savefileId, display = {}) => new SaveFileEntry(
    savefileId,
    `file${savefileId}`,
    String.empty,
    'gen-0001',
    {
      display: {
        mapName: 'The Kitchen',
        leaderName: 'Jerald',
        level: 12,
        playtime: '01:23:45',
        gold: 4200,
        timestamp: Date.UTC(2026, 7, 5, 12, 0, 0),
        ...display,
      },
    });

  /**
   * Builds the row a mode would be handed for a slot nobody has saved to.
   * @param {number} savefileId The slot's id.
   * @returns {SaveFileEntry} The empty row.
   */
  const emptyEntry = savefileId => new SaveFileEntry(savefileId, `file${savefileId}`, String.empty, String.empty, null);

  /**
   * Reassembles everything the window drew into one string.
   *
   * `drawTextEx` walks each line one character at a time through the real text pipeline, so the
   * transcript arrives as single glyphs rather than whole phrases.
   * @returns {string} Every glyph drawn, in order.
   */
  const drawnPhrase = () => drawnText.join('');

  /**
   * Points the window at a mode and a hand-picked set of rows, the way the scene's two calls leave it.
   * @param {Window_FilesList} window The window to point.
   * @param {SaveFileMode} mode The mode deciding what a row means.
   * @param {SaveFileEntry[]} entries The rows to list.
   */
  const listRows = (window, mode, entries) =>
  {
    window.setMode(mode);
    window.setEntries(entries);
    window.refresh();
  };

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, and every row is built
    // out of both. Loading the shipped bundle is how a J-Base global reaches a test, since a plugin
    // source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: SaveFileSystem } = await import(
      '../../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveFileEntry } = await import('../../../../../../src/plugins/_base/ext/save/core/SaveFileEntry.js'));
    ({ default: SaveFileModeLoad } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileModeLoad.js'));
    ({ default: SaveFileModeSave } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileModeSave.js'));
    ({ default: Window_FilesList } = await import(
      '../../../../../../src/plugins/_base/ext/save/windows/Window_FilesList.js'));
  });

  beforeEach(() =>
  {
    // an empty disk, so a mode asked for its rows describes every slot as empty until a test says
    // otherwise. `hasThumbnail` reads through here too, which is how a picture gets to exist at all.
    fakeFilesystem = installFakeSaveFilesystem();

    // two slots rather than the shipped thirty-four; the window's behavior does not vary with the
    // count and a list of two is one a reader can hold in their head.
    globalThis.DataManager.maxSavefiles = () => 2;

    clearDrawnText();
  });

  //region state seeded early enough to be seen
  describe('initMembers()', () =>
  {
    it('seeds an empty row set, so construction cannot draw rows it has not been given', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.entries())
        .toEqual([]);
    });

    it('seeds a null mode, because no command has been chosen at construction', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.mode())
        .toBeNull();
    });

    it('seeds the picture cache before the first row could ask it for anything', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.thumbnails())
        .toBeInstanceOf(Map);
      expect(window.thumbnails().size)
        .toBe(0);
    });
  });
  //endregion state seeded early enough to be seen

  //region pointing the list at a mode
  describe('setMode()', () =>
  {
    it('records the mode now deciding what a row means', () =>
    {
      // Arrange
      const window = buildWindow();
      const mode = new SaveFileModeLoad();

      // Act
      window.setMode(mode);

      // Assert
      expect(window.mode())
        .toBe(mode);
    });

    it('rebuilds the rows from that mode rather than keeping whatever was listed before', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setEntries([ filledEntry(1), filledEntry(2), filledEntry(3) ]);

      // Act: an empty disk means the load mode reports one empty row per slot.
      window.setMode(new SaveFileModeLoad());

      // Assert
      expect(window.entries().length)
        .toBe(2);
      expect(window.entries()
        .every(entry => entry.hasSave() === false))
        .toBe(true);
    });

    it('redraws around the new rows without a second call', () =>
    {
      // Arrange
      const window = buildWindow();
      clearDrawnText();

      // Act
      window.setMode(new SaveFileModeLoad());

      // Assert
      expect(drawnPhrase())
        .toContain('Slot 1 - Empty');
    });
  });

  describe('setEntries()', () =>
  {
    it('replaces the listed rows wholesale', () =>
    {
      // Arrange
      const window = buildWindow();
      const rows = [ filledEntry(1) ];

      // Act
      window.setEntries(rows);

      // Assert
      expect(window.entries())
        .toBe(rows);
    });
  });

  describe('currentEntry()', () =>
  {
    it('answers with the row under the cursor', () =>
    {
      // Arrange
      const window = buildWindow();
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1), filledEntry(2) ]);

      // Act
      window.select(1);

      // Assert
      expect(window.currentEntry()
        .savefileId())
        .toBe(2);
    });

    it('answers with null while nothing is highlighted', () =>
    {
      // Arrange: the scene deselects this list whenever focus sits elsewhere, so a negative index is
      // an ordinary state rather than an impossible one.
      const window = buildWindow();
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1), filledEntry(2) ]);

      // Act
      window.deselect();

      // Assert
      expect(window.currentEntry())
        .toBeNull();
    });

    it('answers with null when the cursor sits past the end of a shortened list', () =>
    {
      // Arrange
      const window = buildWindow();
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1), filledEntry(2) ]);
      window.select(1);

      // Act: a delete leaves the list shorter than where the cursor was.
      window.setEntries([ filledEntry(1) ]);

      // Assert
      expect(window.currentEntry())
        .toBeNull();
    });
  });
  //endregion pointing the list at a mode

  //region layout
  describe('visibleRowCount()', () =>
  {
    it('shows two rows at a time, because the picture is what a player recognizes', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const rows = window.visibleRowCount();

      // Assert
      expect(rows)
        .toBe(2);
    });
  });

  describe('itemHeight()', () =>
  {
    it('divides the window evenly among the rows it shows rather than using a line height', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const height = window.itemHeight();

      // Assert
      expect(height)
        .toBe(Math.floor(window.innerHeight / 2));
    });
  });

  describe('thumbnailHeight()', () =>
  {
    it('insets the picture from both edges of its row', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const height = window.thumbnailHeight();

      // Assert
      expect(height)
        .toBe(window.itemHeight() - (window.rowPadding() * 2));
    });
  });

  describe('thumbnailWidth()', () =>
  {
    it('holds the picture to sixteen by nine', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const width = window.thumbnailWidth();

      // Assert
      expect(width)
        .toBe(Math.floor(window.thumbnailHeight() * (16 / 9)));
    });
  });

  describe('rowPadding()', () =>
  {
    it('leaves breathing room between a row and its contents', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const padding = window.rowPadding();

      // Assert
      expect(padding)
        .toBe(8);
    });
  });

  describe('textOffsetX()', () =>
  {
    it('starts the text block clear of the picture and its padding on both sides', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const offset = window.textOffsetX();

      // Assert
      expect(offset)
        .toBe(window.thumbnailWidth() + (window.rowPadding() * 2));
    });
  });
  //endregion layout

  //region the rows themselves
  describe('buildCommands()', () =>
  {
    it('offers nothing while no command has been chosen, since a row means nothing yet', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const commands = window.buildCommands();

      // Assert
      expect(commands)
        .toEqual([]);
    });

    it('offers one row per entry the active mode is listing', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1), emptyEntry(2), filledEntry(3) ]);

      // Assert
      expect(window._list.length)
        .toBe(3);
    });
  });

  describe('buildCommand()', () =>
  {
    it('enables a row the mode can act on', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act: loading needs something on disk, and slot one has it.
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1) ]);

      // Assert
      expect(window.isCommandEnabled(0))
        .toBe(true);
    });

    it('disables a row the mode cannot act on', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act: there is nothing in slot one to load.
      listRows(window, new SaveFileModeLoad(), [ emptyEntry(1) ]);

      // Assert
      expect(window.isCommandEnabled(0))
        .toBe(false);
    });

    it('enables an empty row for the one command an empty row is the point of', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      listRows(window, new SaveFileModeSave(), [ emptyEntry(1) ]);

      // Assert
      expect(window.isCommandEnabled(0))
        .toBe(true);
    });

    it('carries the row index along so drawing can find its way back to the entry', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1), filledEntry(2) ]);

      // Assert
      expect(window._list.map(command => command.ext))
        .toEqual([ 0, 1 ]);
    });
  });
  //endregion the rows themselves

  //region what a row draws
  describe('drawItem()', () =>
  {
    it('draws a slot with something in it as a described file', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1) ]);

      // Assert
      expect(drawnPhrase())
        .toContain('The Kitchen');
    });

    it('draws a slot with nothing in it as its number alone', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      listRows(window, new SaveFileModeLoad(), [ emptyEntry(4) ]);

      // Assert
      expect(drawnPhrase())
        .toContain('Slot 4 - Empty');
      expect(drawnPhrase())
        .not.toContain('The Kitchen');
    });

    it('leaves the canvas at full opacity for whatever draws after a dimmed row', () =>
    {
      // Arrange
      const window = buildWindow();
      const changePaintOpacity = vi.spyOn(window, 'changePaintOpacity');

      // Act: an unselectable row dims, and the row after it must not inherit that.
      listRows(window, new SaveFileModeLoad(), [ emptyEntry(1) ]);

      // Assert
      expect(changePaintOpacity)
        .toHaveBeenLastCalledWith(true);

      changePaintOpacity.mockRestore();
    });
  });

  describe('textLines()', () =>
  {
    it('leads with what the mode says a row is, then the leader, the purse and the moment', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMode(new SaveFileModeLoad());

      // Act
      const lines = window.textLines(filledEntry(1));

      // Assert
      expect(lines.length)
        .toBe(4);
      expect(lines[0])
        .toBe('The Kitchen');
      expect(lines[1])
        .toContain('Jerald');
      expect(lines[1])
        .toContain('Lv.12');
    });

    it('draws the purse in the game\'s own currency rather than a hardcoded word', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMode(new SaveFileModeLoad());

      // Act
      const lines = window.textLines(filledEntry(1));

      // Assert
      expect(lines[2])
        .toContain('01:23:45');
      expect(lines[2])
        .toContain(TextManager.currencyUnit);
    });
  });

  describe('describeTimestamp()', () =>
  {
    it('renders the moment of writing in the player\'s own locale', () =>
    {
      // Arrange
      const window = buildWindow();
      const written = Date.UTC(2026, 7, 5, 12, 0, 0);

      // Act
      const described = window.describeTimestamp(written);

      // Assert
      expect(described)
        .toContain(new Date(written).toLocaleDateString());
      expect(described)
        .toContain(new Date(written).toLocaleTimeString());
    });
  });
  //endregion what a row draws

  //region the picture
  describe('drawThumbnail()', () =>
  {
    it('reserves the space a picture would have taken when the row has none', () =>
    {
      // Arrange
      const window = buildWindow();
      const fillRect = vi.spyOn(window.contents, 'fillRect');

      // Act: nothing was ever written to the fake disk, so no picture exists for this row.
      listRows(window, new SaveFileModeLoad(), [ filledEntry(1) ]);

      // Assert: the placeholder is drawn at exactly the size the picture would have been, so the
      // text beside it does not shift depending on whether one survived.
      expect(fillRect)
        .toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          window.thumbnailWidth(),
          window.thumbnailHeight(),
          expect.any(String));

      fillRect.mockRestore();
    });

    it('blits the picture into the row once the row has one on disk', () =>
    {
      // Arrange
      const window = buildWindow();
      const entry = filledEntry(1);
      fakeFilesystem.files.set(SaveFileSystem.thumbnailPath('file1', 'gen-0001'), 'a picture');
      const blt = vi.spyOn(window.contents, 'blt');

      // Act
      listRows(window, new SaveFileModeLoad(), [ entry ]);

      // Assert
      expect(blt)
        .toHaveBeenCalled();

      blt.mockRestore();
    });

    it('draws nothing yet for a picture still in flight, leaving the redraw to its load listener', () =>
    {
      // Arrange
      const window = buildWindow();
      const entry = filledEntry(1);
      fakeFilesystem.files.set(SaveFileSystem.thumbnailPath('file1', 'gen-0001'), 'a picture');

      // pre-seed the cache with a picture that has not arrived, which is the state every picture
      // passes through on its way in.
      const pending = new Bitmap(0, 0);
      pending.isReady = () => false;
      window.thumbnails()
        .set(entry.thumbnailUrl(), pending);

      const blt = vi.spyOn(window.contents, 'blt');

      // Act
      listRows(window, new SaveFileModeLoad(), [ entry ]);

      // Assert
      expect(blt)
        .not.toHaveBeenCalled();

      blt.mockRestore();
    });
  });

  describe('thumbnailFor()', () =>
  {
    it('loads a picture the first time a row asks for it, and remembers it by its url', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMode(new SaveFileModeLoad());
      const entry = filledEntry(1);
      fakeFilesystem.files.set(SaveFileSystem.thumbnailPath('file1', 'gen-0001'), 'a picture');

      // Act
      const bitmap = window.thumbnailFor(entry);

      // Assert
      expect(window.thumbnails()
        .get(entry.thumbnailUrl()))
        .toBe(bitmap);
    });

    it('hands back the cached picture rather than starting a second load', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMode(new SaveFileModeLoad());
      const entry = filledEntry(1);
      fakeFilesystem.files.set(SaveFileSystem.thumbnailPath('file1', 'gen-0001'), 'a picture');
      const first = window.thumbnailFor(entry);

      // Act
      const second = window.thumbnailFor(entry);

      // Assert: a fresh load here would re-attach a listener that refreshes, which refreshes into a
      // fresh load, which is a loop rather than a picture.
      expect(second)
        .toBe(first);
      expect(window.thumbnails().size)
        .toBe(1);
    });
  });
  //endregion the picture
});
//endregion plugins/_base/ext/save/windows/window-files-list.test.js