//region plugins/passive/ext/conditional/helpers/passive-rule-threshold.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveRuleThreshold (direct src import)', () =>
{
  let PassiveRuleThreshold;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.ParameterRegistry = { get: vi.fn(() => null) };

    ({ default: PassiveRuleThreshold } = await import('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleThreshold.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.ParameterRegistry.get.mockReturnValue(null);
  });

  /** Builds a minimal battler with hp/mp/tp resource fields. */
  function buildResourceBattler(overrides = {})
  {
    return {
      hp: 50, mhp: 100, mp: 25, mmp: 50, tp: 10, maxTp: () => 100,
      parameter: () => 0,
      ...overrides,
    };
  }

  describe('compare', () =>
  {
    it('passes an above comparison at exactly the threshold (inclusive)', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 50, mhp: 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.compare(battler, 'hp', 'above', 50)).toBe(true);
    });

    it('fails an above comparison below the threshold', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 10, mhp: 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.compare(battler, 'hp', 'above', 50)).toBe(false);
    });

    it('passes a below comparison at exactly the threshold (inclusive)', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 25, mhp: 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.compare(battler, 'hp', 'below', 25)).toBe(true);
    });

    it('fails a below comparison above the threshold', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 90, mhp: 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.compare(battler, 'hp', 'below', 25)).toBe(false);
    });
  });

  describe('resolveRuleValue', () =>
  {
    it('routes hp/mp/tp through the current-resource percent calculation', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 50, mhp: 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'hp')).toBe(50);
    });

    it('routes mhp/mmp/mtp through the flat parameter lookup', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ parameter: (key) => (key === 'mhp' ? 250 : 0) });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'mhp')).toBe(250);
    });

    it('routes everything else through the parameter registry', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue({ format: 'integer', resolveValue: () => 7 });
      const battler = buildResourceBattler();

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'cri')).toBe(7);
    });
  });

  describe('current resource percent (via resolveRuleValue)', () =>
  {
    it('computes hp percent, rounding to the nearest whole number', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ hp: 1, mhp: 3 });

      // Act & Assert- 1/3 = 33.33...%, rounds to 33.
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'hp')).toBe(33);
    });

    it('returns 0 for hp when mhp is zero (divide-by-zero guard)', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ mhp: 0 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'hp')).toBe(0);
    });

    it('computes mp percent', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ mp: 10, mmp: 20 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'mp')).toBe(50);
    });

    it('returns 0 for mp when mmp is zero (divide-by-zero guard)', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ mmp: 0 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'mp')).toBe(0);
    });

    it('computes tp percent', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ tp: 50, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'tp')).toBe(50);
    });

    it('returns 0 for tp when maxTp is zero (divide-by-zero guard)', () =>
    {
      // Arrange
      const battler = buildResourceBattler({ maxTp: () => 0 });

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'tp')).toBe(0);
    });
  });

  describe('registry integer value (via resolveRuleValue)', () =>
  {
    it('returns 0 for an unknown registry key (fail closed)', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue(null);
      const battler = buildResourceBattler();

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'unknownKey')).toBe(0);
    });

    it('multiplies a hundred-scale registry format by 100 and rounds', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue({ format: 'percent', resolveValue: () => 0.256 });
      const battler = buildResourceBattler();

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'cri')).toBe(26);
    });

    it('returns the raw value unchanged for a non-hundred-scale format', () =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue({ format: 'integer', resolveValue: () => 42 });
      const battler = buildResourceBattler();

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'atk')).toBe(42);
    });

    it.each([
      'percent', 'percentSuffix', 'percentCentered', 'multiplierPercent', 'scaledPoints', 'scaledOffset',
    ])('treats "%s" as a hundred-scale format', (format) =>
    {
      // Arrange
      globalThis.ParameterRegistry.get.mockReturnValue({ format, resolveValue: () => 0.5 });
      const battler = buildResourceBattler();

      // Act & Assert
      expect(PassiveRuleThreshold.resolveRuleValue(battler, 'someKey')).toBe(50);
    });
  });

  describe('parseThresholdKind', () =>
  {
    it('parses an Above suffix', () =>
    {
      // Act & Assert
      expect(PassiveRuleThreshold.parseThresholdKind('hpAbove')).toEqual({ key: 'hp', direction: 'above' });
    });

    it('parses a Below suffix', () =>
    {
      // Act & Assert
      expect(PassiveRuleThreshold.parseThresholdKind('criBelow')).toEqual({ key: 'cri', direction: 'below' });
    });

    it('returns null for a kind with neither suffix', () =>
    {
      // Act & Assert
      expect(PassiveRuleThreshold.parseThresholdKind('hasState')).toBe(null);
    });
  });

  describe('parseAllAlliesThresholdKind', () =>
  {
    it('parses an allAllies-prefixed threshold kind, re-lowercasing the recovered key', () =>
    {
      // Act & Assert- the recovered key must match CURRENT_RESOURCE_KEYS/MAX_RESOURCE_KEYS/
      // ParameterRegistry's lowercase-first casing, or resolveRuleValue silently fails closed.
      expect(PassiveRuleThreshold.parseAllAlliesThresholdKind('allAlliesHpAbove'))
        .toEqual({ key: 'hp', direction: 'above' });
    });

    it('resolves the parsed key against CURRENT_RESOURCE_KEYS instead of falling through to the registry', () =>
    {
      // Arrange- regression test: a capitalized "Hp" key would miss CURRENT_RESOURCE_KEYS and
      // ParameterRegistry (both lowercase-keyed), silently resolving to 0 and failing every gate.
      const battler = buildResourceBattler({ hp: 50, mhp: 100 });
      const { key, direction } = PassiveRuleThreshold.parseAllAlliesThresholdKind('allAlliesHpAbove');

      // Act & Assert
      expect(PassiveRuleThreshold.compare(battler, key, direction, 50)).toBe(true);
      expect(globalThis.ParameterRegistry.get).not.toHaveBeenCalled();
    });

    it('returns null when the kind has no allAllies prefix', () =>
    {
      // Act & Assert
      expect(PassiveRuleThreshold.parseAllAlliesThresholdKind('hpAbove')).toBe(null);
    });
  });
});
//endregion plugins/passive/ext/conditional/helpers/passive-rule-threshold.test.js
