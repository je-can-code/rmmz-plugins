//region plugins/abs/ext/juice/models/juice-casting-squish-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installJuiceMotionGlobals } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceCastingSquishMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingSquishMotionEffect.js').default} */
  let JuiceCastingSquishMotionEffect;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/models/MotionComposition.js').default} */
  let MotionComposition;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installJuiceMotionGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: JuiceCastingSquishMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingSquishMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a casting squat at the given intensity and period.
   * @param {number} intensity How far the body deforms at the peak of a squat.
   * @param {number} period How many frames one squat takes.
   * @returns {Object} The effect.
   */
  const aSquat = (intensity, period) =>
  {
    const declaration = new MotionDeclaration('castSquish', [ intensity, period ], 'combat:casting');

    return new JuiceCastingSquishMotionEffect(declaration, { intensity, period }, 0);
  };

  /**
   * Advances an effect by a number of frames.
   * @param {Object} effect The effect to run.
   * @param {number} frames How many frames to advance.
   * @returns {Object} The same effect.
   */
  const advanced = (effect, frames) =>
  {
    for (let index = 0; index < frames; index++)
    {
      effect.tick();
    }

    return effect;
  };

  /**
   * Composes one frame of an effect and hands back what it wrote.
   * @param {Object} effect The effect to compose.
   * @returns {Object} The composition.
   */
  const composed = effect =>
  {
    const composition = new MotionComposition();
    effect.applyTo(composition);

    return composition;
  };

  describe('claims', () =>
  {
    it('takes exclusive ownership of both scale axes', () =>
    {
      // Arrange
      const effect = aSquat(0.14, 8);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toContain(MotionChannels.SCALE_X);
      expect(claimed).toContain(MotionChannels.SCALE_Y);
    });

    it('claims nothing else, so no glow is contributed or suppressed', () =>
    {
      // Arrange
      const effect = aSquat(0.14, 8);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toHaveLength(2);
    });
  });

  describe('cycleProgress', () =>
  {
    it('starts a squat at zero', () =>
    {
      // Arrange
      const effect = aSquat(0.14, 8);

      // Act
      const progress = effect.cycleProgress();

      // Assert
      expect(progress).toBe(0);
    });

    it('wraps back to the start after one full period, rather than running on', () =>
    {
      // Arrange- one frame past a whole period; a non-wrapping counter would read 9/8.
      const effect = advanced(aSquat(0.14, 8), 9);

      // Act
      const progress = effect.cycleProgress();

      // Assert
      expect(progress).toBe(0.125);
    });

    it('measures against the authored period, not a fixed one', () =>
    {
      // Arrange- the same elapsed frames read as a different fraction under a different period.
      const effect = advanced(aSquat(0.14, 16), 4);

      // Act
      const progress = effect.cycleProgress();

      // Assert
      expect(progress).toBe(0.25);
    });
  });

  describe('applyTo', () =>
  {
    it('sits at the sprite\'s true size at the start of a squat', () =>
    {
      // Arrange
      const effect = aSquat(0.14, 8);

      // Act
      const composition = composed(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1, 10);
    });

    it('widens as it flattens at the peak of a squat', () =>
    {
      // Arrange- halfway through an 8-frame period is the top of the sine envelope.
      const effect = advanced(aSquat(0.14, 8), 4);

      // Act
      const composition = composed(effect);

      // Assert- width up by the full intensity, height down by its reciprocal.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.14, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1 / 1.14, 10);
    });

    it('only ever squashes, never stretches taller than its true size', () =>
    {
      // Arrange- three quarters through, on the way back down; a full-wave envelope would go
      // negative here and stretch the sprite instead.
      const effect = advanced(aSquat(0.14, 8), 6);

      // Act
      const composition = composed(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeGreaterThanOrEqual(1);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeLessThanOrEqual(1);
    });

    it('scales the squat by the authored intensity', () =>
    {
      // Arrange- same frame, twice the intensity, so the peak is what moves.
      const effect = advanced(aSquat(0.28, 8), 4);

      // Act
      const composition = composed(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.28, 10);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-casting-squish-motion-effect.test.js
