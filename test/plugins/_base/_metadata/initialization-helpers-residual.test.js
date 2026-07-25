//region plugins/_base/_metadata/initialization-helpers-residual.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_component/fixtures/install-j-base-host-globals.js';

/**
 * Closes out the remaining untested helpers/prototype-extensions in initialization.js that no
 * other test file happens to exercise as a side effect of importing it (most of this file's
 * statements run just by being imported, which is why the bulk of it is already covered
 * elsewhere- this file targets only the specific helper bodies that need to actually be called).
 */
describe('J-Base initialization.js residual helpers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();
    installJBaseHostGlobals();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');
  });

  describe('J.BASE.Helpers.getRandomNumber', () =>
  {
    it('returns a number within the inclusive/exclusive bounds', () =>
    {
      // Arrange
      const results = new Set();

      // Act- sample repeatedly to exercise the random spread without flaking on any single draw.
      for (let i = 0; i < 50; i++)
      {
        results.add(globalThis.J.BASE.Helpers.getRandomNumber(1, 3));
      }

      // Assert
      for (const value of results)
      {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('J.BASE.Helpers.translateItem', () =>
  {
    it('resolves an item for type "i"', () =>
    {
      // Arrange
      globalThis.$dataItems = [ null, { id: 1, name: 'Potion' } ];

      // Act
      const result = globalThis.J.BASE.Helpers.translateItem(1, 'i');

      // Assert
      expect(result).toEqual({ id: 1, name: 'Potion' });
    });

    it('resolves a weapon for type "w"', () =>
    {
      // Arrange
      globalThis.$dataWeapons = [ null, { id: 1, name: 'Sword' } ];

      // Act
      const result = globalThis.J.BASE.Helpers.translateItem(1, 'w');

      // Assert
      expect(result).toEqual({ id: 1, name: 'Sword' });
    });

    it('resolves an armor for type "a"', () =>
    {
      // Arrange
      globalThis.$dataArmors = [ null, { id: 1, name: 'Shield' } ];

      // Act
      const result = globalThis.J.BASE.Helpers.translateItem(1, 'a');

      // Assert
      expect(result).toEqual({ id: 1, name: 'Shield' });
    });

    it('returns undefined for an unrecognized type', () =>
    {
      // Arrange & Act
      const result = globalThis.J.BASE.Helpers.translateItem(1, 'z');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Array.iterate', () =>
  {
    it('invokes the given function the given number of times', () =>
    {
      // Arrange
      const fn = vi.fn();

      // Act
      Array.iterate(3, fn);

      // Assert
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Date.prototype.addDays', () =>
  {
    it('returns a new date advanced by the given number of days', () =>
    {
      // Arrange
      const date = new Date(2026, 0, 1);

      // Act
      const result = date.addDays(5);

      // Assert
      expect(result.getDate()).toBe(6);
      expect(result).not.toBe(date);
    });
  });

  describe('Date.prototype.addHours', () =>
  {
    it('advances this date by the given number of hours in place', () =>
    {
      // Arrange
      const date = new Date(2026, 0, 1, 0, 0, 0);

      // Act
      const result = date.addHours(2);

      // Assert
      expect(result.getHours()).toBe(2);
      expect(result).toBe(date);
    });
  });

  describe('Date.prototype.addMinutes', () =>
  {
    it('advances this date by the given number of minutes in place', () =>
    {
      // Arrange
      const date = new Date(2026, 0, 1, 0, 0, 0);

      // Act
      const result = date.addMinutes(30);

      // Assert
      expect(result.getMinutes()).toBe(30);
      expect(result).toBe(date);
    });
  });

  describe('J.BASE.Helpers.maskString', () =>
  {
    it('masks every character with the default "?" mask', () =>
    {
      // Arrange & Act
      const result = globalThis.J.BASE.Helpers.maskString('abc123');

      // Assert
      expect(result).toBe('??????');
    });

    it('masks with a custom masking character when provided', () =>
    {
      // Arrange & Act
      const result = globalThis.J.BASE.Helpers.maskString('abc', '*');

      // Assert
      expect(result).toBe('***');
    });
  });
});
//endregion plugins/_base/_metadata/initialization-helpers-residual.test.js
