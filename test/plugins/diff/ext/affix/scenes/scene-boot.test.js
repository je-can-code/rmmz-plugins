//region plugins/diff/ext/affix/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Grant validation has exactly one workable call site and this is it. Earlier and `$dataStates` does
 * not exist yet, so no grant could be told which slot it belongs to; later and a broken grant on a
 * layer nobody enables would never be checked at all. What matters in these tests is therefore not
 * just that validation happens, but that it happens after the original hook has run.
 */
describe('Scene_Boot grant validation (direct src import)', () =>
{
  let callOrder;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      DIFFICULTY: { EXT: { AFFIX: { Aliased: { Scene_Boot: new Map() } } } },
    };

    globalThis.Scene_Boot = function Scene_Boot()
    {
    };

    globalThis.Scene_Boot.prototype.onDatabaseLoaded = function()
    {
      callOrder.push('original');
    };

    await import('../../../../../../src/plugins/diff/ext/affix/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    callOrder = [];

    globalThis.J.DIFFICULTY.EXT.AFFIX.Metadata = {
      assertGrantsAreValid: () => callOrder.push('validate'),
    };
  });

  it('validates the configured grants once the database has loaded', () =>
  {
    // Arrange
    const sceneBoot = new globalThis.Scene_Boot();

    // Act
    sceneBoot.onDatabaseLoaded();

    // Assert
    expect(callOrder).toContain('validate');
  });

  it('validates only after the original hook has finished', () =>
  {
    // Arrange- the original hook is where the database finishes hydrating, and a grant's slot is
    // read off a hydrated row. Running first would inspect plain JSON with no slot tags on it.
    const sceneBoot = new globalThis.Scene_Boot();

    // Act
    sceneBoot.onDatabaseLoaded();

    // Assert
    expect(callOrder).toEqual([ 'original', 'validate' ]);
  });

  it('lets a validation failure escape rather than swallowing it', () =>
  {
    // Arrange- a grant that quietly does nothing is indistinguishable from bad luck, which is a
    // miserable thing to have to diagnose from inside a playthrough.
    globalThis.J.DIFFICULTY.EXT.AFFIX.Metadata.assertGrantsAreValid = () =>
    {
      throw new Error('a bad grant');
    };
    const sceneBoot = new globalThis.Scene_Boot();

    // Act & Assert
    expect(() => sceneBoot.onDatabaseLoaded())
      .toThrow(/a bad grant/);
  });
});
//endregion plugins/diff/ext/affix/scenes/scene-boot.test.js