//region plugins/level/level-scaling.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster LevelScaling (direct src import)', () =>
{
  let LevelScaling;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../src/plugins/level/core/_metadata/initialization.js');

    // patches globalThis.Game_System.prototype directly, no vm involved.
    await import('../../../src/plugins/level/core/objects/Game_System.js');

    ({ default: LevelScaling } = await import('../../../src/plugins/level/core/managers/LevelScaling.js'));
  });

  it('returns 1 inside the invariant band for default metadata', () =>
  {
    // Arrange & Act
    const result = LevelScaling.calculate(1);

    // Assert
    expect(result).toBe(1);
  });

  it('clamps upward growth to the configured maximum multiplier', () =>
  {
    // Arrange & Act
    const result = LevelScaling.calculate(20);

    // Assert
    expect(result).toBe(2);
  });

  it('clamps large negative level differences to the minimum multiplier', () =>
  {
    // Arrange & Act
    const result = LevelScaling.calculate(-30);

    // Assert
    expect(result).toBe(0.1);
  });

  it('returns 1 when scaling is disabled on the game system', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.disableLevelScaling();

    // Act
    const result = LevelScaling.multiplier(10, 10);

    // Assert
    expect(result).toBe(1);
  });

  it('applies a multiplier greater than 1 when scaling is enabled and the level gap favors it', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.enableLevelScaling();

    // Act
    const result = LevelScaling.multiplier(20, 10);

    // Assert
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThanOrEqual(2);
  });

  it('returns 1 when the subject level is zero (non-level battler)', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.enableLevelScaling();

    // Act
    const result = LevelScaling.multiplier(0, 10);

    // Assert
    expect(result).toBe(1);
  });

  it('returns 1 when the target level is zero (non-level battler)', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.enableLevelScaling();

    // Act
    const result = LevelScaling.multiplier(10, 0);

    // Assert
    expect(result).toBe(1);
  });

  it('uses the reward clamp profile when scope is REWARD, distinct from COMBAT scope', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.enableLevelScaling();
    globalThis.J.LEVEL.Metadata.rewardMaximumMultiplier = 1.5;

    // Act
    const combatMul = LevelScaling.multiplier(20, 10, LevelScaling.Scope.COMBAT);
    const rewardMul = LevelScaling.multiplier(20, 10, LevelScaling.Scope.REWARD);

    // Assert
    expect(combatMul).toBe(1.9);
    expect(rewardMul).toBe(1.5);
  });
});
//endregion plugins/level/level-scaling.test.js
