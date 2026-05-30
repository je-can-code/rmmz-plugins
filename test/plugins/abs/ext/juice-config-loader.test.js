//region plugins/abs/ext/juice-config-loader.test.js
import { describe, expect, it } from 'vitest';

import JabsJuiceConfigValidation from '../../../../src/plugins/abs/ext/juice/_metadata/juiceConfigValidation.js';

/**
 * J-ABS-Juice validates the {@code juice} block from {@code data/config.jabs.json} at plugin init time.
 * Validators live in {@link juiceConfigValidation.js} so Vitest can import them without evaluating the full ship.
 */
describe('J-ABS-Juice external-config loader (juiceConfigValidation.js)', () =>
{
  describe('requireFloat', () =>
  {
    it('returns the numeric value when given a finite number', () =>
    {
      expect(JabsJuiceConfigValidation.requireFloat(0.42, 'juice.x'))
        .toBe(0.42);
      expect(JabsJuiceConfigValidation.requireFloat(0, 'juice.x'))
        .toBe(0);
      expect(JabsJuiceConfigValidation.requireFloat(-3.5, 'juice.x'))
        .toBe(-3.5);
    });

    it('coerces numeric strings (config authors may quote numbers)', () =>
    {
      expect(JabsJuiceConfigValidation.requireFloat('0.18', 'juice.x'))
        .toBe(0.18);
      expect(JabsJuiceConfigValidation.requireFloat('10', 'juice.x'))
        .toBe(10);
    });

    it('throws when the value is missing (undefined / null)', () =>
    {
      expect(() => JabsJuiceConfigValidation.requireFloat(undefined, 'juice.target.physicalSquishIntensity'))
        .toThrow(/juice\.target\.physicalSquishIntensity/);
      expect(() => JabsJuiceConfigValidation.requireFloat(null, 'juice.target.physicalSquishIntensity'))
        .toThrow(/missing required number/);
    });

    it('throws when the value cannot be parsed as a finite number', () =>
    {
      expect(() => JabsJuiceConfigValidation.requireFloat('not-a-number', 'juice.x'))
        .toThrow(/non-finite/);
      expect(() => JabsJuiceConfigValidation.requireFloat(Number.NaN, 'juice.x'))
        .toThrow(/non-finite/);
      expect(() => JabsJuiceConfigValidation.requireFloat(Number.POSITIVE_INFINITY, 'juice.x'))
        .toThrow(/non-finite/);
    });
  });

  describe('requireInt', () =>
  {
    it('truncates the float toward zero (matches frame-count semantics)', () =>
    {
      expect(JabsJuiceConfigValidation.requireInt(10.9, 'juice.x'))
        .toBe(10);
      expect(JabsJuiceConfigValidation.requireInt(-3.9, 'juice.x'))
        .toBe(-3);
    });
  });

  describe('requireStyleRow', () =>
  {
    it('returns tiltMul and swingMul when both leaves are valid', () =>
    {
      expect(JabsJuiceConfigValidation.requireStyleRow({ tiltMul: 1, swingMul: 0.5 }, 'juice.profiles.default'))
        .toEqual({ tiltMul: 1, swingMul: 0.5 });
    });

    it('throws when the row is missing or not an object', () =>
    {
      expect(() => JabsJuiceConfigValidation.requireStyleRow(null, 'juice.profiles.default'))
        .toThrow(/missing or invalid profile row/);
    });
  });

  describe('profileKeyPattern', () =>
  {
    it('accepts keys that match the note-tag charset', () =>
    {
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('default'))
        .toBe(true);
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('heavy_weapon-1'))
        .toBe(true);
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('a4'))
        .toBe(true);
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('1'))
        .toBe(true);
    });

    it('rejects keys with spaces or punctuation outside the allowed set', () =>
    {
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('heavy weapon'))
        .toBe(false);
      expect(JabsJuiceConfigValidation.profileKeyPattern.test('aff_+=+-f21354'))
        .toBe(false);
      expect(JabsJuiceConfigValidation.profileKeyPattern.test(''))
        .toBe(false);
    });
  });

  describe('requireProfiles', () =>
  {
    it('requires a default row and normalizes each profile', () =>
    {
      const table = JabsJuiceConfigValidation.requireProfiles({
        default: { tiltMul: 1, swingMul: 1 },
        heavy: { tiltMul: 1.2, swingMul: 0.8 },
      });

      expect(table.default)
        .toEqual({ tiltMul: 1, swingMul: 1 });
      expect(table.heavy)
        .toEqual({ tiltMul: 1.2, swingMul: 0.8 });
    });

    it('throws when default is absent', () =>
    {
      expect(() => JabsJuiceConfigValidation.requireProfiles({ heavy: { tiltMul: 1, swingMul: 1 } }))
        .toThrow(/profiles\.default/);
    });
  });

  describe('requireBlock', () =>
  {
    it('returns the juice object when target, caster, and casting are present', () =>
    {
      const root = {
        juice: {
          target: {},
          caster: {},
          casting: {},
        },
      };

      expect(JabsJuiceConfigValidation.requireBlock(root))
        .toBe(root.juice);
    });

    it('throws when the juice block is missing', () =>
    {
      expect(() => JabsJuiceConfigValidation.requireBlock({}))
        .toThrow(/missing the required "juice" block/);
    });
  });
});
//endregion plugins/abs/ext/juice-config-loader.test.js