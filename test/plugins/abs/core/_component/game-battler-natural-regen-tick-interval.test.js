//region plugins/abs/core/_component/game-battler-natural-regen-tick-interval.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with controllable tick-speed modifiers.
 * @param {number} flatModifier
 * @param {number} percentModifier
 * @returns {object}
 */
function buildBattler(flatModifier = 0, percentModifier = 0)
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.tickSpeedFlatModifier = () => flatModifier;
  battler.tickSpeedPercentModifier = () => percentModifier;
  return battler;
}

describe('J-ABS Game_Battler#getNaturalRegenTickInterval (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.J.ABS.Metadata.NaturalRegenTickType = 'natural';
  });

  it('resolves the interval from base/flat/percent modifiers, floored at the tunable minimum', () =>
  {
    // Arrange
    globalThis.J.ABS.Metadata.DefaultStateTickInterval = 300;
    globalThis.J.ABS.Metadata.MinimumStateTickInterval = 30;
    const battler = buildBattler(0, 0);

    // Act
    const result = battler.getNaturalRegenTickInterval();

    // Assert
    expect(result).toBe(300);
  });

  it('applies the flat modifier before the percent modifier', () =>
  {
    // Arrange
    globalThis.J.ABS.Metadata.DefaultStateTickInterval = 100;
    globalThis.J.ABS.Metadata.MinimumStateTickInterval = 1;
    const battler = buildBattler(100, 100);

    // Act
    const result = battler.getNaturalRegenTickInterval();

    // Assert- (100 + 100) / (1 + 100/100) = 100.
    expect(result).toBe(100);
  });

  it('never drops below the tunable floor', () =>
  {
    // Arrange
    globalThis.J.ABS.Metadata.DefaultStateTickInterval = 10;
    globalThis.J.ABS.Metadata.MinimumStateTickInterval = 30;
    const battler = buildBattler(0, 1000);

    // Act
    const result = battler.getNaturalRegenTickInterval();

    // Assert
    expect(result).toBe(30);
  });
});
//endregion plugins/abs/core/_component/game-battler-natural-regen-tick-interval.test.js
