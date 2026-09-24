//region plugins/motion/ext/abs/models/fold-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

describe('FoldMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/models/FoldMotionEffect.js').default} */
  let FoldMotionEffect;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/models/MotionComposition.js').default} */
  let MotionComposition;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: FoldMotionEffect } =
      await import('../../../../../../src/plugins/motion/ext/abs/models/FoldMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a fold running in one direction or the other.
   * @param {string} motionType Either `fold` or `unfold`.
   * @param {number} duration How long the fold runs.
   * @returns {Object} The effect.
   */
  const aFold = (motionType, duration) =>
  {
    const declaration = new MotionDeclaration(motionType, [ duration ], 'combat:presence');

    return new FoldMotionEffect(declaration, { duration }, 0);
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
    it('takes exclusive ownership of the width and the opacity it animates', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toEqual([ MotionChannels.SCALE_X, MotionChannels.OPACITY ]);
    });
  });

  describe('progress', () =>
  {
    it('reaches the halfway point at half the duration', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      composedAfter(effect, 15);

      // Assert
      expect(effect.progress()).toBe(0.5);
    });

    it('holds at the end once the duration has run out', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      composedAfter(effect, 90);

      // Assert
      expect(effect.progress()).toBe(1);
    });
  });

  describe('turnedAway', () =>
  {
    it('turns further away as a fold goes on', () =>
    {
      // Arrange
      const effect = aFold('fold', 40);

      // Act
      composedAfter(effect, 10);

      // Assert
      expect(effect.turnedAway()).toBe(0.25);
    });

    it('turns back toward the player as an unfold goes on', () =>
    {
      // Arrange
      const effect = aFold('unfold', 40);

      // Act
      composedAfter(effect, 10);

      // Assert
      expect(effect.turnedAway()).toBe(0.75);
    });
  });

  describe('applyTo', () =>
  {
    it('starts a fold facing the player at full strength', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      const composition = composedAfter(effect, 0);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(1);
    });

    it('narrows a fold by the cosine of its turn, and fades it by the square', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      const composition = composedAfter(effect, 15);

      // Assert- halfway through is an eighth of a turn: cos(45 degrees) wide, three quarters solid.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0.75);
    });

    it('finishes a fold edge-on and gone, and holds it there', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      const composition = composedAfter(effect, 45);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0, 10);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('starts an unfold edge-on and invisible', () =>
    {
      // Arrange
      const effect = aFold('unfold', 30);

      // Act
      const composition = composedAfter(effect, 0);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0, 10);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('plays an unfold as the exact reverse of a fold', () =>
    {
      // Arrange- a quarter of the way into unfolding is three quarters of the way into folding.
      const unfolding = aFold('unfold', 40);
      const folding = aFold('fold', 40);

      // Act
      const unfolded = composedAfter(unfolding, 10);
      const folded = composedAfter(folding, 30);

      // Assert
      expect(unfolded.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.38268343236508984, 10);
      expect(unfolded.valueFor(MotionChannels.OPACITY)).toBe(0.4375);
      expect(folded.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.38268343236508984, 10);
      expect(folded.valueFor(MotionChannels.OPACITY)).toBe(0.4375);
    });

    it('finishes an unfold exactly at rest, so withdrawing it changes nothing', () =>
    {
      // Arrange
      const effect = aFold('unfold', 30);

      // Act
      const composition = composedAfter(effect, 30);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(1);
    });

    it('leaves the height alone, which is what keeps it from reading as a death', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      const composition = composedAfter(effect, 20);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
      expect(composition.valueFor(MotionChannels.ROTATION)).toBe(0);
    });
  });

  describe('isDiscardable', () =>
  {
    it('holds a finished fold until whatever declared it withdraws it', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      composedAfter(effect, 300);

      // Assert
      expect(effect.isDiscardable()).toBe(false);
    });

    it('lets go once the declaration is withdrawn', () =>
    {
      // Arrange
      const effect = aFold('fold', 30);

      // Act
      effect.requestRemoval();

      // Assert
      expect(effect.isDiscardable()).toBe(true);
    });
  });
});
//endregion plugins/motion/ext/abs/models/fold-motion-effect.test.js