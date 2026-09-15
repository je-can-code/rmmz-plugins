//region plugins/lighting/core/core/lighting-color.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('LightingColor', () =>
{
  let LightingColor;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: LightingColor } =
      await import('../../../../../src/plugins/lighting/core/core/LightingColor.js'));
  });

  describe('isValidHex', () =>
  {
    it('accepts a full six-digit colour', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#ffbb73');

      // Assert
      expect(result).toBe(true);
    });

    it('accepts a three-digit shorthand colour', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#fb7');

      // Assert
      expect(result).toBe(true);
    });

    it('accepts uppercase digits', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#FFBB73');

      // Assert
      expect(result).toBe(true);
    });

    it('rejects a colour missing its hash', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('ffbb73');

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a digit that is not hexadecimal', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#ggg');

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a colour of the wrong length', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#ffbb7');

      // Assert
      expect(result).toBe(false);
    });

    it('rejects trailing digits past a valid colour, rather than matching the prefix', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('#ffbb733');

      // Assert
      expect(result).toBe(false);
    });

    it('rejects the flicker keyword, which sits next to the colour slot positionally', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.isValidHex('flicker');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toRgb', () =>
  {
    it('splits a six-digit colour into its three channels', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toRgb('#ffbb73');

      // Assert
      expect(result).toEqual([ 255, 187, 115 ]);
    });

    it('expands a three-digit shorthand by doubling each digit', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toRgb('#fb7');

      // Assert
      expect(result).toEqual([ 255, 187, 119 ]);
    });

    it('reads a colour whose channels differ from one another', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toRgb('#0a2a2a');

      // Assert
      expect(result).toEqual([ 10, 42, 42 ]);
    });

    it('reads pure black as three zeroes', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toRgb('#000000');

      // Assert
      expect(result).toEqual([ 0, 0, 0 ]);
    });
  });

  describe('toTintNumber', () =>
  {
    it('packs three channels into one integer', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toTintNumber([ 255, 187, 115 ]);

      // Assert
      expect(result).toBe(0xffbb73);
    });

    it('keeps a low red channel out of the green and blue bytes', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toTintNumber([ 10, 42, 42 ]);

      // Assert
      expect(result).toBe(0x0a2a2a);
    });

    it('packs black as zero', () =>
    {
      // Arrange
      // Act
      const result = LightingColor.toTintNumber([ 0, 0, 0 ]);

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/lighting/core/core/lighting-color.test.js