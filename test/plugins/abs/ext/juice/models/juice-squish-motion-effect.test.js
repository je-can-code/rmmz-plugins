//region plugins/abs/ext/juice/models/juice-squish-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installJuiceMotionGlobals } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceSquishMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceSquishMotionEffect.js').default} */
  let JuiceSquishMotionEffect;

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
    ({ default: JuiceSquishMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceSquishMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a squish with the given shape.
   * @param {number} intensity How far the body deforms at the peak.
   * @param {number} duration How long one cycle lasts.
   * @param {number} repeats How many cycles to run.
   * @returns {Object} The effect.
   */
  const aSquish = (intensity, duration, repeats = 1) =>
  {
    const parameters = { intensity, duration, repeats };
    const declaration = new MotionDeclaration('squish', [ intensity, duration, repeats ], 'combat:reaction');

    return new JuiceSquishMotionEffect(declaration, parameters, 0);
  };

  /**
   * Advances an effect and hands back the composition it writes.
   * @param {Object} effect The effect to run.
   * @param {number} frames How many frames to advance first.
   * @returns {Object} The composition.
   */
  const composedAfter = (effect, frames) =>
  {
    for (let index = 0; index < frames; index++)
    {
      effect.tick();
    }

    const composition = new MotionComposition();
    effect.applyTo(composition);

    return composition;
  };

  describe('claims', () =>
  {
    it('takes exclusive ownership of both scale axes', () =>
    {
      // Arrange
      const effect = aSquish(0.2, 10);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toContain(MotionChannels.SCALE_X);
      expect(claimed).toContain(MotionChannels.SCALE_Y);
    });

    it('leaves every other channel to compose', () =>
    {
      // Arrange
      const effect = aSquish(0.2, 10);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).not.toContain(MotionChannels.ROTATION);
      expect(claimed).not.toContain(MotionChannels.OPACITY);
      expect(claimed).not.toContain(MotionChannels.OFFSET_Y);
    });
  });

  describe('cycleProgress', () =>
  {
    it('reports where in the current cycle a frame sits', () =>
    {
      // Arrange
      const effect = aSquish(0.2, 8);

      // Act
      effect.tick();
      effect.tick();

      // Assert
      expect(effect.cycleProgress()).toBeCloseTo(0.25, 10);
    });

    it('wraps back to the start of the next cycle rather than running past one', () =>
    {
      // Arrange
      const effect = aSquish(0.2, 8, 3);

      // Act
      for (let index = 0; index < 10; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.cycleProgress()).toBeCloseTo(0.25, 10);
    });
  });

  describe('applyTo', () =>
  {
    it('starts at exactly no deformation, so nothing snaps on the first frame', () =>
    {
      // Arrange
      const atRest = aSquish(0.5, 10);
      const oneFrameIn = aSquish(0.5, 10);

      // Act
      const startX = composedAfter(atRest, 0)
        .valueFor(MotionChannels.SCALE_X);
      const nextX = composedAfter(oneFrameIn, 1)
        .valueFor(MotionChannels.SCALE_X);

      // Assert- the second value is what proves this ran. `1` is the scale identity, so an applyTo
      // with no body at all would report it at the start and every frame after.
      expect(startX).toBeCloseTo(1, 10);
      expect(nextX).toBeCloseTo(1.15451, 4);
    });

    it('widens the body while flattening it, at the peak of the envelope', () =>
    {
      // Arrange
      const effect = aSquish(0.5, 8);

      // Act
      const composition = composedAfter(effect, 4);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1 / 1.5, 10);
    });

    it('returns to no deformation by the end of a cycle', () =>
    {
      // Arrange
      const nearlyDone = aSquish(0.5, 8);
      const done = aSquish(0.5, 8);

      // Act
      const penultimateX = composedAfter(nearlyDone, 7)
        .valueFor(MotionChannels.SCALE_X);
      const finalX = composedAfter(done, 8)
        .valueFor(MotionChannels.SCALE_X);

      // Assert- the penultimate frame is the anchor. Landing on the identity only means something
      // if the frame before it was somewhere else, which is the property the expiry relies on.
      expect(penultimateX).toBeCloseTo(1.19134, 4);
      expect(finalX).toBeCloseTo(1, 10);
    });

    it('scales the deformation by the intensity it was given', () =>
    {
      // Arrange
      const gentle = aSquish(0.1, 8);
      const violent = aSquish(0.4, 8);

      // Act
      const gentlePeak = composedAfter(gentle, 4)
        .valueFor(MotionChannels.SCALE_X);
      const violentPeak = composedAfter(violent, 4)
        .valueFor(MotionChannels.SCALE_X);

      // Assert
      expect(gentlePeak).toBeCloseTo(1.1, 10);
      expect(violentPeak).toBeCloseTo(1.4, 10);
    });

    it('peaks again on a later cycle, which is what makes a repeat visible', () =>
    {
      // Arrange
      const effect = aSquish(0.5, 8, 2);

      // Act
      const composition = composedAfter(effect, 12);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-squish-motion-effect.test.js