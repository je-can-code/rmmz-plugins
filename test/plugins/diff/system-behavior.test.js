//region plugins/diff/system-behavior.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VITEST_DIFF_KEY, VITEST_HARD_KEY } from './fixtures/diff-config-json.js';
import { loadDiffPluginVm } from './diff-vm.js';

describe('J-Difficulty runtime merge and battler hooks (out/diff/J-Difficulty.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDiffPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  function bootstrapDifficultyRuntime()
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();
    sandbox.$gameTemp = new sandbox.Game_Temp();
    sandbox.$gameTemp.initMembers();
    sandbox.$gameTemp.setupDifficultySystem();
  }

  it('merges all enabled layers into actor b-parameter rates', () =>
  {
    bootstrapDifficultyRuntime();

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor.param(0)).toBe(40);
  });

  it('merges enabled layers into actor sparam rates', () =>
  {
    bootstrapDifficultyRuntime();

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor.sparam(1)).toBe(80);
  });

  it('applies only the hard layer after disabling the softer config', () =>
  {
    bootstrapDifficultyRuntime();

    const cfg = sandbox.$gameSystem.getDifficultyConfigByKey(VITEST_DIFF_KEY);
    cfg.enabled = false;
    sandbox.$gameTemp.refreshAppliedDifficulty();

    const actor = new sandbox.Game_Actor();
    actor.initMembers();

    expect(actor.param(0)).toBe(50);
  });

  it('scales enemy param, exp, and gold from merged effects and rewards', () =>
  {
    bootstrapDifficultyRuntime();

    const enemy = new sandbox.Game_Enemy();
    enemy.initMembers();

    expect(enemy.param(0)).toBe(50);
    expect(enemy.exp()).toBe(25);
    expect(enemy.gold()).toBe(50);
  });

  it('scales map encounter step from merged encounter reward rates', () =>
  {
    bootstrapDifficultyRuntime();

    const map = new sandbox.Game_Map();

    expect(sandbox.Game_Map.prototype.encounterStep.call(map)).toBe(60);
  });

  it('lists registered difficulty layers through DifficultyManager', () =>
  {
    bootstrapDifficultyRuntime();

    const keys = sandbox.DifficultyManager.allDifficulties()
      .map(layer => layer.key)
      .sort();

    expect(keys).toContain(VITEST_DIFF_KEY);
    expect(keys).toContain(VITEST_HARD_KEY);
  });
});
//endregion plugins/diff/system-behavior.test.js
