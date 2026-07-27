//region plugins/level/ext/sync/managers/_component/jabs-engine.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine level/ext/sync augments (direct src import)', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();
    delete globalThis.JABS_Engine;
    delete globalThis.J;
  });

  it('does not patch determineExperienceGained when the sync extension is not loaded', async () =>
  {
    // Arrange
    const original = vi.fn();

    function StubJabsEngine()
    {
    }

    StubJabsEngine.prototype.determineExperienceGained = original;
    globalThis.JABS_Engine = StubJabsEngine;
    globalThis.J = {}; // J.ABS/J.LEVEL absent.

    // Act
    await import('../../../../../../../src/plugins/level/ext/sync/managers/JABS_Engine.js');

    // Assert
    expect(globalThis.JABS_Engine.prototype.determineExperienceGained).toBe(original);
  });

  it('routes the actor through getLevelForExp() when the sync extension is loaded', async () =>
  {
    // Arrange
    const original = vi.fn()
      .mockImplementation((_defeatedEnemy, actorProxy) => actorProxy.level);

    function StubJabsEngine()
    {
    }

    StubJabsEngine.prototype.determineExperienceGained = original;
    globalThis.JABS_Engine = StubJabsEngine;
    globalThis.J = { ABS: true, LEVEL: { EXT: { FLAT: true, SYNC: { Aliased: { JABS_Engine: new Map() } } } } };

    await import('../../../../../../../src/plugins/level/ext/sync/managers/JABS_Engine.js');

    const engine = new globalThis.JABS_Engine();
    const defeatedEnemy = {};
    const victoriousActor = { level: 50, getLevelForExp: vi.fn().mockReturnValue(12) };

    // Act
    const result = engine.determineExperienceGained(defeatedEnemy, victoriousActor);

    // Assert
    // the aliased original was called with a proxy whose `level` resolves through getLevelForExp(),
    // not the actor's own raw level.
    expect(result).toEqual(12);
    expect(victoriousActor.getLevelForExp).toHaveBeenCalled();
    expect(original).toHaveBeenCalledWith(defeatedEnemy, expect.any(Object));
  });
});
//endregion plugins/level/ext/sync/managers/_component/jabs-engine.test.js
