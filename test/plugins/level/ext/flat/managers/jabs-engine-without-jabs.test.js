//region plugins/level/ext/flat/managers/jabs-engine-without-jabs.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * This source file overwrites JABS's experience calculation with the flat-experience rules, and is
 * gated behind `if (J.ABS)` so it stays inert in a project running the flat-level system without
 * JABS. The overwrite itself is covered by the component suites; this covers that inert path.
 */
describe('JABS_Engine ext/flat augments without JABS installed', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();
  });

  it('leaves the experience calculation untouched', async () =>
  {
    // Arrange
    globalThis.J = {};

    function StubJABS_Engine()
    {
    }

    const original = () => 0;
    StubJABS_Engine.prototype.determineExperienceGained = original;
    globalThis.JABS_Engine = StubJABS_Engine;

    // Act
    await import('../../../../../../src/plugins/level/ext/flat/managers/JABS_Engine.js');

    // Assert
    // an overwrite rather than an alias- so leaving it alone means the original is still in place.
    expect(globalThis.JABS_Engine.prototype.determineExperienceGained).toBe(original);
  });
});
//endregion plugins/level/ext/flat/managers/jabs-engine-without-jabs.test.js
