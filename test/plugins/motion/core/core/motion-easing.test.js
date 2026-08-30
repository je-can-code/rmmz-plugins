//region plugins/motion/core/core/motion-easing.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionEasing', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionEasing.js').default} */
  let MotionEasing;

  beforeAll(async () =>
  {
    // `normalize` leans on the engine's own Number#clamp, which no bare realm has.
    installMotionHostGlobals();

    ({ default: MotionEasing } = await import('../../../../../src/plugins/motion/core/core/MotionEasing.js'));
  });

  describe('normalize', () =>
  {
    it('passes a value already inside the range through untouched', () =>
    {
      // Arrange
      const inRange = 0.25;

      // Act
      const normalized = MotionEasing.normalize(inRange);

      // Assert
      expect(normalized).toBe(0.25);
    });

    it('pulls a value above the range back to one', () =>
    {
      // Arrange
      const overshot = 1.75;

      // Act
      const normalized = MotionEasing.normalize(overshot);

      // Assert
      expect(normalized).toBe(1);
    });

    it('pulls a value below the range up to zero', () =>
    {
      // Arrange
      const undershot = -0.5;

      // Act
      const normalized = MotionEasing.normalize(undershot);

      // Assert
      expect(normalized).toBe(0);
    });
  });

  describe('easeOutQuad', () =>
  {
    it('starts at zero', () =>
    {
      // Act
      const eased = MotionEasing.easeOutQuad(0);

      // Assert
      expect(eased).toBe(0);
    });

    it('finishes at one', () =>
    {
      // Act
      const eased = MotionEasing.easeOutQuad(1);

      // Assert
      expect(eased).toBe(1);
    });

    it('is already past the midpoint at half progress, because it decelerates', () =>
    {
      // Act
      const eased = MotionEasing.easeOutQuad(0.5);

      // Assert
      expect(eased).toBe(0.75);
    });

    it('holds at one when progress overshoots', () =>
    {
      // Act
      const eased = MotionEasing.easeOutQuad(2);

      // Assert
      expect(eased).toBe(1);
    });
  });

  describe('easeInQuad', () =>
  {
    it('starts at zero', () =>
    {
      // Act
      const eased = MotionEasing.easeInQuad(0);

      // Assert
      expect(eased).toBe(0);
    });

    it('finishes at one', () =>
    {
      // Act
      const eased = MotionEasing.easeInQuad(1);

      // Assert
      expect(eased).toBe(1);
    });

    it('is still short of the midpoint at half progress, because it accelerates', () =>
    {
      // Act
      const eased = MotionEasing.easeInQuad(0.5);

      // Assert
      expect(eased).toBe(0.25);
    });
  });

  describe('linear', () =>
  {
    it('sits exactly at the midpoint at half progress', () =>
    {
      // Act
      const eased = MotionEasing.linear(0.5);

      // Assert
      expect(eased).toBe(0.5);
    });

    it('clamps an overshoot rather than continuing past the target', () =>
    {
      // Act
      const eased = MotionEasing.linear(1.4);

      // Assert
      expect(eased).toBe(1);
    });
  });
});
//endregion plugins/motion/core/core/motion-easing.test.js