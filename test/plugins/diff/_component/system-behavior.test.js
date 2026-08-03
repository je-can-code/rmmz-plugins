//region plugins/diff/_component/system-behavior.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { VITEST_DIFF_KEY, VITEST_HARD_KEY } from './fixtures/diff-config-json.js';
import { installDiffHostGlobals, setPluginContextToJBase, setPluginContextToJDiff } from './fixtures/install-diff-host-globals.js';

describe('J-Difficulty runtime merge and battler hooks (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../src/plugins/diff/core/_metadata/initialization.js');

    // patches globalThis.Game_System/Game_Temp/Game_Actor/Game_Enemy/Game_Map prototypes directly.
    await import('../../../../src/plugins/diff/core/objects/Game_System.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Temp.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Enemy.js');
    await import('../../../../src/plugins/diff/core/objects/Game_Map.js');

    ({ default: globalThis.DifficultyManager } = await import('../../../../src/plugins/diff/core/managers/DifficultyManager.js'));
  });

  function bootstrapDifficultyRuntime()
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameTemp.initMembers();
    globalThis.$gameTemp.setupDifficultySystem();
  }

  it('merges all enabled layers into actor b-parameter rates', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const result = actor.param(0);

    // Assert
    expect(result).toBe(40);
  });

  it('merges enabled layers into actor sparam rates', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const result = actor.sparam(1);

    // Assert
    expect(result).toBe(80);
  });

  it('applies only the hard layer after disabling the softer config', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    const cfg = globalThis.$gameSystem.getDifficultyConfigByKey(VITEST_DIFF_KEY);
    cfg.enabled = false;
    globalThis.$gameTemp.refreshAppliedDifficulty();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const result = actor.param(0);

    // Assert
    expect(result).toBe(50);
  });

  it('scales enemy param, exp, and gold from merged effects and rewards', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act & Assert
    expect(enemy.param(0)).toBe(50);
    expect(enemy.exp()).toBe(25);
    expect(enemy.gold()).toBe(50);
  });

  it('scales map encounter step from merged encounter reward rates', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    const map = new globalThis.Game_Map();

    // Act
    const result = globalThis.Game_Map.prototype.encounterStep.call(map);

    // Assert
    expect(result).toBe(60);
  });

  it('lists registered difficulty layers through DifficultyManager', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();

    // Act
    const keys = globalThis.DifficultyManager.allDifficulties()
      .map(layer => layer.key)
      .sort();

    // Assert
    expect(keys).toContain(VITEST_DIFF_KEY);
    expect(keys).toContain(VITEST_HARD_KEY);
  });
});
//endregion plugins/diff/_component/system-behavior.test.js
