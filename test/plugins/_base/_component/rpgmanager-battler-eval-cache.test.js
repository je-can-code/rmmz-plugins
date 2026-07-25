//region plugins/_base/_component/rpgmanager-battler-eval-cache.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('RPGManager battler-scoped eval cache', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // resolveHitTypeString() reads these off the bare Game_Action global- the shared placeholder has
    // no statics of its own, so give it the real values from project/js/rmmz_objects.js directly.
    globalThis.Game_Action.HITTYPE_CERTAIN = 0;
    globalThis.Game_Action.HITTYPE_PHYSICAL = 1;
    globalThis.Game_Action.HITTYPE_MAGICAL = 2;

    // getOnChanceEffectsFromDatabaseObject() instantiates JABS_OnChanceEffect, which lives in JABS, not J-Base.
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up globalThis.J, J.BASE.Aliased maps, and the String.empty/Array.empty
    // sentinel augmentations relied on elsewhere in this codebase.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // the file under test- a pure class with real imports, no prototype patching involved.
    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
    globalThis.$gameVariables._data = [];
  });

  const skill = { note: '<x:a.atk * 0.5>' };
  const structure = /<x:([^>]+)>/i;

  it('does not collide two different battlers sharing the same database object', () =>
  {
    // Arrange
    const battlerA = { atk: 200, getLevel: () => 10 };
    const battlerB = { atk: 40, getLevel: () => 10 };

    // Act
    const resultA = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battlerA);
    const resultB = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battlerB);

    // Assert
    expect(resultA).toBe(100);
    expect(resultB).toBe(20);
  });

  it('recomputes for a battler once invalidateBattlerEval() drops its cache entry', () =>
  {
    // Arrange
    const battler = { atk: 100, getLevel: () => 10 };
    const before = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);
    battler.atk = 300;
    RPGManager.invalidateBattlerEval(battler);

    // Act
    const after = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);

    // Assert
    expect(before).toBe(50);
    expect(after).toBe(150);
  });

  it('keeps returning the cached value for a battler when no invalidation occurs (caching-is-correct)', () =>
  {
    // Arrange
    const battler = { atk: 100, getLevel: () => 10 };
    const before = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);
    battler.atk = 300;

    // Act
    const after = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);

    // Assert
    expect(before).toBe(50);
    expect(after).toBe(50);
  });

  it('recomputes cleanly after a level change is bussed through invalidateBattlerEval(), not from a level-keyed entry', () =>
  {
    // Arrange
    const battler = { atk: 100, getLevel: () => 10 };
    const before = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);
    battler.getLevel = () => 20;
    RPGManager.invalidateBattlerEval(battler);

    // Act
    const after = RPGManager.getResultFromNoteByRegex(skill, structure, 0, battler);

    // Assert
    expect(before).toBe(50);
    expect(after).toBe(50);
  });
});
//endregion plugins/_base/_component/rpgmanager-battler-eval-cache.test.js
