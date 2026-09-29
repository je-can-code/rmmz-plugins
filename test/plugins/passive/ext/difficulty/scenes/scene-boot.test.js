//region plugins/passive/ext/difficulty/scenes/scene-boot.test.js
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
  let FakeDifficultyAffixManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PASSIVE: { EXT: { AFFIX: {}, DIFFICULTY: { Aliased: { Scene_Boot: new Map() } } } },
    };

    globalThis.Scene_Boot = function Scene_Boot()
    {
    };

    globalThis.Scene_Boot.prototype.onDatabaseLoaded = function()
    {
      callOrder.push('original');
    };

    // the validation itself belongs to the manager, whose checks have their own suite.
    FakeDifficultyAffixManager = {};
    vi.doMock('../../../../../../src/plugins/passive/ext/difficulty/managers/DifficultyAffixManager.js',
      () => ({ default: FakeDifficultyAffixManager }));

    await import('../../../../../../src/plugins/passive/ext/difficulty/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    callOrder = [];

    FakeDifficultyAffixManager.assertGrantsAreValid = () => callOrder.push('validate');
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
    FakeDifficultyAffixManager.assertGrantsAreValid = () =>
    {
      throw new Error('a bad grant');
    };
    const sceneBoot = new globalThis.Scene_Boot();

    // Act & Assert
    expect(() => sceneBoot.onDatabaseLoaded())
      .toThrow(/a bad grant/);
  });
});

describe('Scene_Boot without J-Passive-Affix (direct src import)', () =>
{
  it('leaves the database-loaded hook untouched', async () =>
  {
    // Arrange- grants unlock J-Passive-Affix's reserved affixes; without it there is nothing to check.
    vi.resetModules();
    globalThis.J = { PASSIVE: { EXT: { DIFFICULTY: { Aliased: { Scene_Boot: new Map() } } } } };
    const onDatabaseLoaded = () => {};
    globalThis.Scene_Boot = function Scene_Boot()
    {
    };
    globalThis.Scene_Boot.prototype.onDatabaseLoaded = onDatabaseLoaded;

    // Act
    await import('../../../../../../src/plugins/passive/ext/difficulty/scenes/Scene_Boot.js');

    // Assert
    expect(globalThis.Scene_Boot.prototype.onDatabaseLoaded).toBe(onDatabaseLoaded);
  });
});
//endregion plugins/passive/ext/difficulty/scenes/scene-boot.test.js
