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

  //region boolean plugin parameters
  /**
   * The plugin manager hands every parameter across as a string, so each of these fields is a
   * `=== 'true'` comparison against one. Both arms need a case: with only the omitted arm covered,
   * the comparison could be replaced by a constant `false` and nothing would notice, which would
   * silently pin every one of these settings off no matter what the author configured.
   */
  describe('boolean plugin parameters', () =>
  {
    const BOOLEAN_PARAMETERS = [
      [ 'defaultEnemyCanIdle', 'DefaultEnemyCanIdle' ],
      [ 'defaultEnemyShowHpBar', 'DefaultEnemyShowHpBar' ],
      [ 'defaultEnemyShowBattlerName', 'DefaultEnemyShowBattlerName' ],
      [ 'defaultEnemyIsInvincible', 'DefaultEnemyIsInvincible' ],
      [ 'defaultEnemyIsInanimate', 'DefaultEnemyIsInanimate' ],
      [ 'useElementalIcons', 'UseElementalIcons' ],
      [ 'defaultStateLoseAllStacksAtOnce', 'DefaultStateLoseAllStacksAtOnce' ],
      [ 'hitboxOverlaysInitiallyVisible', 'HitboxOverlaysInitiallyVisible' ],
      [ 'showDisengageBalloon', 'ShowDisengageBalloon' ],
      [ 'enableGlobalCooldown', 'EnableGlobalCooldown' ],
    ];

    it.each(BOOLEAN_PARAMETERS)('reads %s as true when the parameter is the string "true"', async (parameterKey, field) =>
    {
      // Act
      const metadata = await buildAbsMetadata({ [ parameterKey ]: 'true' });

      // Assert
      expect(metadata[ field ]).toBe(true);
    });

    it.each(BOOLEAN_PARAMETERS)('reads %s as false when the parameter is absent', async (parameterKey, field) =>
    {
      // Arrange: a parameter the author never touched arrives as undefined rather than as 'false',
      // so the omitted case is the one the shipped game actually hits most often.
      // Act
      const metadata = await buildAbsMetadata({});

      // Assert
      expect(metadata[ field ]).toBe(false);
    });

    it.each(BOOLEAN_PARAMETERS)('reads %s as false when the parameter is the string "false"', async (parameterKey, field) =>
    {
      // Act
      const metadata = await buildAbsMetadata({ [ parameterKey ]: 'false' });

      // Assert
      expect(metadata[ field ]).toBe(false);
    });
  });
  //endregion boolean plugin parameters

  //region fallback plugin parameters
  /**
   * Each of these fields is an override with a hardcoded fallback behind it. Only the pair of cases
   * makes the fallback load-bearing: covering the supplied value alone leaves the `||` replaceable
   * by its left side, and covering the omission alone leaves it replaceable by the constant, which
   * would ignore every configured value in the plugin manager.
   */
  describe('fallback plugin parameters', () =>
  {
    const FALLBACK_PARAMETERS = [
      [ 'maxAiUpdateRange', 'MaxAiUpdateRange', '41', 41, 20 ],
      [ 'defaultChannelTickSpeed', 'DefaultChannelTickSpeed', '42', 42, 30 ],
      [ 'defaultStateReapplyType', 'DefaultStateReapplyType', 'stack', 'stack', 'refresh' ],
      [ 'defaultStateRefreshDiminish', 'DefaultStateRefreshDiminish', '43', 43, 120 ],
      [ 'defaultStateRefreshReset', 'DefaultStateRefreshReset', '44', 44, 900 ],
      [ 'defaultStateSpreadTickInterval', 'DefaultStateSpreadTickInterval', '45', 45, 30 ],
      [ 'defaultStateTickInterval', 'DefaultStateTickInterval', '46', 46, 60 ],
      [ 'minimumStateTickInterval', 'MinimumStateTickInterval', '47', 47, 4 ],
      [ 'naturalRegenTickType', 'NaturalRegenTickType', 'tick', 'tick', 'regen' ],
      [ 'defaultStateExtendAmount', 'DefaultStateExtendAmount', '48', 48, 180 ],
      [ 'defaultStateExtendMax', 'DefaultStateExtendMax', '49', 49, 216000 ],
      [ 'defaultStateStackMax', 'DefaultStateStackMax', '50', 50, 5 ],
      [ 'defaultStateApplicationCount', 'DefaultStateApplicationCount', '51', 51, 1 ],
      [ 'disengageBalloonId', 'DisengageBalloonId', '52', 52, 7 ],
      [ 'globalCooldownFrames', 'GlobalCooldownFrames', '53', 53, 30 ],
      [ 'skillExecutionMaxWindowSeconds', 'SkillExecutionMaxWindowSeconds', '54', 54, 15 ],
      [ 'mapAfflictionIconScale', 'mapAfflictionIconScale', '0.75', 0.75, 0.5 ],
      [ 'mapAfflictionGaugeHeight', 'mapAfflictionGaugeHeight', '9', 9, 3 ],
      [ 'mapAfflictionGapBelowHpBar', 'mapAfflictionGapBelowHpBar', '8', 8, 2 ],
    ];

    it.each(FALLBACK_PARAMETERS)(
      'takes the supplied %s over its fallback',
      async (parameterKey, field, supplied, expected) =>
      {
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: supplied });

        // Assert
        expect(metadata[ field ]).toBe(expected);
      });

    it.each(FALLBACK_PARAMETERS)(
      'falls back for %s when the parameter is absent',
      async (parameterKey, field, supplied, expected, fallback) =>
      {
        // Act
        const metadata = await buildAbsMetadata({});

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });
  });
  //endregion fallback plugin parameters

  //region validated numeric overrides
  /**
   * These fields seed a default and then overwrite it only when the parsed parameter passes a
   * range check, so each guard forks on two or three independent conditions rather than one. A
   * value that fails a different operand than the one under test would be suppressed by the guard
   * that already works, so each case below fails exactly one operand and passes the rest:
   * `Infinity` is the only way to be non-finite while remaining non-negative, and a negative
   * number is the only way to be finite while failing the lower bound.
   */
  describe('validated numeric overrides', () =>
  {
    const NON_NEGATIVE_PARAMETERS = [
      [ 'parryCharacterAnimationId', 'ParryCharacterAnimationId', 122 ],
      [ 'implicitParryBaselineFloor', 'ImplicitParryBaselineFloor', 50 ],
      [ 'implicitParryBaselinePerLevel', 'ImplicitParryBaselinePerLevel', 0.25 ],
      [ 'hitboxMeleeOriginOffsetPxX', 'HitboxMeleeOriginOffsetPxX', 0 ],
      [ 'hitboxMeleeOriginOffsetPxY', 'HitboxMeleeOriginOffsetPxY', -10 ],
      [ 'hitboxMeleeOriginExtraPxYFacingDown', 'HitboxMeleeOriginExtraPxYFacingDown', 0 ],
      [ 'hitboxMeleeOriginExtraPxYFacingUp', 'HitboxMeleeOriginExtraPxYFacingUp', 0 ],
      [ 'hitboxMeleeOriginLiftReductionPxFacingDown', 'HitboxMeleeOriginLiftReductionPxFacingDown', 28 ],
    ];

    it.each(NON_NEGATIVE_PARAMETERS)(
      'keeps the default %s when the parameter is absent',
      async (parameterKey, field, fallback) =>
      {
        // Act
        const metadata = await buildAbsMetadata({});

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    it.each(NON_NEGATIVE_PARAMETERS)(
      'keeps the default %s when the parameter parses to Infinity',
      async (parameterKey, field, fallback) =>
      {
        // Arrange: Infinity clears the non-negative half of the guard and fails only the finite
        // half, which is what makes this case name that operand specifically.
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: 'Infinity' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    const SIGNED_PARAMETERS = [
      [ 'parryCharacterAnimationId', 'ParryCharacterAnimationId', 122 ],
      [ 'implicitParryBaselineFloor', 'ImplicitParryBaselineFloor', 50 ],
      [ 'implicitParryBaselinePerLevel', 'ImplicitParryBaselinePerLevel', 0.25 ],
    ];

    it.each(SIGNED_PARAMETERS)(
      'keeps the default %s when the parameter is negative',
      async (parameterKey, field, fallback) =>
      {
        // Arrange: a negative value is finite, so it clears the finite half of the guard and fails
        // only the lower bound.
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: '-5' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    const DOMINANCE_PARAMETERS = [
      [ 'implicitParryDominanceMultiplier', 'ImplicitParryDominanceMultiplier', 2 ],
      [ 'glancingBlowDominanceMultiplier', 'GlancingBlowDominanceMultiplier', 2 ],
    ];

    it.each(DOMINANCE_PARAMETERS)(
      'keeps the default %s when the parameter is at or below one',
      async (parameterKey, field, fallback) =>
      {
        // Arrange: a dominance multiplier of one or less would widen the band to swallow every
        // exchange, so the guard demands strictly greater than one.
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: '0.5' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    it.each(DOMINANCE_PARAMETERS)(
      'keeps the default %s when the parameter parses to Infinity',
      async (parameterKey, field, fallback) =>
      {
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: 'Infinity' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    const UNIT_INTERVAL_PARAMETERS = [
      [ 'implicitParryScaleFactor', 'ImplicitParryScaleFactor', 0.2 ],
      [ 'glancingBlowDamageFactor', 'GlancingBlowDamageFactor', 0.3 ],
    ];

    it.each(UNIT_INTERVAL_PARAMETERS)(
      'keeps the default %s when the parameter is below zero',
      async (parameterKey, field, fallback) =>
      {
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: '-5' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });

    it.each(UNIT_INTERVAL_PARAMETERS)(
      'keeps the default %s when the parameter is above one',
      async (parameterKey, field, fallback) =>
      {
        // Arrange: these two scale an existing value, so anything above one would amplify rather
        // than reduce - the opposite of what the setting is for.
        // Act
        const metadata = await buildAbsMetadata({ [ parameterKey ]: '5' });

        // Assert
        expect(metadata[ field ]).toBe(fallback);
      });
  });
  //endregion validated numeric overrides

  //region hitbox pulse toggles
  /**
   * The two visibility toggles read `!== 'false'` rather than `=== 'true'`, which makes them
   * opt-out: an author who never touches them gets the overlay. That inversion is the whole point
   * of the setting and is easy to flip by accident, so both arms are pinned.
   */
  describe('hitbox pulse toggles', () =>
  {
    const OPT_OUT_TOGGLES = [
      [ 'hitboxPulseEnabled', 'enabled' ],
      [ 'hitboxPulseHighlightColliders', 'highlightColliderBattlers' ],
    ];

    it.each(OPT_OUT_TOGGLES)('defaults %s on when the parameter is absent', async (parameterKey, field) =>
    {
      // Act
      const metadata = await buildAbsMetadata({});

      // Assert
      expect(metadata.HitboxPulse[ field ]).toBe(true);
    });

    it.each(OPT_OUT_TOGGLES)('turns %s off only for the exact string "false"', async (parameterKey, field) =>
    {
      // Act
      const metadata = await buildAbsMetadata({ [ parameterKey ]: 'false' });

      // Assert
      expect(metadata.HitboxPulse[ field ]).toBe(false);
    });

    it.each(OPT_OUT_TOGGLES)('leaves %s on for any other value', async (parameterKey, field) =>
    {
      // Arrange: only the literal 'false' opts out, so a neighbouring value has to survive the
      // comparison rather than being treated as falsy.
      // Act
      const metadata = await buildAbsMetadata({ [ parameterKey ]: 'true' });

      // Assert
      expect(metadata.HitboxPulse[ field ]).toBe(true);
    });

    it('defaults useFadeAnimation off, since it is the opt-in of the three', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({});

      // Assert
      expect(metadata.HitboxPulse.useFadeAnimation).toBe(false);
    });

    it('turns useFadeAnimation on for the string "true"', async () =>
    {
      // Act
      const metadata = await buildAbsMetadata({ hitboxPulseUseFadeAnimation: 'true' });

      // Assert
      expect(metadata.HitboxPulse.useFadeAnimation).toBe(true);
    });
  });
  //endregion hitbox pulse toggles

  //region map affliction slot parsing
  /**
   * The slot count comes out of a data export that has historically carried corrupted noise, so
   * the parse rejects anything non-finite or below one rather than trusting it. Each case below
   * fails exactly one half of that guard.
   */
  describe('mapAfflictionMaxSlots parsing', () =>
  {
    it('falls back to eight slots when the parameter is absent', async () =>
    {
      // Arrange: an absent parameter stringifies to 'undefined', which parses to NaN and fails the
      // finite half of the guard.
      // Act
      const metadata = await buildAbsMetadata({});

      // Assert
      expect(metadata.mapAfflictionMaxSlots).toBe(8);
    });

    it('falls back to eight slots when the parameter is below one', async () =>
    {
      // Arrange: zero is perfectly finite, so it clears the first half of the guard and fails only
      // the lower bound - which is what makes this case name that operand rather than the other.
      // Act
      const metadata = await buildAbsMetadata({ mapAfflictionMaxSlots: '0' });

      // Assert
      expect(metadata.mapAfflictionMaxSlots).toBe(8);
    });
  });
  //endregion map affliction slot parsing

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
        '[J-ABS] globalCooldownSkillTypes JSON parse failed.',
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
      // Arrange: valid JSON that is not an array parses cleanly, so the array check is the only
      // thing standing between it and an iteration that would throw into the catch below. Pinning
      // the silence is what makes that check load-bearing - without it, skipping the guard and
      // letting the catch absorb a TypeError produces the same empty set.
      const warnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      const metadata = await buildAbsMetadata({ skillExecutionExcludedSkillTypes: '{}' });

      // Assert
      expect(metadata.SkillExecutionExcludedSkillTypeSet).toEqual(new Set());
      expect(warnSpy).not.toHaveBeenCalled();

      // Cleanup
      warnSpy.mockRestore();
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
        '[J-ABS] skillExecutionExcludedSkillTypes JSON parse failed.',
        expect.any(Error));

      // Cleanup
      warnSpy.mockRestore();
    });
  });
});
//endregion plugins/abs/core/_metadata/plugin-metadata.test.js
