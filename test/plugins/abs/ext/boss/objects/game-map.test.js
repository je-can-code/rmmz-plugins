//region plugins/abs/ext/boss/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a boss encounter gets its heartbeat, and where it ends when the party leaves its map.
 *
 * The map update is the right home for this rather than a scene: an encounter is a property of the
 * world the battle happens in, and it must keep counting whether or not any particular scene is on
 * top of it. That is exactly what makes it worth a test - the alias has to run on every update,
 * including the ones where the map itself is inactive, or a routine's cadence quietly stalls
 * whenever a message window is open. Setting up a map is the other end of the same idea: a fight
 * cannot outlive the map it was fought on, and it has to end only once the new one is in place.
 */
describe('J-ABS-Boss Game_Map', () =>
{
  /**
   * The map the tests set up: Grudj's courtyard, though any id would do.
   * @type {number}
   */
  const COURTYARD_MAP_ID = 444;

  /**
   * The vanilla update this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalUpdate;

  /**
   * The setup this ship aliases, kept so the alias chain can be shown to reach it, and to run first.
   * @type {Function}
   */
  let originalSetup;

  /**
   * The manager the alias advances.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()`
   * starts a new module registry, and a statically hoisted import would resolve to the instance from
   * the previous one - a different object than the patch itself ended up holding.
   * @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default}
   */
  let JabsBossManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalUpdate = vi.fn();
    originalSetup = vi.fn();

    globalThis.Game_Map = function() {};
    globalThis.Game_Map.prototype.update = originalUpdate;
    globalThis.Game_Map.prototype.setup = originalSetup;

    globalThis.J = { ABS: { EXT: { BOSS: { Aliased: { Game_Map: new Map() } } } } };

    ({ default: JabsBossManager } = await import(
      '../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));

    await import('../../../../../../src/plugins/abs/ext/boss/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalUpdate.mockClear();
    originalSetup.mockClear();
  });

  describe('setup()', () =>
  {
    it('ends whatever boss fight was running on the map being left', () =>
    {
      // Arrange
      const endEncounter = vi.spyOn(JabsBossManager, 'endEncounter')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert
      expect(endEncounter)
        .toHaveBeenCalledTimes(1);
    });

    it('ends the fight only once the new map is in place, so nothing of the old map\'s is erased', () =>
    {
      // Arrange
      const endEncounter = vi.spyOn(JabsBossManager, 'endEncounter')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert- the engine's own setup ran first.
      expect(originalSetup.mock.invocationCallOrder[0])
        .toBeLessThan(endEncounter.mock.invocationCallOrder[0]);
    });

    it('still sets the map up, handing it the map id untouched', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'endEncounter')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.setup(COURTYARD_MAP_ID);

      // Assert
      expect(originalSetup)
        .toHaveBeenCalledWith(COURTYARD_MAP_ID);
    });
  });

  describe('update()', () =>
  {
    it('advances whatever boss fight is currently running', () =>
    {
      // Arrange
      const update = vi.spyOn(JabsBossManager, 'update')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.update(true);

      // Assert
      expect(update)
        .toHaveBeenCalled();
    });

    it('still performs the engine\'s own update, rather than replacing it', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'update')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.update(true);

      // Assert
      expect(originalUpdate)
        .toHaveBeenCalled();
    });

    it('passes the scene-active flag through untouched', () =>
    {
      // Arrange: vanilla's update branches on this, so swallowing it would freeze map scrolling and
      // event movement while any window was open.
      vi.spyOn(JabsBossManager, 'update')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.update(false);

      // Assert
      expect(originalUpdate)
        .toHaveBeenCalledWith(false);
    });

    it('advances the encounter even while the map scene is inactive', () =>
    {
      // Arrange: a routine's cadence would otherwise stall for as long as a message window was up.
      const update = vi.spyOn(JabsBossManager, 'update')
        .mockImplementation(() => {});
      const map = new globalThis.Game_Map();

      // Act
      map.update(false);

      // Assert
      expect(update)
        .toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/boss/objects/game-map.test.js