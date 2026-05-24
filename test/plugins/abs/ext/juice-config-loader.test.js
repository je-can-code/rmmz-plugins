//region plugins/abs/ext/juice-config-loader.test.js
import { describe, expect, it } from 'vitest';

import {
  jabsJuiceProfileKeyPattern,
  jabsJuiceRequireBlock,
  jabsJuiceRequireFloat,
  jabsJuiceRequireInt,
  jabsJuiceRequireProfiles,
  jabsJuiceRequireStyleRow,
} from '../../../../src/plugins/abs/ext/juice/_metadata/juiceConfigValidation.js';

/**
 * J-ABS-Juice validates the {@code juice} block from {@code data/config.jabs.json} at plugin init time.
 * Validators live in {@link juiceConfigValidation.js} so Vitest can import them without evaluating the full ship.
 */
describe('J-ABS-Juice external-config loader (juiceConfigValidation.js)', () =>
{
  const validators = {
    jabsJuiceRequireFloat,
    jabsJuiceRequireInt,
    jabsJuiceRequireStyleRow,
    jabsJuiceRequireProfiles,
    jabsJuiceRequireBlock,
    jabsJuiceProfileKeyPattern,
  };

  describe('jabsJuiceRequireFloat', () =>
  {
    it('returns the numeric value when given a finite number', () =>
    {
      expect(validators.jabsJuiceRequireFloat(0.42, 'juice.x'))
        .toBe(0.42);
      expect(validators.jabsJuiceRequireFloat(0, 'juice.x'))
        .toBe(0);
      expect(validators.jabsJuiceRequireFloat(-3.5, 'juice.x'))
        .toBe(-3.5);
    });

    it('coerces numeric strings (config authors may quote numbers)', () =>
    {
      expect(validators.jabsJuiceRequireFloat('0.18', 'juice.x'))
        .toBe(0.18);
      expect(validators.jabsJuiceRequireFloat('10', 'juice.x'))
        .toBe(10);
    });

    it('throws when the value is missing (undefined / null)', () =>
    {
      expect(() => validators.jabsJuiceRequireFloat(undefined, 'juice.target.physicalSquishIntensity'))
        .toThrow(/juice\.target\.physicalSquishIntensity/);
      expect(() => validators.jabsJuiceRequireFloat(null, 'juice.target.physicalSquishIntensity'))
        .toThrow(/missing required number/);
    });

    it('throws when the value cannot be parsed as a finite number', () =>
    {
      expect(() => validators.jabsJuiceRequireFloat('not-a-number', 'juice.x'))
        .toThrow(/non-finite/);
      expect(() => validators.jabsJuiceRequireFloat(Number.NaN, 'juice.x'))
        .toThrow(/non-finite/);
      expect(() => validators.jabsJuiceRequireFloat(Number.POSITIVE_INFINITY, 'juice.x'))
        .toThrow(/non-finite/);
    });
  });

  describe('jabsJuiceRequireInt', () =>
  {
    it('truncates the float toward zero (matches frame-count semantics)', () =>
    {
      expect(validators.jabsJuiceRequireInt(10.9, 'juice.x'))
        .toBe(10);
      expect(validators.jabsJuiceRequireInt(-3.9, 'juice.x'))
        .toBe(-3);
    });
  });

  describe('jabsJuiceRequireStyleRow', () =>
  {
    it('returns tiltMul and swingMul when both leaves are valid', () =>
    {
      expect(validators.jabsJuiceRequireStyleRow({ tiltMul: 1, swingMul: 0.5 }, 'juice.profiles.default'))
        .toEqual({ tiltMul: 1, swingMul: 0.5 });
    });

    it('throws when the row is missing or not an object', () =>
    {
      expect(() => validators.jabsJuiceRequireStyleRow(null, 'juice.profiles.default'))
        .toThrow(/missing or invalid profile row/);
    });
  });

  describe('jabsJuiceProfileKeyPattern', () =>
  {
    it('accepts keys that match the note-tag charset', () =>
    {
      expect(validators.jabsJuiceProfileKeyPattern.test('default'))
        .toBe(true);
      expect(validators.jabsJuiceProfileKeyPattern.test('heavy_weapon-1'))
        .toBe(true);
      expect(validators.jabsJuiceProfileKeyPattern.test('a4'))
        .toBe(true);
      expect(validators.jabsJuiceProfileKeyPattern.test('1'))
        .toBe(true);
    });

    it('rejects keys with spaces or punctuation outside the allowed set', () =>
    {
      expect(validators.jabsJuiceProfileKeyPattern.test('heavy weapon'))
        .toBe(false);
      expect(validators.jabsJuiceProfileKeyPattern.test('aff_+=+-f21354'))
        .toBe(false);
      expect(validators.jabsJuiceProfileKeyPattern.test(''))
        .toBe(false);
    });
  });

  describe('jabsJuiceRequireProfiles', () =>
  {
    it('requires a default row and normalizes each profile', () =>
    {
      const table = validators.jabsJuiceRequireProfiles({
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
      expect(() => validators.jabsJuiceRequireProfiles({ heavy: { tiltMul: 1, swingMul: 1 } }))
        .toThrow(/profiles\.default/);
    });
  });

  describe('jabsJuiceRequireBlock', () =>
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

      expect(validators.jabsJuiceRequireBlock(root))
        .toBe(root.juice);
    });

    it('throws when the juice block is missing', () =>
    {
      expect(() => validators.jabsJuiceRequireBlock({}))
        .toThrow(/missing the required "juice" block/);
    });
  });
});
//endregion plugins/abs/ext/juice-config-loader.test.js
