//region plugins/abs/ext/juice-config-loader.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../setup/repo-root.js';

/**
 * J-ABS-Juice validates the {@code juice} block from {@code data/config.jabs.json} at plugin init time.
 * The validator functions live at the top of {@link src/plugins/abs/ext/juice/_metadata/_pluginMetadata.js}
 * and are concatenated into the bundle; they are not exported, so we evaluate the source into a sandbox
 * with a {@code PluginMetadata} placeholder and grab the validators back via {@code globalThis} for testing.
 *
 * Loading {@code out/J-ABS-Juice.js} end-to-end would also exercise the class wiring, but that requires the
 * full J-Base + J-ABS + config-on-disk stack — overkill for "is the validator strict?".
 */
describe('J-ABS-Juice external-config loader (src/.../_pluginMetadata.js)', () =>
{
  const sourcePath = path.join(
    repoRoot,
    'src',
    'plugins',
    'abs',
    'ext',
    'juice',
    '_metadata',
    '_pluginMetadata.js'
  );

  let validators;

  beforeAll(() =>
  {
    // placeholder PluginMetadata so the JAbsJuice_PluginMetadata `extends` declaration can resolve.
    // we never instantiate the subclass here; only the top-level helper functions are under test.
    const sandbox = {
      console,
      PluginMetadata: class
      {
        constructor()
        {}

        postInitialize()
        {}
      },
    };
    vm.createContext(sandbox);

    // expose every helper we plan to test through globalThis so the outer test runner can call them.
    const expose = `
globalThis.__juiceValidators = {
  jabsJuiceRequireFloat,
  jabsJuiceRequireInt,
  jabsJuiceRequireStyleRow,
  jabsJuiceRequireProfiles,
  jabsJuiceRequireBlock,
  jabsJuiceProfileKeyPattern,
};
`;

    const code = fs.readFileSync(sourcePath, 'utf8') + expose;
    vm.runInContext(code, sandbox, { filename: sourcePath });

    validators = sandbox.__juiceValidators;
  });

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
      expect(validators.jabsJuiceRequireInt(10, 'juice.x'))
        .toBe(10);
      expect(validators.jabsJuiceRequireInt(9.7, 'juice.x'))
        .toBe(9);
      expect(validators.jabsJuiceRequireInt('12', 'juice.x'))
        .toBe(12);
    });

    it('throws on missing / non-finite (delegates to the float validator)', () =>
    {
      expect(() => validators.jabsJuiceRequireInt(undefined, 'juice.target.squishFrames'))
        .toThrow(/juice\.target\.squishFrames/);
      expect(() => validators.jabsJuiceRequireInt('garbage', 'juice.target.squishFrames'))
        .toThrow(/non-finite/);
    });
  });

  describe('jabsJuiceRequireStyleRow', () =>
  {
    it('returns a normalized {tiltMul, swingMul} shape for a valid row', () =>
    {
      const row = validators.jabsJuiceRequireStyleRow({ tiltMul: 1.2, swingMul: 0.85 }, 'juice.profiles.heavy');
      expect(row)
        .toEqual({
          tiltMul: 1.2,
          swingMul: 0.85
        });
    });

    it('throws when the row itself is missing or not an object', () =>
    {
      expect(() => validators.jabsJuiceRequireStyleRow(undefined, 'juice.profiles.heavy'))
        .toThrow(/juice\.profiles\.heavy/);
      expect(() => validators.jabsJuiceRequireStyleRow(null, 'juice.profiles.heavy'))
        .toThrow(/missing or invalid profile row/);
      expect(() => validators.jabsJuiceRequireStyleRow(42, 'juice.profiles.heavy'))
        .toThrow(/missing or invalid profile row/);
    });

    it('throws when either multiplier leaf is missing (partial rows are misconfigs)', () =>
    {
      expect(() => validators.jabsJuiceRequireStyleRow({ tiltMul: 1 }, 'juice.profiles.heavy'))
        .toThrow(/juice\.profiles\.heavy\.swingMul/);
      expect(() => validators.jabsJuiceRequireStyleRow({ swingMul: 1 }, 'juice.profiles.heavy'))
        .toThrow(/juice\.profiles\.heavy\.tiltMul/);
    });
  });

  describe('jabsJuiceProfileKeyPattern', () =>
  {
    it('matches keys composed of letters, digits, underscore, and dash', () =>
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

    it('rejects keys containing spaces or other punctuation', () =>
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
    it('returns a table containing every authored row when the shape is valid', () =>
    {
      const table = validators.jabsJuiceRequireProfiles({
        default: { tiltMul: 1, swingMul: 1 },
        heavy: { tiltMul: 1.2, swingMul: 0.85 },
      });
      expect(table)
        .toEqual({
          default: {
            tiltMul: 1,
            swingMul: 1
          },
          heavy: {
            tiltMul: 1.2,
            swingMul: 0.85
          },
        });
    });

    it('throws when the profiles map itself is missing', () =>
    {
      expect(() => validators.jabsJuiceRequireProfiles(undefined))
        .toThrow(/juice\.profiles/);
      expect(() => validators.jabsJuiceRequireProfiles(null))
        .toThrow(/juice\.profiles/);
    });

    it('throws when the default row is absent (fallback row is mandatory)', () =>
    {
      expect(() => validators.jabsJuiceRequireProfiles({ heavy: { tiltMul: 1, swingMul: 1 } }))
        .toThrow(/juice\.profiles\.default/);
    });

    it('throws when any profile key violates the allowed charset', () =>
    {
      expect(() =>
        validators.jabsJuiceRequireProfiles({
          default: { tiltMul: 1, swingMul: 1 },
          'bad key': { tiltMul: 1, swingMul: 1 },
        })
      )
        .toThrow(/invalid profile key/);
    });
  });

  describe('jabsJuiceRequireBlock', () =>
  {
    /**
     * Minimal, valid juice block used as the happy-path baseline; tests below clone-and-mutate it
     * to assert one missing piece at a time.
     */
    const validBlock = () => ({
      juice: {
        target: {
          physicalSquishIntensity: 0.12,
          magicalSquishIntensity: 0.08,
          squishFrames: 10,
          healingRecipientScale: 0.65,
          flurryDecayPercent: 72,
        },
        caster: {
          dodgeSquishIntensity: 0.28,
          dodgeSquishFrames: 12,
          supportPulseIntensity: 0.06,
          supportPulseFrames: 12,
          strikeTiltRadians: 0.18,
          strikeTiltFrames: 6,
          weaponSwingPeakRadians: 0.65,
          weaponSwingFrames: 10,
          spriteVerticalOffsetPixels: 10,
          unarmedStrikeSquishIntensity: 0.14,
          unarmedStrikeSquishFrames: 9,
        },
        casting: { pulseAmplitude: 0.045 },
        profiles: { default: { tiltMul: 1, swingMul: 1 } },
      },
    });

    it('returns the juice sub-object when the root and all required sections exist', () =>
    {
      const root = validBlock();
      const juice = validators.jabsJuiceRequireBlock(root);
      expect(juice)
        .toBe(root.juice);
    });

    it('throws when the config root itself is missing', () =>
    {
      expect(() => validators.jabsJuiceRequireBlock(undefined))
        .toThrow(/config\.jabs\.json/);
      expect(() => validators.jabsJuiceRequireBlock(null))
        .toThrow(/config\.jabs\.json/);
    });

    it('throws when the juice key is absent from the root', () =>
    {
      expect(() => validators.jabsJuiceRequireBlock({}))
        .toThrow(/missing the required "juice" block/);
    });

    it.each([
      [ 'target' ],
      [ 'caster' ],
      [ 'casting' ],
    ])('throws when juice.%s is missing', (sectionName) =>
    {
      const root = validBlock();
      delete root.juice[sectionName];

      expect(() => validators.jabsJuiceRequireBlock(root))
        .toThrow(new RegExp(`missing the required "${sectionName}" section`));
    });
  });
});
//endregion plugins/abs/ext/juice-config-loader.test.js