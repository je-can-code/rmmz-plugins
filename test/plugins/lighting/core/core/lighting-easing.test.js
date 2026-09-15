//region plugins/lighting/core/core/lighting-easing.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('LightingEasing', () =>
{
  let LightingEasing;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: LightingEasing } =
      await import('../../../../../src/plugins/lighting/core/core/LightingEasing.js'));
  });

  describe('randomPhase', () =>
  {
    it('lands somewhere inside a single full cycle', () =>
    {
      // Arrange
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // Act
      const result = LightingEasing.randomPhase();
      random.mockRestore();

      // Assert
      expect(result).toBeCloseTo(Math.PI, 10);
    });

    it('starts at the beginning of the cycle at the bottom of the range', () =>
    {
      // Arrange
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);

      // Act
      const result = LightingEasing.randomPhase();
      random.mockRestore();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('flickerStrength', () =>
  {
    it('never brightens a light past the strength its author asked for', () =>
    {
      // Arrange
      const samples = [];

      // Act
      for (let frame = 0; frame < 2000; frame++)
      {
        samples.push(LightingEasing.flickerStrength(frame, 0, 0.18, 40));
      }

      // Assert
      expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    });

    it('never dims a light below the depth its author asked for', () =>
    {
      // Arrange
      const samples = [];

      // Act
      for (let frame = 0; frame < 2000; frame++)
      {
        samples.push(LightingEasing.flickerStrength(frame, 0, 0.18, 40));
      }

      // Assert
      expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.82);
    });

    it('actually moves, rather than sitting at one brightness', () =>
    {
      // Arrange
      const first = LightingEasing.flickerStrength(0, 0, 0.5, 40);

      // Act
      const later = LightingEasing.flickerStrength(11, 0, 0.5, 40);

      // Assert
      expect(later).not.toBeCloseTo(first, 3);
    });

    it('gives two lights different brightnesses at the same instant when their phases differ', () =>
    {
      // Arrange
      const torch = LightingEasing.flickerStrength(60, 0, 0.5, 40);

      // Act
      const otherTorch = LightingEasing.flickerStrength(60, 1.7, 0.5, 40);

      // Assert
      expect(otherTorch).not.toBeCloseTo(torch, 3);
    });

    it('holds a light perfectly steady when its flicker has no depth', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.flickerStrength(37, 1.2, 0, 40);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('stepToward', () =>
  {
    it('arrives exactly on the final frame rather than approaching forever', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.stepToward(40, 100, 1);

      // Assert
      expect(result).toBe(100);
    });

    it('arrives exactly when there are no frames left at all', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.stepToward(40, 100, 0);

      // Assert
      expect(result).toBe(100);
    });

    it('closes one frame worth of the remaining distance', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.stepToward(0, 100, 4);

      // Assert
      expect(result).toBe(25);
    });

    it('converges on the destination over a full journey', () =>
    {
      // Arrange
      let value = 0;

      // Act
      for (let remaining = 60; remaining >= 1; remaining--)
      {
        value = LightingEasing.stepToward(value, 100, remaining);
      }

      // Assert
      expect(value).toBeCloseTo(100, 10);
    });

    it('travels downward toward a destination beneath where it started', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.stepToward(100, 0, 4);

      // Assert
      expect(result).toBe(75);
    });
  });
});
//endregion plugins/lighting/core/core/lighting-easing.test.js