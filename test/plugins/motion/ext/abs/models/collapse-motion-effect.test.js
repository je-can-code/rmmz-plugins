//region plugins/motion/ext/abs/models/collapse-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

describe('CollapseMotionEffect', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/models/CollapseMotionEffect.js').default} */
  let CollapseMotionEffect;

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
    ({ default: CollapseMotionEffect } =
      await import('../../../../../../src/plugins/motion/ext/abs/models/CollapseMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds a collapse of a given style.
   * @param {string} style The death style.
   * @param {number} duration How long the collapse runs.
   * @returns {Object} The effect.
   */
  const aCollapse = (style, duration) =>
  {
    const declaration = new MotionDeclaration('collapse', [ style, duration ], 'combat:death');

    return new CollapseMotionEffect(declaration, { style, duration }, 0);
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
    it('takes exclusive ownership of everything that could still animate a corpse', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).toContain(MotionChannels.SCALE_X);
      expect(claimed).toContain(MotionChannels.SCALE_Y);
      expect(claimed).toContain(MotionChannels.OPACITY);
      expect(claimed).toContain(MotionChannels.ROTATION);
      expect(claimed).toContain(MotionChannels.OFFSET_Y);
    });

    it('leaves the colour channels alone, so a tinted enemy dies tinted', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const claimed = effect.claims();

      // Assert
      expect(claimed).not.toContain(MotionChannels.TINT);
      expect(claimed).not.toContain(MotionChannels.HUE);
    });
  });

  describe('isDiscardable', () =>
  {
    it('refuses to be forgotten while the body is still on the map', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      composedAfter(effect, 300);

      // Assert
      expect(effect.isDiscardable()).toBe(false);
    });

    it('lets go once whatever owned it withdraws the declaration', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      effect.requestRemoval();

      // Assert
      expect(effect.isDiscardable()).toBe(true);
    });
  });

  describe('progress', () =>
  {
    it('starts at the beginning', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Assert
      expect(effect.progress()).toBe(0);
    });

    it('reaches the end exactly as the duration elapses', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      composedAfter(effect, 30);

      // Assert
      expect(effect.progress()).toBe(1);
    });

    it('holds at the end rather than running past it', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      composedAfter(effect, 90);

      // Assert
      expect(effect.progress()).toBe(1);
    });
  });

  describe('swift', () =>
  {
    it('starts at full size and full opacity', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const composition = composedAfter(effect, 0);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(1);
    });

    it('crushes the body flat and to nothing by the end', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const composition = composedAfter(effect, 30);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(0);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('widens as it flattens, which is what sells it as being crushed', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const composition = composedAfter(effect, 30);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.35, 10);
    });

    it('neither turns nor lifts the body', () =>
    {
      // Arrange
      const effect = aCollapse('swift', 30);

      // Act
      const composition = composedAfter(effect, 15);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });
  });

  describe('moderate', () =>
  {
    it('has not tipped at all before it starts', () =>
    {
      // Arrange
      const effect = aCollapse('moderate', 60);

      // Act
      const composition = composedAfter(effect, 0);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBe(0);
    });

    it('finishes flat on its side', () =>
    {
      // Arrange
      const effect = aCollapse('moderate', 60);

      // Act
      const composition = composedAfter(effect, 60);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('is gone by the time it lands', () =>
    {
      // Arrange
      const effect = aCollapse('moderate', 60);

      // Act
      const composition = composedAfter(effect, 60);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0, 10);
    });

    it('accelerates into the fall rather than tipping at a constant rate', () =>
    {
      // Arrange
      const effect = aCollapse('moderate', 60);

      // Act
      const composition = composedAfter(effect, 30);
      const halfway = Math.PI / 4;

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeLessThan(halfway);
    });

    it('keeps its width, unlike the swift death', () =>
    {
      // Arrange
      const effect = aCollapse('moderate', 60);

      // Act
      const composition = composedAfter(effect, 60);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
    });
  });

  describe('slow', () =>
  {
    it('starts whole', () =>
    {
      // Arrange
      const effect = aCollapse('slow', 120);

      // Act
      const composition = composedAfter(effect, 0);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('shrinks on both axes together as it comes apart', () =>
    {
      // Arrange
      const effect = aCollapse('slow', 120);

      // Act
      const composition = composedAfter(effect, 120);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.6, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(0.6, 10);
    });

    it('sinks into the ground as it goes', () =>
    {
      // Arrange
      const effect = aCollapse('slow', 120);

      // Act
      const composition = composedAfter(effect, 120);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(8, 10);
    });

    it('is completely gone at the end regardless of where the shimmer sits', () =>
    {
      // Arrange
      const effect = aCollapse('slow', 120);

      // Act
      const composition = composedAfter(effect, 120);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('shimmers, so its opacity is not a straight line down', () =>
    {
      // Arrange- six shimmer cycles across 120 frames is one cycle every 20, so frame 15 sits in a
      // trough and frame 25 on the next peak. A body that merely faded would be strictly dimmer at
      // the later sample; this one is brighter, which is the shimmer and nothing else.
      const early = aCollapse('slow', 120);
      const later = aCollapse('slow', 120);

      // Act
      const earlyOpacity = composedAfter(early, 15)
        .valueFor(MotionChannels.OPACITY);
      const laterOpacity = composedAfter(later, 25)
        .valueFor(MotionChannels.OPACITY);

      // Assert
      expect(laterOpacity).toBeGreaterThan(earlyOpacity);
    });

    it('does not turn the body over', () =>
    {
      // Arrange
      const effect = aCollapse('slow', 120);

      // Act
      const composition = composedAfter(effect, 60);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBe(0);
    });
  });

  describe('an unrecognised style', () =>
  {
    it('dies the swift death rather than not dying at all', () =>
    {
      // Arrange
      const effect = aCollapse('spectacular', 30);

      // Act
      const composition = composedAfter(effect, 30);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(0);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.35, 10);
    });
  });
});
//endregion plugins/motion/ext/abs/models/collapse-motion-effect.test.js