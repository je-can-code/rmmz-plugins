//region plugins/level/_component/level-scaling.test.js
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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    // patches globalThis.Game_System.prototype directly, no vm involved.
    await import('../../../../src/plugins/level/core/objects/Game_System.js');

    ({ default: LevelScaling } = await import('../../../../src/plugins/level/core/managers/LevelScaling.js'));
  });

  it('returns 1 inside the invariant band for default metadata', () =>
  {
    // Arrange & Act
    const result = LevelScaling.calculate(1);

    // Assert
    expect(result).toBe(1);
  });

  it('treats parity as the centre of the invariant band rather than a scaled difference', () =>
  {
    // Arrange & Act- a difference of zero is the one value the surrounding cases cannot cover, and
    // it is the value a band read against a positive lower bound falls straight through.
    const result = LevelScaling.calculate(0);

    // Assert- combatants of equal level deal exactly their damage, with no bonus in either direction.
    expect(result).toBe(1);
  });

  it('stays inside the band one level below parity, as it does one level above', () =>
  {
    // Arrange & Act- the band is a magnitude measured outward from parity in both directions, so its
    // lower edge has to be reachable from the negative side.
    const result = LevelScaling.calculate(-1);

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

  it('walks the curve downward for a modest negative level difference', () =>
  {
    // Arrange & Act- a difference of -30 lands on the minimum clamp, where the negative and positive
    // arms of the invariance offset produce the identical floor. -5 stays off the clamp entirely, so
    // which arm ran is actually observable in the result.
    const result = LevelScaling.calculate(-5);

    // Assert
    expect(result).toBe(0.6);
  });

  it('returns the baseline for a difference sitting inside a widened invariance band', () =>
  {
    // Arrange- the shipped band is a single point, where the curve happens to also produce the
    // baseline. Widening it puts a difference genuinely inside the band whose curve value differs.
    const originalUpper = globalThis.J.LEVEL.Metadata.invariantUpperRange;
    const originalLower = globalThis.J.LEVEL.Metadata.invariantLowerRange;
    globalThis.J.LEVEL.Metadata.invariantUpperRange = 3;
    globalThis.J.LEVEL.Metadata.invariantLowerRange = 1;

    // Act
    const inBand = LevelScaling.calculate(2);
    const outOfBand = LevelScaling.calculate(4);

    // restore the shared metadata singleton before asserting so a failure cannot leak the widened
    // band into every later test in this file.
    globalThis.J.LEVEL.Metadata.invariantUpperRange = originalUpper;
    globalThis.J.LEVEL.Metadata.invariantLowerRange = originalLower;

    // Assert- the baseline is also this plugin's "nothing happened" value, so the out-of-band value
    // anchors the claim: 1.1 is only reachable when the widened band actually took effect.
    expect(inBand).toBe(1);
    expect(outOfBand).toBe(1.1);
  });

  it('returns 1 when scaling is disabled on the game system', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameSystem.disableLevelScaling();

    // Act- the gap has to be one the enabled path scales, or the disabled path cannot be told apart
    // from it. at parity the curve also returns the baseline, so a ten-level gap is what makes the
    // disabled short-circuit observable: enabled, this same call returns 1.9.
    const result = LevelScaling.multiplier(20, 10);

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
//endregion plugins/level/_component/level-scaling.test.js
