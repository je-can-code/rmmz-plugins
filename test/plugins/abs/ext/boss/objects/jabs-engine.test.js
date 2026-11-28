//region plugins/abs/ext/boss/objects/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a boss refuses to be shoved, or dragged.
 *
 * Every participant of a running boss fight resists knockback outright- and a pull is knockback aimed back toward
 * the caster, read through the same resistance- while the engine's own resolution still decides for everyone
 * else. Both halves are worth pinning: a boss knocked or pulled into a doorway wedges there, and an alias that
 * swallowed the engine's answer would leave every other battler in the game unmovable.
 */
describe('J-ABS-Boss JABS_Engine', () =>
{
  /**
   * The engine's own resistance resolution this ship aliases, kept so the alias chain can be shown to reach it.
   * @type {Function}
   */
  let originalResolve;

  /**
   * The engine's own handling of a defeated enemy this ship aliases, recording the order things happen in.
   * @type {Function}
   */
  let originalDefeated;

  /**
   * Everything the defeat alias set in motion, in order.
   * @type {string[]}
   */
  const calls = [];

  /**
   * The manager the alias asks.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()` starts a new
   * module registry, and a statically hoisted import would resolve to the instance from the previous one.
   * @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default}
   */
  let JabsBossManager;

  const ENGINE_RESIST = 30;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalResolve = vi.fn(() => ENGINE_RESIST);
    originalDefeated = vi.fn(() => calls.push('engine'));

    globalThis.JABS_Engine = function() {};
    globalThis.JABS_Engine.FullKnockbackResist = 100;
    globalThis.JABS_Engine.prototype.resolveKnockbackResist = originalResolve;
    globalThis.JABS_Engine.prototype.handleDefeatedEnemy = originalDefeated;

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

  describe('resolveKnockbackResist()', () =>
  {
    it('gives a participant of the boss fight full resistance, refusing every push and pull', () =>
    {
      // Arrange
      vi.spyOn(JabsBossManager, 'isParticipant')
        .mockReturnValue(true);
      const engine = new globalThis.JABS_Engine();

      // Act
      const resist = engine.resolveKnockbackResist({ target: true });

      // Assert: full resistance, and the engine's own resolution never consulted.
      expect(resist)
        .toBe(100);
      expect(originalResolve)
        .not.toHaveBeenCalled();
    });

    it('leaves everyone else to the engine\'s own resistance, handing it the same target', () =>
    {
      // Arrange
      const isParticipant = vi.spyOn(JabsBossManager, 'isParticipant')
        .mockReturnValue(false);
      const engine = new globalThis.JABS_Engine();
      const target = { target: true };

      // Act
      const resist = engine.resolveKnockbackResist(target);

      // Assert
      expect(isParticipant)
        .toHaveBeenCalledWith(target);
      expect(originalResolve)
        .toHaveBeenCalledWith(target);
      expect(resist)
        .toBe(ENGINE_RESIST);
    });
  });

  describe('handleDefeatedEnemy()', () =>
  {
    it('lets the engine handle the defeat first, then tells the boss fight an enemy fell', () =>
    {
      // Arrange
      calls.length = 0;
      originalDefeated.mockClear();
      const onEnemyDefeated = vi.spyOn(JabsBossManager, 'onEnemyDefeated')
        .mockImplementation(() => calls.push('fight'));
      const engine = new globalThis.JABS_Engine();
      const defeated = { defeated: true };
      const caster = { caster: true };

      // Act
      engine.handleDefeatedEnemy(defeated, caster);

      // Assert: the engine got the same enemy and caster, and the fight heard of it after the engine was done.
      expect(originalDefeated)
        .toHaveBeenCalledWith(defeated, caster);
      expect(onEnemyDefeated)
        .toHaveBeenCalledTimes(1);
      expect(calls)
        .toEqual([ 'engine', 'fight' ]);
    });
  });
});
//endregion plugins/abs/ext/boss/objects/jabs-engine.test.js