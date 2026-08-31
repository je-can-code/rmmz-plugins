//region plugins/abs/ext/juice/models/juice-tilt-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installJuiceMotionGlobals } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceTiltMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceTiltMotionEffect.js').default} */
  let JuiceTiltMotionEffect;

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
    ({ default: JuiceTiltMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceTiltMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a tilt with the given shape.
   * @param {number} peak How far the body leans at the peak of the arc.
   * @param {number} duration How long the lean lasts.
   * @returns {Object} The effect.
   */
  const aTilt = (peak, duration) =>
  {
    const parameters = { peak, duration };
    const declaration = new MotionDeclaration('tilt', [ peak, duration ], 'combat:reaction');

    return new JuiceTiltMotionEffect(declaration, parameters, 0);
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
    it('takes exclusive ownership of rotation', () =>
    {
      // Arrange
      const effect = aTilt(0.4, 10);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toStrictEqual([ MotionChannels.ROTATION ]);
    });
  });

  describe('progress', () =>
  {
    it('reports how far through the lean a frame sits', () =>
    {
      // Arrange
      const effect = aTilt(0.4, 8);

      // Act
      effect.tick();
      effect.tick();

      // Assert
      expect(effect.progress()).toBeCloseTo(0.25, 10);
    });

    it('holds at the end rather than running past it', () =>
    {
      // Arrange
      const effect = aTilt(0.4, 4);

      // Act
      for (let index = 0; index < 9; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.progress()).toBe(1);
    });
  });

  describe('applyTo', () =>
  {
    it('starts at no rotation at all, so nothing snaps on the first frame', () =>
    {
      // Arrange
      const atRest = aTilt(0.8, 10);
      const oneFrameIn = aTilt(0.8, 10);

      // Act
      const start = composedAfter(atRest, 0)
        .valueFor(MotionChannels.ROTATION);
      const next = composedAfter(oneFrameIn, 1)
        .valueFor(MotionChannels.ROTATION);

      // Assert- the second value is what proves this ran. `0` is the rotation identity, so an
      // applyTo with no body at all would report it at the start and every frame after.
      expect(start).toBeCloseTo(0, 10);
      expect(next).toBeCloseTo(0.24721, 4);
    });

    it('reaches the full peak halfway through the lean', () =>
    {
      // Arrange
      const effect = aTilt(0.8, 8);

      // Act
      const composition = composedAfter(effect, 4);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(0.8, 10);
    });

    it('returns to no rotation by the end of the lean', () =>
    {
      // Arrange
      const nearlyDone = aTilt(0.8, 8);
      const done = aTilt(0.8, 8);

      // Act
      const penultimate = composedAfter(nearlyDone, 7)
        .valueFor(MotionChannels.ROTATION);
      const final = composedAfter(done, 8)
        .valueFor(MotionChannels.ROTATION);

      // Assert- the penultimate frame is the anchor. Landing on the identity only means something
      // if the frame before it was somewhere else, which is the property the expiry relies on.
      expect(penultimate).toBeCloseTo(0.30615, 4);
      expect(final).toBeCloseTo(0, 10);
    });

    it('leans the other way when handed a negative peak', () =>
    {
      // Arrange
      const effect = aTilt(-0.8, 8);

      // Act
      const composition = composedAfter(effect, 4);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(-0.8, 10);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-tilt-motion-effect.test.js