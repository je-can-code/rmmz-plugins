//region plugins/abs/core/models/jabs-hitbox-pulse-options.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

describe('J-ABS JABS_HitboxPulseOptions (direct src import)', () =>
{
  let JABS_HitboxPulseOptions;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: JABS_HitboxPulseOptions } = await import('../../../../../src/plugins/abs/core/models/JABS_HitboxPulseOptions.js'));
  });

  describe('defaults', () =>
  {
    it('seeds every field with its documented default value', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults();

      expect(options.x).toBe(0);
      expect(options.y).toBe(0);
      expect(options.shape).toBe(globalThis.J.ABS.Shapes.Circle);
      expect(options.range).toBe(1);
      expect(options.facing).toBe(2);
      expect(options.degrees).toBe(180);
      expect(options.thickness).toBe(1);
      expect(options.innerRadius).toBe(0);
      expect(options.duration).toBe(60);
      expect(options.sustained).toBe(false);
      expect(options.startAlpha).toBeCloseTo(0.20);
      expect(options.endAlpha).toBe(0.00);
      expect(options.scaleStart).toBe(1.00);
      expect(options.scaleEnd).toBe(1.08);
      expect(options.lineColor).toBe(0xFFFFFF);
      expect(options.lineAlpha).toBeCloseTo(0.85);
      expect(options.lineWidth).toBe(2);
      expect(options.fillColor).toBe(0xFFFFFF);
      expect(options.fillAlpha).toBeCloseTo(0.18);
      expect(options.blendMode).toBe(globalThis.PIXI.BLEND_MODES.ADD);
    });

    it('returns a fresh instance on every call', () =>
    {
      const a = JABS_HitboxPulseOptions.defaults();
      const b = JABS_HitboxPulseOptions.defaults();
      expect(a).not.toBe(b);
    });
  });

  describe('clone', () =>
  {
    it('produces a separate instance carrying the same field values', () =>
    {
      const original = JABS_HitboxPulseOptions.defaults()
        .withOrigin(5, 6);

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned).toBeInstanceOf(JABS_HitboxPulseOptions);
      expect(cloned.x).toBe(5);
      expect(cloned.y).toBe(6);
    });

    it('does not let mutating the clone affect the original', () =>
    {
      const original = JABS_HitboxPulseOptions.defaults();
      const cloned = original.clone();

      cloned.x = 99;

      expect(original.x).toBe(0);
    });
  });

  describe('apply', () =>
  {
    it('returns itself unchanged when no patch is provided', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults();
      const result = options.apply(null);

      expect(result).toBe(options);
      expect(options.x).toBe(0);
    });

    it('merges the provided partial fields onto the instance', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults();

      const result = options.apply({ x: 10, duration: 30 });

      expect(result).toBe(options);
      expect(options.x).toBe(10);
      expect(options.duration).toBe(30);
      // untouched fields keep their defaults.
      expect(options.y).toBe(0);
    });
  });

  it('toPlain returns a plain object literal with every field', () =>
  {
    const options = JABS_HitboxPulseOptions.defaults()
      .withOrigin(1, 2);

    const plain = options.toPlain();

    expect(plain).toEqual({
      x: 1,
      y: 2,
      shape: globalThis.J.ABS.Shapes.Circle,
      range: 1,
      facing: 2,
      degrees: 180,
      thickness: 1,
      innerRadius: 0,
      duration: 60,
      sustained: false,
      startAlpha: 0.20,
      endAlpha: 0.00,
      scaleStart: 1.00,
      scaleEnd: 1.08,
      lineColor: 0xFFFFFF,
      lineAlpha: 0.85,
      lineWidth: 2,
      fillColor: 0xFFFFFF,
      fillAlpha: 0.18,
      blendMode: globalThis.PIXI.BLEND_MODES.ADD,
    });
    expect(plain).not.toBeInstanceOf(JABS_HitboxPulseOptions);
  });

  describe('fluent setters', () =>
  {
    it('withOrigin sets x/y and returns itself for chaining', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults();
      const result = options.withOrigin(3, 4);
      expect(result).toBe(options);
      expect(options.x).toBe(3);
      expect(options.y).toBe(4);
    });

    it('withShape sets the shape', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withShape(globalThis.J.ABS.Shapes.Square);
      expect(options.shape).toBe(globalThis.J.ABS.Shapes.Square);
    });

    it('withRange sets the range', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withRange(3);
      expect(options.range).toBe(3);
    });

    it('withFacing sets the facing', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withFacing(8);
      expect(options.facing).toBe(8);
    });

    it('withDegrees sets the degrees', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withDegrees(90);
      expect(options.degrees).toBe(90);
    });

    it('withThickness sets the thickness', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withThickness(2);
      expect(options.thickness).toBe(2);
    });

    it('withInnerRadius sets the inner radius', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withInnerRadius(1.5);
      expect(options.innerRadius).toBe(1.5);
    });

    it('withFade sets duration and both alpha endpoints', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withFade(30, 0.5, 0.1);
      expect(options.duration).toBe(30);
      expect(options.startAlpha).toBe(0.5);
      expect(options.endAlpha).toBe(0.1);
    });

    it('withScale sets both scale endpoints', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withScale(0.5, 2.0);
      expect(options.scaleStart).toBe(0.5);
      expect(options.scaleEnd).toBe(2.0);
    });

    it('withLine sets the outline color/alpha/width', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withLine(0x00FF00, 0.5, 4);
      expect(options.lineColor).toBe(0x00FF00);
      expect(options.lineAlpha).toBe(0.5);
      expect(options.lineWidth).toBe(4);
    });

    it('withFill sets the fill color/alpha', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withFill(0x0000FF, 0.3);
      expect(options.fillColor).toBe(0x0000FF);
      expect(options.fillAlpha).toBe(0.3);
    });

    it('withBlendMode sets the blend mode', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withBlendMode(globalThis.PIXI.BLEND_MODES.NORMAL);
      expect(options.blendMode).toBe(globalThis.PIXI.BLEND_MODES.NORMAL);
    });

    describe('withSustained', () =>
    {
      it('coerces a truthy true value into the boolean true', () =>
      {
        const options = JABS_HitboxPulseOptions.defaults()
          .withSustained(true);
        expect(options.sustained).toBe(true);
      });

      it('coerces anything else into false', () =>
      {
        const options = JABS_HitboxPulseOptions.defaults()
          .withSustained('yes');
        expect(options.sustained).toBe(false);
      });
    });

    it('chains multiple fluent setters together', () =>
    {
      const options = JABS_HitboxPulseOptions.defaults()
        .withOrigin(1, 1)
        .withRange(2)
        .withFacing(6)
        .withDegrees(45);

      expect(options.x).toBe(1);
      expect(options.range).toBe(2);
      expect(options.facing).toBe(6);
      expect(options.degrees).toBe(45);
    });
  });

  describe('static from', () =>
  {
    it('clones the input directly when it is already an instance', () =>
    {
      const source = JABS_HitboxPulseOptions.defaults()
        .withOrigin(9, 9);

      const result = JABS_HitboxPulseOptions.from(source);

      expect(result).not.toBe(source);
      expect(result.x).toBe(9);
    });

    it('builds from defaults when no base is provided and data is a plain partial', () =>
    {
      const result = JABS_HitboxPulseOptions.from({ x: 5 });

      expect(result).toBeInstanceOf(JABS_HitboxPulseOptions);
      expect(result.x).toBe(5);
      expect(result.duration).toBe(60);
    });

    it('builds from the provided base (cloned) when one is given', () =>
    {
      const base = JABS_HitboxPulseOptions.defaults()
        .withFade(99, 0.9, 0.1);

      const result = JABS_HitboxPulseOptions.from({ x: 3 }, base);

      expect(result).not.toBe(base);
      expect(result.x).toBe(3);
      expect(result.duration).toBe(99);
    });

    it('applies no changes when data is null/undefined, using the base/defaults as-is', () =>
    {
      const result = JABS_HitboxPulseOptions.from(undefined);

      expect(result.x).toBe(0);
      expect(result.duration).toBe(60);
    });
  });
});
//endregion plugins/abs/core/models/jabs-hitbox-pulse-options.test.js
