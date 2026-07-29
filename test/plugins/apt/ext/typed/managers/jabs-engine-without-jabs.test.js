//region plugins/apt/ext/typed/managers/jabs-engine-without-jabs.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The whole of this source file sits behind an `if (J.ABS)` gate. Its contents are exercised by the
 * sibling suite with JABS present; this covers the other side of that gate, where typed aptitude is
 * installed in a project that does not run JABS at all and must simply attach nothing.
 */
describe('JABS_Engine ext/typed augments without JABS installed', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();
  });

  it('attaches no aptitude reward extension', async () =>
  {
    // Arrange
    globalThis.J = { APT: { EXT: { TYPED: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABS_Engine()
    {
    }

    globalThis.JABS_Engine = StubJABS_Engine;

    // Act
    await import('../../../../../../src/plugins/apt/ext/typed/managers/JABS_Engine.js');

    // Assert
    expect(globalThis.JABS_Engine.prototype.gainAptitudeReward).toBeUndefined();
  });

  it('captures no aliased original', async () =>
  {
    // Arrange
    globalThis.J = { APT: { EXT: { TYPED: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABS_Engine()
    {
    }

    globalThis.JABS_Engine = StubJABS_Engine;

    // Act
    await import('../../../../../../src/plugins/apt/ext/typed/managers/JABS_Engine.js');

    // Assert
    // nothing was wrapped, so nothing should have been stashed to call through to.
    expect(globalThis.J.APT.EXT.TYPED.Aliased.JABS_Engine.size).toBe(0);
  });
});
//endregion plugins/apt/ext/typed/managers/jabs-engine-without-jabs.test.js
