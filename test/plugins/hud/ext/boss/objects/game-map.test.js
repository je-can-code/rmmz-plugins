//region plugins/hud/ext/boss/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where the boss frame is stood down when the party leaves a map.
 *
 * Whatever the frame was showing stood on the map being left, so the frame has to go with it- and only once the new
 * map is in place, with the engine's own setup still done in full.
 */
describe('J-HUD-Boss Game_Map', () =>
{
  /**
   * The map the tests set up: Grudj's courtyard, though any id would do.
   * @type {number}
   */
  const COURTYARD_MAP_ID = 444;

  /**
   * The setup this ship aliases, kept so the alias chain can be shown to reach it, and to run first.
   * @type {Function}
   */
  let originalSetup;

  /**
   * The manager the alias tells to stand the frame down.
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

    originalSetup = vi.fn();

    globalThis.Game_Map = function() {};
    globalThis.Game_Map.prototype.setup = originalSetup;

    globalThis.J = { HUD: { EXT: { BOSS: { Aliased: { Game_Map: new Map() } } } } };

    ({ default: BossFrameManager } = await import(
      '../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js'));

    await import('../../../../../../src/plugins/hud/ext/boss/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalSetup.mockClear();
  });

  describe('setup()', () =>
  {
    it('stands down any boss frame the map being left had up', () =>
    {
      // Arrange
      const resetBossFrame = vi.spyOn(BossFrameManager, 'resetBossFrame')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert
      expect(resetBossFrame)
        .toHaveBeenCalledTimes(1);
    });

    it('stands the frame down only once the new map is in place', () =>
    {
      // Arrange
      const resetBossFrame = vi.spyOn(BossFrameManager, 'resetBossFrame')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert- the engine's own setup ran first.
      expect(originalSetup.mock.invocationCallOrder[0])
        .toBeLessThan(resetBossFrame.mock.invocationCallOrder[0]);
    });

    it('still sets the map up, handing it the map id untouched', () =>
    {
      // Arrange
      vi.spyOn(BossFrameManager, 'resetBossFrame')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert
      expect(originalSetup)
        .toHaveBeenCalledWith(COURTYARD_MAP_ID);
    });
  });
});
//endregion plugins/hud/ext/boss/objects/game-map.test.js