//region plugins/motion/core/models/spin-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('SpinMotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/SpinMotionEffect.js').default} */
  let SpinMotionEffect;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionComposition.js').default} */
  let MotionComposition;

  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: SpinMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/SpinMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a spin sitting a given number of frames into its rotation.
   * @param {Object} parameters The resolved parameters.
   * @param {number} phaseOffset Where in the rotation to sit.
   * @returns {Object} The effect.
   */
  const aSpinAt = (parameters, phaseOffset) =>
  {
    const declaration = new MotionDeclaration('spin', [], 'page');

    return new SpinMotionEffect(declaration, parameters, phaseOffset);
  };

  /**
   * Applies an effect to a fresh composition and hands it back.
   * @param {Object} effect The effect to apply.
   * @returns {Object} The composition.
   */
  const composedFrom = effect =>
  {
    const composition = new MotionComposition();
    effect.applyTo(composition);

    return composition;
  };

  describe('currentRotation', () =>
  {
    it('has not turned at all before any time has passed', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 0);

      // Assert
      expect(effect.currentRotation()).toBe(0);
    });

    it('completes a quarter turn a quarter of the way through its period', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 30);

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(Math.PI / 2, 10);
    });

    it('keeps accumulating past a full revolution rather than wrapping', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 240);

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(4 * Math.PI, 10);
    });

    it('advances with the frames that have elapsed', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 0);

      // Act
      const ticks = 30;
      for (let index = 0; index < ticks; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(Math.PI / 2, 10);
    });
  });

  describe('directionSign', () =>
  {
    it('turns clockwise when asked to', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 0);

      // Assert
      expect(effect.directionSign()).toBe(1);
    });

    it('turns counter-clockwise when asked to', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'ccw' }, 0);

      // Assert
      expect(effect.directionSign()).toBe(-1);
    });

    it('turns clockwise when the direction is a typo, rather than standing still', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'widdershins' }, 0);

      // Assert
      expect(effect.directionSign()).toBe(1);
    });

    it('carries the sign through to the rotation itself', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'ccw' }, 30);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe('applyTo', () =>
  {
    it('asks the view to rotate the sprite about its middle', () =>
    {
      // Arrange
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 30);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.hasCenterRotation()).toBe(true);
    });

    it('leaves the pivot alone when something else owns the rotation', () =>
    {
      // Arrange- a spin whose rotation is being discarded is invisible this frame, and moving the
      // sprite's anchor for an invisible rotation would lift it half its own height for nothing.
      const effect = aSpinAt({ period: 120, direction: 'cw' }, 30);
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, { name: 'somebody-else' });

      // Act
      effect.applyTo(composition);

      // Assert
      expect(composition.hasCenterRotation()).toBe(false);
    });
  });
});
//endregion plugins/motion/core/models/spin-motion-effect.test.js