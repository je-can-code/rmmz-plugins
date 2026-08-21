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

  //region max hp floor
  /**
   * Replaces the applied difficulty with one whose every multiplier is zero.
   *
   * The engine floors max hp at one inside its own param call, and these overrides scale the result
   * afterward - which steps back over that clamp. A difficulty authored with a zero max hp
   * multiplier is the case that reaches it, and a battler with no maximum hp at all breaks every
   * hp-over-mhp ratio downstream: gauges divide by it, ai health gates compare against it.
   */
  function applyZeroedDifficulty()
  {
    const zeroedEffects = () => ({
      bparams: [ 0, 0, 0 ],
      sparams: [ 0, 0, 0 ],
      xparams: [ 0, 0, 0 ],
    });

    globalThis.$gameTemp.getAppliedDifficulty = () => ({
      actorEffects: zeroedEffects(),
      enemyEffects: zeroedEffects(),
      rewards: {
        exp: 0, gold: 0, sdp: 0, drops: 0,
      },
    });
  }

  it('floors an actor max hp at one when the difficulty scales it to nothing', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    applyZeroedDifficulty();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const maxHp = actor.param(0);

    // Assert
    expect(maxHp).toBe(1);
  });

  it('leaves an actor parameter other than max hp at zero', () =>
  {
    // Arrange: the floor is deliberately specific to max hp, matching the engine's own paramMin -
    // an attack stat of zero is a legitimate difficulty setting, not something to rescue. Without
    // this case the floor could be applied to every parameter and nothing would notice.
    bootstrapDifficultyRuntime();
    applyZeroedDifficulty();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const attack = actor.param(2);

    // Assert
    expect(attack).toBe(0);
  });

  it('floors an enemy max hp at one when the difficulty scales it to nothing', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    applyZeroedDifficulty();
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    const maxHp = enemy.param(0);

    // Assert
    expect(maxHp).toBe(1);
  });

  it('leaves an enemy parameter other than max hp at zero', () =>
  {
    // Arrange
    bootstrapDifficultyRuntime();
    applyZeroedDifficulty();
    const enemy = new globalThis.Game_Enemy();
    enemy.initMembers();

    // Act
    const attack = enemy.param(2);

    // Assert
    expect(attack).toBe(0);
  });
  //endregion max hp floor

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

  it('applies the default layer outright when the player has enabled nothing', () =>
  {
    // Arrange- a fresh game and a fully-cleared difficulty menu both land here, and merging an
    // empty set would otherwise produce a layer of neutral multipliers rather than the authored
    // default the whole game is balanced around.
    bootstrapDifficultyRuntime();
    globalThis.$gameSystem.getAllDifficultyConfigs()
      .forEach(config =>
      {
        config.enabled = false;
      });

    // Act
    const applied = globalThis.$gameTemp.buildAppliedDifficulty();

    // Assert
    expect(applied.key).toBe(VITEST_DIFF_KEY);
  });
});
//endregion plugins/diff/_component/system-behavior.test.js
