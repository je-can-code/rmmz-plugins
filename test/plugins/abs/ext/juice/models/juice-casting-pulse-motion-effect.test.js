//region plugins/abs/ext/juice/models/juice-casting-pulse-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installJuiceMotionGlobals } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceCastingPulseMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingPulseMotionEffect.js').default} */
  let JuiceCastingPulseMotionEffect;

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
    ({ default: JuiceCastingPulseMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceCastingPulseMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a casting pulse at the given amplitude.
   * @param {number} amplitude How far the body swells at the peak of a pulse.
   * @returns {Object} The effect.
   */
  const aPulse = amplitude =>
  {
    const declaration = new MotionDeclaration('charge', [ amplitude ], 'combat:reaction');

    return new JuiceCastingPulseMotionEffect(declaration, { amplitude }, 0);
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

  describe('claims', () =>
  {
    it('takes exclusive ownership of both scale axes', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toContain(MotionChannels.SCALE_X);
      expect(claimed).toContain(MotionChannels.SCALE_Y);
    });

    it('leaves the glow unclaimed, so it resolves against other flashes by strength', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).not.toContain(MotionChannels.FLASH);
    });
  });

  describe('periodFrames', () =>
  {
    it('starts at the slow end of the ramp', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const period = effect.periodFrames();

      // Assert
      expect(period).toBe(60);
    });

    it('has contracted partway through the ramp', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.04), 90);

      // Act
      const period = effect.periodFrames();

      // Assert
      expect(period).toBe(42);
    });

    it('reaches the fast end exactly when the ramp is spent', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.04), 180);

      // Act
      const period = effect.periodFrames();

      // Assert
      expect(period).toBe(24);
    });

    it('settles there rather than contracting forever on a very long cast', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.04), 600);

      // Act
      const period = effect.periodFrames();

      // Assert
      expect(period).toBe(24);
    });
  });

  describe('wave', () =>
  {
    it('begins at the middle of a swell', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const wave = effect.wave();

      // Assert
      expect(wave).toBe(0);
    });

    it('has risen toward the top of the first swell a quarter of a period in', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.04), 15);

      // Act
      const wave = effect.wave();

      // Assert
      expect(wave).toBeCloseTo(0.99658, 4);
    });
  });

  describe('glowFor', () =>
  {
    it('is dark at the bottom of a swell', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const glow = effect.glowFor(-1);

      // Assert
      expect(glow).toStrictEqual([ 180, 220, 255, 0 ]);
    });

    it('is at full strength at the top of a swell', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const glow = effect.glowFor(1);

      // Assert
      expect(glow).toStrictEqual([ 180, 220, 255, 96 ]);
    });

    it('is halfway lit in the middle of a swell', () =>
    {
      // Arrange
      const effect = aPulse(0.04);

      // Act
      const glow = effect.glowFor(0);

      // Assert
      expect(glow).toStrictEqual([ 180, 220, 255, 48 ]);
    });
  });

  describe('applyTo', () =>
  {
    it('swells both axes together, because a charge-up deforms nothing', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.5), 15);
      const composition = new MotionComposition();

      // Act
      effect.applyTo(composition);

      // Assert
      const scaleX = composition.valueFor(MotionChannels.SCALE_X);
      expect(scaleX).toBeCloseTo(1.49829, 4);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(scaleX);
    });

    it('writes the charge glow into the flash channel', () =>
    {
      // Arrange
      const effect = advanced(aPulse(0.5), 15);
      const composition = new MotionComposition();

      // Act
      effect.applyTo(composition);

      // Assert
      expect(composition.valueFor(MotionChannels.FLASH)).toStrictEqual([ 180, 220, 255, 96 ]);
    });

    it('scales the swell by the amplitude it was given', () =>
    {
      // Arrange
      const gentle = advanced(aPulse(0.1), 15);
      const composition = new MotionComposition();

      // Act
      gentle.applyTo(composition);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.09966, 4);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-casting-pulse-motion-effect.test.js