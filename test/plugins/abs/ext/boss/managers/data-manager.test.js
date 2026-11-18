//region plugins/abs/ext/boss/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a boss fight is forgotten between games.
 *
 * The boss manager is static, so a fight outlives the game it was fought in. A new game and a loaded save are the
 * two ways one game gives way to another, and neither passes through anything the fight itself is watching, so each
 * has to tell the manager to forget- and still do everything the engine's own version does, or the game it starts
 * is missing whatever that version built.
 */
describe('J-ABS-Boss DataManager', () =>
{
  /**
   * The engine's new-game setup this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalSetupNewGame;

  /**
   * The engine's save application this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalExtractSaveContents;

  /**
   * The manager the aliases tell to forget.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()` starts a new
   * module registry, and a statically hoisted import would resolve to the instance from the previous one - a
   * different object than the patch itself ended up holding.
   * @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default}
   */
  let JabsBossManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalSetupNewGame = vi.fn();
    originalExtractSaveContents = vi.fn();

    globalThis.DataManager = {
      setupNewGame: originalSetupNewGame,
      extractSaveContents: originalExtractSaveContents,
    };

    globalThis.J = { ABS: { EXT: { BOSS: { Aliased: { DataManager: new Map() } } } } };

    ({ default: JabsBossManager } = await import(
      '../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));

    await import('../../../../../../src/plugins/abs/ext/boss/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalSetupNewGame.mockClear();
    originalExtractSaveContents.mockClear();
  });

  describe('setupNewGame()', () =>
  {
    it('forgets any fight the last game was in the middle of', () =>
    {
      // Arrange
      const discardEncounter = vi.spyOn(JabsBossManager, 'discardEncounter')
        .mockImplementation(() => {});

      // Act
      DataManager.setupNewGame();

      // Assert
      expect(discardEncounter)
        .toHaveBeenCalledTimes(1);
    });

    it('still sets up the new game, rather than replacing it', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'discardEncounter')
        .mockImplementation(() => {});

      // Act
      DataManager.setupNewGame();

      // Assert
      expect(originalSetupNewGame)
        .toHaveBeenCalledTimes(1);
    });
  });

  describe('extractSaveContents()', () =>
  {
    it('forgets any fight the game being left behind was in the middle of', () =>
    {
      // Arrange
      const discardEncounter = vi.spyOn(JabsBossManager, 'discardEncounter')
        .mockImplementation(() => {});

      // Act
      DataManager.extractSaveContents({});

      // Assert
      expect(discardEncounter)
        .toHaveBeenCalledTimes(1);
    });

    it('still applies the save, handing it the very contents it was given', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'discardEncounter')
        .mockImplementation(() => {});
      const contents = { system: {}, map: {} };

      // Act
      DataManager.extractSaveContents(contents);

      // Assert- the same object, not merely an equal one, or the save is applied from a copy.
      expect(originalExtractSaveContents)
        .toHaveBeenCalledTimes(1);
      expect(originalExtractSaveContents.mock.calls[0][0])
        .toBe(contents);
    });
  });
});
//endregion plugins/abs/ext/boss/managers/data-manager.test.js