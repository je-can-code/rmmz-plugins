//region plugins/abs/ext/boss/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a boss encounter gets its heartbeat.
 *
 * The map update is the right home for this rather than a scene: an encounter is a property of the
 * world the battle happens in, and it must keep counting whether or not any particular scene is on
 * top of it. That is exactly what makes it worth a test - the alias has to run on every update,
 * including the ones where the map itself is inactive, or a routine's cadence quietly stalls
 * whenever a message window is open.
 */
describe('J-ABS-Boss Game_Map', () =>
{
  /**
   * The vanilla update this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalUpdate;

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

    globalThis.Game_Map = function() {};
    globalThis.Game_Map.prototype.update = originalUpdate;

    globalThis.J = { ABS: { EXT: { BOSS: { Aliased: { Game_Map: new Map() } } } } };

    ({ default: JabsBossManager } = await import(
      '../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));

    await import('../../../../../../src/plugins/abs/ext/boss/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalUpdate.mockClear();
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