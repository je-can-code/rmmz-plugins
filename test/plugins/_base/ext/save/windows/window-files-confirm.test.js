//region plugins/_base/ext/save/windows/window-files-confirm.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import {
  clearDrawnText,
  drawnText,
  installMinimalDatabase,
  installRmmzViewLayer,
} from '../../../../../setup/rmmz-view-harness.js';

/**
 * The confirmation prompt, against the real `Window_Command` rather than a stand-in.
 *
 * Two seams live here and neither survives a stubbed base class. The first is the same ordering
 * problem every command window has - `initialize` refreshes, refreshing calls `makeCommandList`, so
 * the question has to be seeded in `initMembers` or the first draw happens against nothing. The
 * second is `itemRect`, which only means anything relative to the rectangle the real
 * `Window_Selectable` would have handed back.
 */
describe('Window_FilesConfirm', () =>
{
  let Window_FilesConfirm;

  /**
   * Builds the window the way the scene does, at an arbitrary rectangle.
   * @returns {Window_FilesConfirm} The freshly constructed window.
   */
  const buildWindow = () => new Window_FilesConfirm(new Rectangle(0, 0, 400, 300));

  /**
   * Names the answers the window is currently offering, in order.
   * @param {Window_FilesConfirm} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

  /**
   * Reassembles everything the window drew into one string.
   *
   * `drawTextEx` walks the prompt one character at a time through the real text pipeline, so the
   * transcript arrives as single glyphs rather than whole phrases.
   * @returns {string} Every glyph drawn, in order.
   */
  const drawnPhrase = () => drawnText.join('');

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, and the two answers
    // are built out of both. Loading the shipped bundle is how a J-Base global reaches a test, since
    // a plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: Window_FilesConfirm } = await import(
      '../../../../../../src/plugins/_base/ext/save/windows/Window_FilesConfirm.js'));
  });

  beforeEach(() =>
  {
    clearDrawnText();
  });

  //region state seeded early enough to be seen
  describe('initMembers()', () =>
  {
    it('seeds an empty question, so construction cannot draw a prompt nobody asked', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.prompt())
        .toBe(String.empty);
    });

    it('seeds an empty detail alongside the question it belongs to', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.detail())
        .toBe(String.empty);
    });
  });
  //endregion state seeded early enough to be seen

  //region the two answers
  describe('makeCommandList()', () =>
  {
    it('offers exactly the two answers a question can have, in the order a reader expects', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'confirm', 'deny' ]);
    });
  });

  describe('buildCommands()', () =>
  {
    it('labels the answers plainly rather than restating the command being confirmed', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const commands = window.buildCommands();

      // Assert
      expect(commands.map(command => command.name))
        .toEqual([ 'Yes', 'No' ]);
    });
  });

  describe('confirmSymbol()', () =>
  {
    it('names the answer that goes ahead', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const symbol = window.confirmSymbol();

      // Assert
      expect(symbol)
        .toBe('confirm');
    });
  });

  describe('denySymbol()', () =>
  {
    it('names the answer that backs out', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const symbol = window.denySymbol();

      // Assert
      expect(symbol)
        .toBe('deny');
    });
  });
  //endregion the two answers

  //region the question above the answers
  describe('setPrompt()', () =>
  {
    it('writes both halves of the question together', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setPrompt('Delete slot 1?', 'This cannot be undone.');

      // Assert
      expect(window.prompt())
        .toBe('Delete slot 1?');
      expect(window.detail())
        .toBe('This cannot be undone.');
    });

    it('redraws once both halves are in place, so the question is on screen without a second call', () =>
    {
      // Arrange
      const window = buildWindow();
      clearDrawnText();

      // Act
      window.setPrompt('Overwrite slot 3?', String.empty);

      // Assert
      expect(drawnPhrase())
        .toContain('Overwrite slot 3?');
    });
  });

  describe('setDetail()', () =>
  {
    it('records the cost without redrawing, leaving the question mid-change off screen', () =>
    {
      // Arrange
      const window = buildWindow();
      clearDrawnText();

      // Act
      window.setDetail('Slot 2 will be lost.');

      // Assert
      expect(window.detail())
        .toBe('Slot 2 will be lost.');
      expect(drawnPhrase())
        .not.toContain('Slot 2 will be lost.');
    });
  });

  describe('promptLineCount()', () =>
  {
    it('reserves room for the question and its qualifier both', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const lines = window.promptLineCount();

      // Assert
      expect(lines)
        .toBe(2);
    });
  });
  //endregion the question above the answers

  //region rows pushed clear of the question
  describe('itemRect()', () =>
  {
    it('pushes the first answer below the reserved prompt lines rather than on top of them', () =>
    {
      // Arrange: the base rectangle is where the answer would sit with no question above it.
      const window = buildWindow();
      const base = Window_Command.prototype.itemRect.call(window, 0);
      const reserved = window.promptLineCount() * window.lineHeight();

      // Act
      const rectangle = window.itemRect(0);

      // Assert
      expect(rectangle.y - base.y)
        .toBe(reserved);
    });

    it('shifts every answer by the same amount rather than accumulating the offset per row', () =>
    {
      // Arrange
      const window = buildWindow();
      const baseGap = Window_Command.prototype.itemRect.call(window, 1).y
        - Window_Command.prototype.itemRect.call(window, 0).y;

      // Act
      const first = window.itemRect(0);
      const second = window.itemRect(1);

      // Assert
      expect(second.y - first.y)
        .toBe(baseGap);
    });
  });
  //endregion rows pushed clear of the question

  //region what actually gets drawn
  describe('refresh()', () =>
  {
    it('draws the answers but no question when nothing has been asked yet', () =>
    {
      // Arrange
      const window = buildWindow();
      clearDrawnText();

      // Act
      window.refresh();

      // Assert
      expect(drawnPhrase())
        .toContain('Yes');
      expect(drawnPhrase())
        .toContain('No');
    });

    it('draws the question above the answers once one has been asked', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setPrompt('Load slot 4?', String.empty);
      clearDrawnText();

      // Act
      window.refresh();

      // Assert
      expect(drawnPhrase())
        .toContain('Load slot 4?');
    });

    it('draws the qualifier beneath the question when there is one to draw', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setPrompt('Delete slot 5?', 'This cannot be undone.');
      clearDrawnText();

      // Act
      window.refresh();

      // Assert
      expect(drawnPhrase())
        .toContain('This cannot be undone.');
    });

    it('leaves the reserved space empty when a command needs no qualification', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setPrompt('Save to slot 6?', String.empty);
      clearDrawnText();

      // Act
      window.refresh();

      // Assert: the question is drawn and nothing follows it, yet the answers still sit where they
      // always sit - an unqualified question does not shuffle them upward into the gap.
      const base = Window_Command.prototype.itemRect.call(window, 0);
      expect(drawnPhrase())
        .toBe('YesNoSave to slot 6?');
      expect(window.itemRect(0).y - base.y)
        .toBe(window.promptLineCount() * window.lineHeight());
    });
  });
  //endregion what actually gets drawn
});
//endregion plugins/_base/ext/save/windows/window-files-confirm.test.js