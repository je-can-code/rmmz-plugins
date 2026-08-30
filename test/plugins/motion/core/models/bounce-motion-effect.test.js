//region plugins/motion/core/models/bounce-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('BounceMotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/BounceMotionEffect.js').default} */
  let BounceMotionEffect;

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
    ({ default: BounceMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/BounceMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a hop sitting a given number of frames into its cycle.
   * @param {Object} parameters The resolved parameters.
   * @param {number} phaseOffset Where in the cycle to sit.
   * @returns {Object} The effect.
   */
  const aHopAt = (parameters, phaseOffset) =>
  {
    const declaration = new MotionDeclaration('hop', [], 'page');

    return new BounceMotionEffect(declaration, parameters, phaseOffset);
  };

  /**
   * Reads the vertical offset an effect contributes.
   * @param {Object} effect The effect to apply.
   * @returns {number} The offset.
   */
  const heightOf = effect =>
  {
    const composition = new MotionComposition();
    effect.applyTo(composition);

    return composition.valueFor(MotionChannels.OFFSET_Y);
  };

  describe('the arc', () =>
  {
    it('starts on the ground', () =>
    {
      // Arrange
      const effect = aHopAt({ height: 20, duration: 20, rest: 10 }, 0);

      // Assert
      expect(heightOf(effect)).toBe(0);
    });

    it('reaches its full height at the top of the arc', () =>
    {
      // Arrange
      const effect = aHopAt({ height: 20, duration: 20, rest: 10 }, 10);

      // Assert
      expect(heightOf(effect)).toBeCloseTo(-20, 10);
    });

    it('is on the way up before the peak and on the way down after it', () =>
    {
      // Arrange
      const rising = aHopAt({ height: 20, duration: 20, rest: 10 }, 5);
      const falling = aHopAt({ height: 20, duration: 20, rest: 10 }, 15);

      // Assert
      expect(heightOf(rising)).toBeCloseTo(heightOf(falling), 10);
      expect(heightOf(rising)).toBeLessThan(-1);
    });

    it('never travels below the ground it left', () =>
    {
      // Arrange
      const samples = [ 0, 3, 7, 10, 13, 17, 19 ];

      // Act
      const heights = samples.map(offset => heightOf(aHopAt({ height: 20, duration: 20, rest: 10 }, offset)));

      // Assert
      heights.forEach(height => expect(height).toBeLessThanOrEqual(0));
    });
  });

  describe('the rest', () =>
  {
    it('sits flat on the ground for the whole of the pause', () =>
    {
      // Arrange
      const justLanded = aHopAt({ height: 20, duration: 20, rest: 10 }, 20);
      const midRest = aHopAt({ height: 20, duration: 20, rest: 10 }, 25);
      const aboutToLeap = aHopAt({ height: 20, duration: 20, rest: 10 }, 29);

      // Assert
      expect(heightOf(justLanded)).toBe(0);
      expect(heightOf(midRest)).toBe(0);
      expect(heightOf(aboutToLeap)).toBe(0);
    });

    it('leaps again once the rest has elapsed', () =>
    {
      // Arrange
      const nextCycle = aHopAt({ height: 20, duration: 20, rest: 10 }, 40);

      // Assert
      expect(heightOf(nextCycle)).toBeCloseTo(-20, 10);
    });

    it('bounces without pausing when no rest was asked for', () =>
    {
      // Arrange
      const justLanded = aHopAt({ height: 20, duration: 20, rest: 0 }, 20);
      const nextPeak = aHopAt({ height: 20, duration: 20, rest: 0 }, 30);

      // Assert
      expect(justLanded.positionInCycle()).toBe(0);
      expect(heightOf(nextPeak)).toBeCloseTo(-20, 10);
    });
  });

  describe('advancing', () =>
  {
    it('moves through the cycle with the frames that elapse', () =>
    {
      // Arrange
      const effect = aHopAt({ height: 20, duration: 20, rest: 10 }, 0);

      // Act
      const ticks = 10;
      for (let index = 0; index < ticks; index++)
      {
        effect.tick();
      }

      // Assert
      expect(heightOf(effect)).toBeCloseTo(-20, 10);
    });
  });
});
//endregion plugins/motion/core/models/bounce-motion-effect.test.js