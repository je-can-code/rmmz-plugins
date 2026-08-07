//region plugins/apt/core/_models/jabs-battler-without-jabs.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * What this file does when J-ABS is not installed, which is nothing at all.
 *
 * The whole module body sits behind a namespace check because J-ABS is genuinely optional: aptitude
 * points are earned from defeating enemies, and without JABS there is no map combat to earn them
 * from. The check is the sanctioned one-line form for an honestly-optional sibling, and this is the
 * side of it a project with JABS installed never exercises.
 *
 * It lives in its own file because the namespace has to be absent at import time, and the sibling
 * suite establishes the opposite for its whole run.
 */
describe('JABS_Engine ext/apt-core augments without J-ABS', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { APT: { Aliased: { JABS_Engine: new Map() } } };

    vi.doMock('../../../../../src/plugins/apt/core/managers/ApManager.js', () => ({
      default: { gainAp: vi.fn() },
    }));

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.gainBasicRewards = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    await import('../../../../../src/plugins/apt/core/_models/JABS_Battler.js');
  });

  it('patches nothing onto JABS_Engine when JABS is absent', () =>
  {
    // Arrange
    // Act
    const aliased = globalThis.J.APT.Aliased.JABS_Engine;

    // Assert: an empty alias map means the module declined to wrap anything, which is what keeps a
    // JABS-less project from carrying a reward hook for combat it never has.
    expect(aliased.size)
      .toBe(0);
  });

  it('leaves the engine\'s own reward path untouched', () =>
  {
    // Arrange
    const engine = new globalThis.JABS_Engine();

    // Act
    engine.gainBasicRewards({}, {});

    // Assert
    expect(engine.determineApGained)
      .toBeUndefined();
  });
});
//endregion plugins/apt/core/_models/jabs-battler-without-jabs.test.js