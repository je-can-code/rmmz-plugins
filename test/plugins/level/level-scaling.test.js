//region plugins/level/level-scaling.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster LevelScaling (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('returns 1 inside the invariant band for default metadata', () =>
  {
    expect(sandbox.LevelScaling.calculate(1)).toBe(1);
  });

  it('clamps upward growth to the configured maximum multiplier', () =>
  {
    expect(sandbox.LevelScaling.calculate(20)).toBe(2);
  });

  it('returns 1 when scaling is disabled on the game system', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();
    sandbox.$gameSystem.disableLevelScaling();
    expect(sandbox.LevelScaling.multiplier(10, 10)).toBe(1);
  });

  it('applies multiplier when scaling is enabled on the game system', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();
    sandbox.$gameSystem.enableLevelScaling();
    const m = sandbox.LevelScaling.multiplier(20, 10);
    expect(m).toBeGreaterThan(1);
    expect(m).toBeLessThanOrEqual(2);
  });

  it('returns 1 when either level input is zero (non-level battler)', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();
    sandbox.$gameSystem.enableLevelScaling();
    expect(sandbox.LevelScaling.multiplier(0, 10)).toBe(1);
    expect(sandbox.LevelScaling.multiplier(10, 0)).toBe(1);
  });

  it('clamps large negative level differences to the minimum multiplier', () =>
  {
    expect(sandbox.LevelScaling.calculate(-30)).toBe(0.1);
  });

  it('uses reward clamp profile when scope is REWARD', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();
    sandbox.$gameSystem.enableLevelScaling();
    sandbox.J.LEVEL.Metadata.rewardMaximumMultiplier = 1.5;
    const combatMul = sandbox.LevelScaling.multiplier(20, 10, sandbox.LevelScaling.Scope.COMBAT);
    const rewardMul = sandbox.LevelScaling.multiplier(20, 10, sandbox.LevelScaling.Scope.REWARD);
    expect(combatMul).toBe(1.9);
    expect(rewardMul).toBe(1.5);
  });
});
//endregion plugins/level/level-scaling.test.js
