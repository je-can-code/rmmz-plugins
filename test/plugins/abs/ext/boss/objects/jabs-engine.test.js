//region plugins/abs/ext/boss/objects/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a boss refuses to be shoved.
 *
 * Every participant of a running boss fight is immune to knockback outright, and the engine's own resolution
 * still decides for everyone else. Both halves are worth pinning: a boss knocked into a doorway wedges there, and
 * an alias that swallowed the engine's answer would leave every other battler in the game unmovable.
 */
describe('J-ABS-Boss JABS_Engine', () =>
{
  /**
   * The engine's own resolution this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalResolve;

  /**
   * The manager the alias asks.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()` starts a new
   * module registry, and a statically hoisted import would resolve to the instance from the previous one.
   * @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default}
   */
  let JabsBossManager;

  const ENGINE_DISTANCE = 3;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalResolve = vi.fn(() => ENGINE_DISTANCE);

    globalThis.JABS_Engine = function() {};
    globalThis.JABS_Engine.prototype.resolveKnockbackDistance = originalResolve;

    globalThis.J = { ABS: { EXT: { BOSS: { Aliased: { JABS_Engine: new Map() } } } } };

    ({ default: JabsBossManager } = await import(
      '../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));

    await import('../../../../../../src/plugins/abs/ext/boss/objects/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
    originalResolve.mockClear();
  });

  describe('resolveKnockbackDistance()', () =>
  {
    it('refuses to move a participant of the boss fight at all', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'isParticipant')
        .mockReturnValue(true);
      const engine = new globalThis.JABS_Engine();

      // Act
      const distance = engine.resolveKnockbackDistance({ action: true }, { target: true });

      // Assert: no distance at all rather than zero, and the engine's own resolution never consulted.
      expect(distance)
        .toBeNull();
      expect(originalResolve)
        .not.toHaveBeenCalled();
    });

    it('leaves everyone else to the engine\'s own knockback, handing it the same action and target', () =>
    {
      // Arrange
      const isParticipant = vi.spyOn(JabsBossManager, 'isParticipant')
        .mockReturnValue(false);
      const engine = new globalThis.JABS_Engine();
      const action = { action: true };
      const target = { target: true };

      // Act
      const distance = engine.resolveKnockbackDistance(action, target);

      // Assert
      expect(isParticipant)
        .toHaveBeenCalledWith(target);
      expect(originalResolve)
        .toHaveBeenCalledWith(action, target);
      expect(distance)
        .toBe(ENGINE_DISTANCE);
    });
  });
});
//endregion plugins/abs/ext/boss/objects/jabs-engine.test.js