//region plugins/hud/ext/boss/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where the boss frame is stood down between games.
 *
 * The boss frame manager is static, so a frame outlives the game it was shown in. A new game and a loaded save are the
 * two ways one game gives way to another, so each has to stand the frame down- and still do everything the engine's
 * own version does, or the game it starts is missing whatever that version built.
 */
describe('J-HUD-Boss DataManager', () =>
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
   * The manager the aliases tell to stand the frame down.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()` starts a new
   * module registry, and a statically hoisted import would resolve to the instance from the previous one - a
   * different object than the patch itself ended up holding.
   * @type {typeof import('../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js').default}
   */
  let BossFrameManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalSetupNewGame = vi.fn();
    originalExtractSaveContents = vi.fn();

    globalThis.DataManager = {
      setupNewGame: originalSetupNewGame,
      extractSaveContents: originalExtractSaveContents,
    };

    globalThis.J = { HUD: { EXT: { BOSS: { Aliased: { DataManager: new Map() } } } } };

    ({ default: BossFrameManager } = await import(
      '../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js'));

    await import('../../../../../../src/plugins/hud/ext/boss/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalSetupNewGame.mockClear();
    originalExtractSaveContents.mockClear();
  });

  describe('setupNewGame()', () =>
  {
    it('stands down any boss frame the last game left up', () =>
    {
      // Arrange
      const resetBossFrame = vi.spyOn(BossFrameManager, 'resetBossFrame')
        .mockImplementation(() => {});

      // Act
      DataManager.setupNewGame();

      // Assert
      expect(resetBossFrame)
        .toHaveBeenCalledTimes(1);
    });

    it('still sets up the new game, rather than replacing it', () =>
    {
      // Arrange
      vi.spyOn(BossFrameManager, 'resetBossFrame')
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
    it('stands down any boss frame the game being left behind had up', () =>
    {
      // Arrange
      const resetBossFrame = vi.spyOn(BossFrameManager, 'resetBossFrame')
        .mockImplementation(() => {});

      // Act
      DataManager.extractSaveContents({});

      // Assert
      expect(resetBossFrame)
        .toHaveBeenCalledTimes(1);
    });

    it('still applies the save, handing it the very contents it was given', () =>
    {
      // Arrange
      vi.spyOn(BossFrameManager, 'resetBossFrame')
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
//endregion plugins/hud/ext/boss/managers/data-manager.test.js