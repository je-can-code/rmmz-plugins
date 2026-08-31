//region plugins/motion/core/models/transition-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('TransitionMotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/TransitionMotionEffect.js').default} */
  let TransitionMotionEffect;

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
    ({ default: TransitionMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/TransitionMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a transition of a given kind.
   * @param {string} motionType The motion being built.
   * @param {Object} parameters The resolved parameters.
   * @returns {Object} The effect.
   */
  const aTransition = (motionType, parameters) =>
  {
    const declaration = new MotionDeclaration(motionType, [], 'state:42');

    return new TransitionMotionEffect(declaration, parameters, 0);
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

  /**
   * Advances an effect by a number of frames.
   * @param {Object} effect The effect to advance.
   * @param {number} frames How many frames to pass.
   */
  const advance = (effect, frames) =>
  {
    for (let index = 0; index < frames; index++)
    {
      effect.tick();
    }
  };

  describe('travelling out', () =>
  {
    it('starts at the channel\'s rest state', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1.0);
    });

    it('arrives at its target once the duration has elapsed', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });

      // Act
      advance(effect, 30);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
    });

    it('is already past halfway at half the duration, because it decelerates', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 200, duration: 40 });

      // Act
      advance(effect, 20);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.75, 10);
    });

    it('holds at its target rather than travelling past it', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });

      // Act
      advance(effect, 300);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
    });

    it('drives both scale channels together', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });

      // Act
      advance(effect, 30);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.5, 10);
    });
  });

  describe('the target of each kind', () =>
  {
    it('turns an authored angle into radians', () =>
    {
      // Arrange
      const effect = aTransition('angle', { degrees: 90, duration: 10 });

      // Act
      advance(effect, 10);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('turns an authored opacity percentage into a multiplier', () =>
    {
      // Arrange
      const effect = aTransition('fade', { percent: 40, duration: 10 });

      // Act
      advance(effect, 10);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.4, 10);
    });

    it('leaves a hue in the degrees it was authored in', () =>
    {
      // Arrange
      const effect = aTransition('hue', { degrees: 120, duration: 10 });

      // Act
      advance(effect, 10);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.HUE)).toBeCloseTo(120, 10);
    });

    it('blends a tint component by component from white', () =>
    {
      // Arrange
      const effect = aTransition('tint', { color: [ 255, 0, 0 ], duration: 10 });

      // Act
      advance(effect, 10);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.TINT)).toEqual([ 255, 0, 0 ]);
    });

    it('starts a tint at white rather than at black', () =>
    {
      // Arrange
      const effect = aTransition('tint', { color: [ 255, 0, 0 ], duration: 10 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.TINT)).toEqual([ 255, 255, 255 ]);
    });
  });

  describe('travelling home', () =>
  {
    it('is not discardable while its declaration still stands', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });

      // Act
      advance(effect, 300);

      // Assert
      expect(effect.isDiscardable()).toBe(false);
    });

    it('is not discardable while it holds an instant transition', () =>
    {
      // Arrange- an authored duration of zero arrives at its target on the first frame, which makes
      // the release counter and the duration both zero. Without the guard on whether removal was
      // even asked for, a transition holding a channel would report itself discardable immediately
      // and the character would snap back the frame after it grew.
      const effect = aTransition('scale', { percent: 150, duration: 0 });
      advance(effect, 5);

      // Assert
      expect(effect.isDiscardable()).toBe(false);
    });

    it('is not discardable the moment its declaration is withdrawn', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });
      advance(effect, 30);

      // Act
      effect.requestRemoval();

      // Assert
      expect(effect.isDiscardable()).toBe(false);
    });

    it('travels back toward the rest state after being withdrawn', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 200, duration: 40 });
      advance(effect, 40);
      effect.requestRemoval();

      // Act
      advance(effect, 20);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.25, 10);
    });

    it('becomes discardable once it has finished travelling home', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });
      advance(effect, 30);
      effect.requestRemoval();

      // Act
      advance(effect, 30);

      // Assert
      expect(effect.isDiscardable()).toBe(true);
    });

    it('arrives exactly at the rest state, not merely near it', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 150, duration: 30 });
      advance(effect, 30);
      effect.requestRemoval();

      // Act
      advance(effect, 30);
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.0, 10);
    });

    it('starts its journey home from where it actually was, not from its target', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 200, duration: 40 });
      advance(effect, 20);

      // Act
      effect.requestRemoval();
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.75, 10);
    });

    it('ignores a second withdrawal, rather than restarting the journey further out', () =>
    {
      // Arrange- the origin is captured from where the OUTBOUND journey would be by now, which
      // keeps advancing even while the effect is travelling home. Re-capturing it would jump the
      // channel back outward and ease home a second time from there.
      const effect = aTransition('scale', { percent: 200, duration: 40 });
      advance(effect, 20);
      effect.requestRemoval();
      advance(effect, 10);

      // Act
      effect.requestRemoval();
      const composition = composedFrom(effect);

      // Assert- re-capturing would restart from 1.9375 instead of 1.75 and report 1.52734 here.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.421875, 10);
    });
  });

  describe('cancelRemoval', () =>
  {
    it('abandons the journey home and carries on to the target', () =>
    {
      // Arrange
      const effect = aTransition('scale', { percent: 200, duration: 40 });
      advance(effect, 20);
      effect.requestRemoval();
      advance(effect, 10);

      // Act
      effect.cancelRemoval();
      const composition = composedFrom(effect);

      // Assert- back on the outbound curve, and no longer counting down to being forgotten.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.9375, 10);
      expect(effect.isDiscardable()).toBe(false);
    });

    it('starts a later withdrawal over from where the sprite has got to', () =>
    {
      // Arrange- the release values captured by the first withdrawal have to be forgotten, or the
      // next one eases home from a position the sprite left a long time ago.
      const effect = aTransition('scale', { percent: 200, duration: 40 });
      advance(effect, 10);
      effect.requestRemoval();
      effect.cancelRemoval();
      advance(effect, 30);

      // Act
      effect.requestRemoval();
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(2, 10);
    });
  });
});
//endregion plugins/motion/core/models/transition-motion-effect.test.js