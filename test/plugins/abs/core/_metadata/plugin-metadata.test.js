//region plugins/abs/core/_metadata/plugin-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

/**
 * Rebuilds J.ABS.Metadata from scratch against the given raw plugin parameter strings, mirroring
 * how the shipped runtime constructs it once at boot from whatever the plugin manager UI holds.
 * Only J-ABS's own initialization.js is re-imported- J-Base's patches real, non-configurable global
 * properties (e.g. Array.empty) and can only be imported once per test file.
 * @param {Record<string, string>} pluginParameterStrings
 * @returns {object} The freshly-built J.ABS.Metadata instance.
 */
async function buildAbsMetadata(pluginParameterStrings)
{
  vi.resetModules();

  // PluginMetadata tracks registered plugin names on a class-private static field, so re-running
  // J_AbsPluginMetadata's constructor against the same class object throws "duplicate plugin
  // entry" on the second call. Re-importing PluginMetadata fresh gives every call its own
  // never-registered class, since _pluginMetadata.js reads this bare global at class-declaration
  // time (evaluated fresh here too, thanks to the resetModules() above).
  ({ default: globalThis.PluginMetadata } = await import('../../../../../src/plugins/_base/core/models/PluginMetadata.js'));

  installPluginManagerWithParams(globalThis, 'J-ABS', pluginParameterStrings);
  setPluginContextToJAbs();
  await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');
  return globalThis.J.ABS.Metadata;
}

describe('J-ABS _pluginMetadata.js (direct src import, via initialization.js construction)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
  });

  it('falls back to the default AI update range and state-spread tick interval when their params are omitted', async () =>
  {
    // Act- an empty parameter set omits every optional override, including the two that every
    // other fixture in this suite always sets (maxAiUpdateRange, defaultStateSpreadTickInterval).
    const metadata = await buildAbsMetadata({});

    // Assert
    expect(metadata.MaxAiUpdateRange).toBe(20);
    expect(metadata.DefaultStateSpreadTickInterval).toBe(30);
  });

  it('applies valid overrides for parry, glancing-blow, and melee hitbox origin tuning', async () =>
  {
    // Act
    const metadata = await buildAbsMetadata({
      parryCharacterAnimationId: '99',
      implicitParryDominanceMultiplier: '3',
      implicitParryBaselineFloor: '60',
      implicitParryBaselinePerLevel: '0.5',
      implicitParryScaleFactor: '0.5',
      glancingBlowDominanceMultiplier: '3',
      glancingBlowDamageFactor: '0.5',
      hitboxMeleeOriginOffsetPxX: '5',
      hitboxMeleeOriginOffsetPxY: '-5',
      hitboxMeleeOriginExtraPxYFacingDown: '2',
      hitboxMeleeOriginExtraPxYFacingUp: '3',
      hitboxMeleeOriginLiftReductionPxFacingDown: '10',
      mapAfflictionMaxSlots: '12',
    });

    // Assert
    expect(metadata.ParryCharacterAnimationId).toBe(99);
    expect(metadata.ImplicitParryDominanceMultiplier).toBe(3);
    expect(metadata.ImplicitParryBaselineFloor).toBe(60);
    expect(metadata.ImplicitParryBaselinePerLevel).toBe(0.5);
    expect(metadata.ImplicitParryScaleFactor).toBe(0.5);
    expect(metadata.GlancingBlowDominanceMultiplier).toBe(3);
    expect(metadata.GlancingBlowDamageFactor).toBe(0.5);
    expect(metadata.HitboxMeleeOriginOffsetPxX).toBe(5);
    expect(metadata.HitboxMeleeOriginOffsetPxY).toBe(-5);
    expect(metadata.HitboxMeleeOriginExtraPxYFacingDown).toBe(2);
    expect(metadata.HitboxMeleeOriginExtraPxYFacingUp).toBe(3);
    expect(metadata.HitboxMeleeOriginLiftReductionPxFacingDown).toBe(10);
    expect(metadata.mapAfflictionMaxSlots).toBe(12);
  });

  it('clamps mapAfflictionMaxSlots to 16 even when the override exceeds it', async () =>
  {
    // Act
    const metadata = await buildAbsMetadata({ mapAfflictionMaxSlots: '999' });

    // Assert
    expect(metadata.mapAfflictionMaxSlots).toBe(16);
  });

  describe('globalCooldownSkillTypes parsing', () =>
  {
    it('parses a JSON array of skill type ids, ignoring non-numeric entries', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({ globalCooldownSkillTypes: '[1, "not-a-number", 2, 3]' });

      // Assert
      expect(metadata.GlobalCooldownSkillTypeSet).toEqual(new Set([ 1, 2, 3 ]));
    });

    it('parses a legacy comma-separated list of skill type ids', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({ globalCooldownSkillTypes: '1,2,3' });

      // Assert
      expect(metadata.GlobalCooldownSkillTypeSet).toEqual(new Set([ 1, 2, 3 ]));
    });

    it('warns and falls back to an empty set when the JSON array is malformed', async () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const metadata = await buildAbsMetadata({ globalCooldownSkillTypes: '[1, 2' });

      // Assert
      expect(metadata.GlobalCooldownSkillTypeSet).toEqual(new Set());
      expect(warnSpy).toHaveBeenCalledWith(
        'J-ABS: globalCooldownSkillTypes JSON parse failed.',
        expect.any(Error));

      // Cleanup
      warnSpy.mockRestore();
    });
  });

  describe('skillExecutionExcludedSkillTypes parsing', () =>
  {
    it('collects only the finite entries from a JSON array, ignoring non-numeric ones', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({ skillExecutionExcludedSkillTypes: '[4, "not-a-number", 5]' });

      // Assert
      expect(metadata.SkillExecutionExcludedSkillTypeSet).toEqual(new Set([ 4, 5 ]));
    });

    it('yields an empty set when the parsed JSON is not an array', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({ skillExecutionExcludedSkillTypes: '{}' });

      // Assert
      expect(metadata.SkillExecutionExcludedSkillTypeSet).toEqual(new Set());
    });

    it('warns and falls back to an empty set when the JSON is malformed', async () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const metadata = await buildAbsMetadata({ skillExecutionExcludedSkillTypes: '[4' });

      // Assert
      expect(metadata.SkillExecutionExcludedSkillTypeSet).toEqual(new Set());
      expect(warnSpy).toHaveBeenCalledWith(
        'J-ABS: skillExecutionExcludedSkillTypes JSON parse failed.',
        expect.any(Error));

      // Cleanup
      warnSpy.mockRestore();
    });
  });
});
//endregion plugins/abs/core/_metadata/plugin-metadata.test.js
