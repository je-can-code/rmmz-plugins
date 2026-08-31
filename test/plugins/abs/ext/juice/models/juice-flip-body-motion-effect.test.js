//region plugins/abs/ext/juice/models/juice-flip-body-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installJuiceMotionGlobals } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceFlipBodyMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceFlipBodyMotionEffect.js').default} */
  let JuiceFlipBodyMotionEffect;

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
    ({ default: JuiceFlipBodyMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceFlipBodyMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a flip with the given shape.
   * @param {number} turns How many complete turns to make.
   * @param {number} duration How long the whole flip takes.
   * @param {string} direction Which way it turns.
   * @returns {Object} The effect.
   */
  const aFlip = (turns, duration, direction) =>
  {
    const parameters = { turns, duration, direction };
    const declaration = new MotionDeclaration('flip', [ turns, duration, direction ], 'combat:reaction');

    return new JuiceFlipBodyMotionEffect(declaration, parameters, 0);
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
      const effect = aFlip(1, 24, 'cw');

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toStrictEqual([ MotionChannels.ROTATION ]);
    });
  });

  describe('directionSign', () =>
  {
    it('turns clockwise when asked to', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'cw');

      // Act
      const sign = effect.directionSign();

      // Assert
      expect(sign).toBe(1);
    });

    it('turns counter-clockwise when asked to', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'ccw');

      // Act
      const sign = effect.directionSign();

      // Assert
      expect(sign).toBe(-1);
    });

    it('turns clockwise for a direction nobody recognises, rather than standing still', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'widdershins');

      // Act
      const sign = effect.directionSign();

      // Assert
      expect(sign).toBe(1);
    });
  });

  describe('currentRotation', () =>
  {
    it('has travelled a quarter turn a quarter of the way through', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'cw');

      // Act
      for (let index = 0; index < 6; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(Math.PI / 2, 10);
    });

    it('lands on a whole number of turns at the end, so nothing snaps when it is withdrawn', () =>
    {
      // Arrange
      const effect = aFlip(2, 24, 'cw');

      // Act
      for (let index = 0; index < 24; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(4 * Math.PI, 10);
    });

    it('travels the same distance backwards when turning counter-clockwise', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'ccw');

      // Act
      for (let index = 0; index < 6; index++)
      {
        effect.tick();
      }

      // Assert
      expect(effect.currentRotation()).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe('applyTo', () =>
  {
    it('writes the current angle into the rotation channel', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'cw');

      // Act
      const composition = composedAfter(effect, 12);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(Math.PI, 10);
    });

    it('asks the view to rotate about the middle, so the body turns rather than orbiting its feet', () =>
    {
      // Arrange
      const effect = aFlip(1, 24, 'cw');

      // Act
      const composition = composedAfter(effect, 1);

      // Assert
      expect(composition.hasCenterRotation()).toBe(true);
    });

    it('leaves the pivot alone when something else owns the rotation', () =>
    {
      // Arrange- a battler killed mid-flip is the real case. The collapse claims rotation and
      // topples the body about its feet on purpose, so a flip that kept asking for a centred pivot
      // would hoist the corpse half a body-height into the air for the whole death.
      const effect = aFlip(1, 24, 'cw');
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, { name: 'the-collapse' });

      // Act
      effect.tick();
      effect.applyTo(composition);

      // Assert
      expect(composition.hasCenterRotation()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/juice/models/juice-flip-body-motion-effect.test.js