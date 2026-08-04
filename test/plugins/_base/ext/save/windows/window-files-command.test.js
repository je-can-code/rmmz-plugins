//region plugins/_base/ext/save/windows/window-files-command.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';

/**
 * The command column, against the real `Window_Command` rather than a stand-in.
 *
 * What is being guarded here is wiring, and wiring only exists once both objects are genuine.
 * `Window_Command.initialize` ends by refreshing, refreshing calls `makeCommandList`, and this window
 * seeds the state that list reads in the `initMembers` hook precisely because both other places are
 * too late. Stub the base class and every assertion about that ordering becomes circular.
 */
describe('Window_FilesCommand', () =>
{
  let Window_FilesCommand;
  let SaveFileEntryMode;

  /**
   * Builds the window the way the scene does, at an arbitrary rectangle.
   * @returns {Window_FilesCommand} The freshly constructed window.
   */
  const buildWindow = () => new Window_FilesCommand(new Rectangle(0, 0, 400, 300));

  /**
   * Names the symbols the window is currently offering, in order.
   * @param {Window_FilesCommand} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, and this window is
    // built out of both. Loading the shipped bundle is how a J-Base global reaches a test, since a
    // plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: SaveFileEntryMode } = await import(
      '../../../../../../src/plugins/_base/ext/save/core/SaveFileEntryMode.js'));
    ({ default: Window_FilesCommand } = await import(
      '../../../../../../src/plugins/_base/ext/save/windows/Window_FilesCommand.js'));
  });

  //region state seeded early enough to be seen
  describe('initMembers()', () =>
  {
    it('seeds the mode roster before the first list is built from it', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.modes()
        .length).toBeGreaterThan(0);
    });

    it('seeds an empty origin, so construction cannot draw commands it is about to take away', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.entryMode()).toBe('');
      expect(symbolsOf(window)).toEqual([]);
    });
  });
  //endregion state seeded early enough to be seen

  //region what each origin offers
  describe('setEntryMode()', () =>
  {
    it('offers saving, loading and rewinding from a save platform, then a way out', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setEntryMode(SaveFileEntryMode.Platform);

      // Assert
      expect(symbolsOf(window)).toEqual([ 'save', 'load', 'rewind', 'back' ]);
    });

    it('withholds saving from the menu, because saving is the platform\'s job', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setEntryMode(SaveFileEntryMode.Menu);

      // Assert
      expect(symbolsOf(window)).toEqual([ 'load', 'rewind', 'back' ]);
    });

    it('offers deleting only from the title, where nothing is loaded for it to interact with', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setEntryMode(SaveFileEntryMode.Title);

      // Assert
      expect(symbolsOf(window)).toContain('delete');
      expect(symbolsOf(window)).not.toContain('rewind');
    });

    it('rebuilds rather than appending, so switching origin never leaves the old commands behind', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setEntryMode(SaveFileEntryMode.Platform);

      // Act
      window.setEntryMode(SaveFileEntryMode.Menu);

      // Assert
      expect(symbolsOf(window)).toEqual([ 'load', 'rewind', 'back' ]);
    });
  });
  //endregion what each origin offers

  //region the commands themselves
  describe('buildCommand()', () =>
  {
    it('carries each mode\'s label, help text and enablement onto its row', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setEntryMode(SaveFileEntryMode.Platform);

      // Act
      const saveCommand = window._list.find(command => command.symbol === 'save');

      // Assert
      expect(saveCommand.name).toBe(window.modeFor('save')
        .label());
      expect(saveCommand.enabled).toBe(true);
    });

    it('always ends with a way out, and always last', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setEntryMode(SaveFileEntryMode.Title);

      // Assert
      const symbols = symbolsOf(window);
      expect(symbols[symbols.length - 1]).toBe(window.backSymbol());
    });
  });

  describe('modeFor()', () =>
  {
    it('finds the mode a command symbol names', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const mode = window.modeFor('load');

      // Assert
      expect(mode.key()).toBe('load');
    });

    it('answers null for back, which is a scene handler rather than a mode', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const mode = window.modeFor(window.backSymbol());

      // Assert
      expect(mode).toBeNull();
    });
  });
  //endregion the commands themselves
});
//endregion plugins/_base/ext/save/windows/window-files-command.test.js