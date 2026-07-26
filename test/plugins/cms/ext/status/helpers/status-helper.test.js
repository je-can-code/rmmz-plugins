//region plugins/cms/ext/status/helpers/status-helper.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import StatusHelper from '../../../../../../src/plugins/cms/ext/status/helpers/StatusHelper.js';

describe('StatusHelper', () =>
{
  beforeAll(() =>
  {
    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';
  });

  describe('toPercentString', () =>
  {
    it('formats a whole number without decimals', () =>
    {
      // Arrange
      const percent = 25;

      // Act
      const result = StatusHelper.toPercentString(percent, false);

      // Assert
      expect(result).toEqual('25%');
    });

    it('formats a fractional number to one decimal place', () =>
    {
      // Arrange
      const percent = 25.456;

      // Act
      const result = StatusHelper.toPercentString(percent, false);

      // Assert
      expect(result).toEqual('25.5%');
    });

    it('prefixes a plus sign for a signed non-negative value', () =>
    {
      // Arrange
      const percent = 25;

      // Act
      const result = StatusHelper.toPercentString(percent, true);

      // Assert
      expect(result).toEqual('+25%');
    });

    it('prefixes a plus sign for a signed zero value', () =>
    {
      // Arrange
      const percent = 0;

      // Act
      const result = StatusHelper.toPercentString(percent, true);

      // Assert
      expect(result).toEqual('+0%');
    });

    it('does not prefix a plus sign for a signed negative value', () =>
    {
      // Arrange
      const percent = -25;

      // Act
      const result = StatusHelper.toPercentString(percent, true);

      // Assert
      expect(result).toEqual('-25%');
    });

    it('does not prefix a plus sign when unsigned even if positive', () =>
    {
      // Arrange
      const percent = 25;

      // Act
      const result = StatusHelper.toPercentString(percent, false);

      // Assert
      expect(result).toEqual('25%');
    });
  });

  describe('toRateString', () =>
  {
    it('converts a rate above 1.0 into a positive signed percent delta', () =>
    {
      // Arrange
      const rate = 1.2;

      // Act
      const result = StatusHelper.toRateString(rate);

      // Assert
      // floating-point subtraction makes (1.2 - 1) * 100 land on 19.999999999999996, not a clean
      // integer, so this exercises the toFixed(1) decimal branch rather than the whole-number one.
      expect(result).toEqual('+20.0%');
    });

    it('converts a rate below 1.0 into a negative percent delta', () =>
    {
      // Arrange
      const rate = 0.75;

      // Act
      const result = StatusHelper.toRateString(rate);

      // Assert
      expect(result).toEqual('-25%');
    });

    it('converts a rate of exactly 1.0 into a signed zero delta', () =>
    {
      // Arrange
      const rate = 1.0;

      // Act
      const result = StatusHelper.toRateString(rate);

      // Assert
      expect(result).toEqual('+0%');
    });
  });
});
//endregion plugins/cms/ext/status/helpers/status-helper.test.js
