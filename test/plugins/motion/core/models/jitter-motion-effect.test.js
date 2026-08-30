//region plugins/motion/core/models/jitter-motion-effect.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('JitterMotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/JitterMotionEffect.js').default} */
  let JitterMotionEffect;

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
    ({ default: JitterMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/JitterMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  afterEach(() =>
  {
    // Math.random is stubbed per test rather than globally; restoring by hand keeps one test's
    // rigged rolls from leaking into the next file in the same worker.
    vi.restoreAllMocks();
  });

  /**
   * Builds a jitter of a given kind.
   * @param {string} motionType Either `shake` or `flicker`.
   * @param {Object} parameters The resolved parameters.
   * @returns {Object} The effect.
   */
  const aJitter = (motionType, parameters) =>
  {
    const declaration = new MotionDeclaration(motionType, [], 'page');

    return new JitterMotionEffect(declaration, parameters, 0);
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

  describe('shake', () =>
  {
    it('deflects to its full strength when the roll comes up high', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
    });

    it('deflects the other way when the roll comes up low', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(0);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(-6);
    });

    it('sits at rest when the roll comes up exactly in the middle', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.5);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
    });

    it('leaves the vertical alone when only the horizontal axis was asked for', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('leaves the horizontal alone when only the vertical axis was asked for', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('shake', { strength: 6, axis: 'y', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(6);
    });

    it('moves on both axes when both were asked for', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('shake', { strength: 6, axis: 'both', interval: 1 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(6);
    });
  });

  describe('flicker', () =>
  {
    it('reaches its authored maximum on a high roll', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('flicker', { min: 0.4, max: 0.9, interval: 6 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.9, 10);
    });

    it('reaches its authored minimum on a low roll', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(0);
      const effect = aJitter('flicker', { min: 0.4, max: 0.9, interval: 6 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.4, 10);
    });

    it('leaves position untouched, unlike a shake', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('flicker', { min: 0.4, max: 0.9, interval: 6 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
    });
  });

  describe('the holding interval', () =>
  {
    it('rolls immediately, so the motion is visible on its very first frame', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValue(1);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 10 });

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
    });

    it('holds the same value while the interval has not elapsed', () =>
    {
      // Arrange
      const rolls = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(1)
        .mockReturnValue(0);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 10 });

      // Act
      composedFrom(effect);
      effect.tick();
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
      expect(rolls).toHaveBeenCalledTimes(1);
    });

    it('rolls again once the interval has elapsed', () =>
    {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(1)
        .mockReturnValue(0);
      const effect = aJitter('shake', { strength: 6, axis: 'x', interval: 3 });

      // Act
      composedFrom(effect);
      const ticks = 3;
      for (let index = 0; index < ticks; index++)
      {
        effect.tick();
      }
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(-6);
    });
  });
});
//endregion plugins/motion/core/models/jitter-motion-effect.test.js