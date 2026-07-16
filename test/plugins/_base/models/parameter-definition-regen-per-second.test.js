//region plugins/_base/models/parameter-definition-regen-per-second.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ParameterDefinition#prettyValue REGEN_PER_SECOND (direct src import)', () =>
{
  let ParameterDefinition;
  let ParameterFormat;
  let ParameterDisplayPolicy;

  beforeAll(async () =>
  {
    ({ default: ParameterFormat } = await import('../../../../src/plugins/_base/core/ParameterFormat.js'));
    ({ default: ParameterDisplayPolicy } = await import('../../../../src/plugins/_base/core/ParameterDisplayPolicy.js'));
    ({ default: ParameterDefinition } = await import('../../../../src/plugins/_base/models/ParameterDefinition.js'));
  });

  /**
   * Builds a minimal REGEN_PER_SECOND definition- the fields prettyValue itself doesn't
   * consult (label/description/icon/color/getValue/sdpBinding) are stubbed as no-ops.
   */
  function buildRegenDefinition()
  {
    return new ParameterDefinition(
      'hrg',
      'vitality',
      0,
      () => 'HP Regen',
      () => [],
      () => 0,
      () => 0,
      ParameterFormat.REGEN_PER_SECOND,
      ParameterDisplayPolicy.NONE,
      () => 0,
      null,
    );
  }

  it('converts the per-tick native amount using the actor\'s actual tick interval, not a fixed divisor', () =>
  {
    // Arrange- hrg 0.17 -> native 17 (per tick); actor resolves to 60 frames/tick (1 tick/sec).
    const definition = buildRegenDefinition();
    const actor = { getNaturalRegenTickInterval: () => 60 };

    // Act
    const result = definition.prettyValue(0.17, false, actor);

    // Assert- 1 tick/sec means per-tick and per-second are numerically identical.
    expect(result).toBe('17.0/s');
  });

  it('scales the per-second conversion when the actor ticks faster than the 60-frame baseline', () =>
  {
    // Arrange- same native 17 per-tick amount, but this actor ticks twice as fast (30 frames/tick).
    const definition = buildRegenDefinition();
    const actor = { getNaturalRegenTickInterval: () => 30 };

    // Act
    const result = definition.prettyValue(0.17, false, actor);

    // Assert- 2 ticks/sec doubles the per-second total versus the 1 tick/sec baseline.
    expect(result).toBe('34.0/s');
  });

  it('falls back to a neutral 1 tick/sec assumption when no actor is provided', () =>
  {
    // Arrange
    const definition = buildRegenDefinition();

    // Act
    const result = definition.prettyValue(0.17, false);

    // Assert
    expect(result).toBe('17.0/s');
  });

  it('falls back to a neutral 1 tick/sec assumption when the actor has no tick-interval resolver', () =>
  {
    // Arrange- e.g. J-ABS isn't loaded, so Game_Battler never got the method patched on.
    const definition = buildRegenDefinition();
    const actor = {};

    // Act
    const result = definition.prettyValue(0.17, false, actor);

    // Assert
    expect(result).toBe('17.0/s');
  });
});
//endregion plugins/_base/models/parameter-definition-regen-per-second.test.js
