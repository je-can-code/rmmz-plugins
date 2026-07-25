//region plugins/_base/_component/parse-plugin-int.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J.BASE.Helpers.parsePluginInt', () =>
{
  let parsePluginInt;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code- populates globalThis.J.BASE.Helpers.parsePluginInt.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ parsePluginInt } = globalThis.J.BASE.Helpers);
  });

  describe('when the value is undefined, null, or an empty string', () =>
  {
    it('returns the fallback for undefined', () =>
    {
      // Arrange
      const value = undefined;
      const fallback = 42;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(42);
    });

    it('returns the fallback for null', () =>
    {
      // Arrange
      const value = null;
      const fallback = -1;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(-1);
    });

    it('returns the fallback for an empty string', () =>
    {
      // Arrange
      const value = '';
      const fallback = 99;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(99);
    });
  });

  describe('when the value parses to a finite integer', () =>
  {
    it('parses "0"', () =>
    {
      // Arrange
      const value = '0';
      const fallback = 7;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(0);
    });

    it('parses a positive integer string', () =>
    {
      // Arrange
      const value = '42';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(42);
    });

    it('parses a negative integer string, preserving the sign', () =>
    {
      // Arrange
      const value = '-3';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(-3);
    });

    it('trims surrounding whitespace before parsing', () =>
    {
      // Arrange
      const value = '  12  ';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(12);
    });

    it('coerces a finite number by stringifying it first', () =>
    {
      // Arrange
      const value = 8;
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(8);
    });

    it('truncates a float number to its integer part', () =>
    {
      // Arrange
      const value = 3.9;
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(3);
    });

    it('uses radix 10, so a hex-looking string parses as 0, not 16', () =>
    {
      // Arrange
      const value = '0x10';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(0);
    });

    it('parses the leading digits and ignores trailing non-digit junk', () =>
    {
      // Arrange
      const value = '99abc';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(99);
    });
  });

  describe('when the value does not parse to a finite integer', () =>
  {
    it('returns the fallback for a non-numeric string', () =>
    {
      // Arrange
      const value = 'not-a-number';
      const fallback = 0;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(0);
    });

    it('returns a negative fallback unchanged for a non-numeric string', () =>
    {
      // Arrange
      const value = 'not-a-number';
      const fallback = -5;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(result).toBe(-5);
    });

    it('returns a NaN fallback when the fallback itself is NaN', () =>
    {
      // Arrange
      const value = 'x';
      const fallback = NaN;

      // Act
      const result = parsePluginInt(value, fallback);

      // Assert
      expect(Number.isNaN(result)).toBe(true);
    });
  });
});
//endregion plugins/_base/_component/parse-plugin-int.test.js
