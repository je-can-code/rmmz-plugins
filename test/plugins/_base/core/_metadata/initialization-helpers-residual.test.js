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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
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

  describe('J.BASE.Helpers.satisfies', () =>
  {
    it('accepts a version above the floor', () =>
    {
      // Arrange & Act & Assert- every extension gates its own boot on this, so a wrong answer is
      // either a plugin refusing to load or one loading against a host missing what it needs.
      expect(globalThis.J.BASE.Helpers.satisfies('3.2.0', '3.1.0')).toBe(true);
    });

    it('rejects a version below the floor', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.BASE.Helpers.satisfies('3.0.9', '3.1.0')).toBe(false);
    });

    it('accepts a version exactly at the floor', () =>
    {
      // Arrange & Act & Assert- the loop runs out without either comparison tripping, which is what
      // the trailing return is for.
      expect(globalThis.J.BASE.Helpers.satisfies('3.1.0', '3.1.0')).toBe(true);
    });

    it('compares the major segment before ever reaching the patch', () =>
    {
      // Arrange & Act & Assert- a higher major wins outright even with a lower patch behind it.
      expect(globalThis.J.BASE.Helpers.satisfies('4.0.0', '3.9.9')).toBe(true);
    });
  });

  describe('J.BASE.Helpers.generateUuid', () =>
  {
    it('renders a full-length RFC-4122 shaped identifier', () =>
    {
      // Arrange & Act
      const uuid = globalThis.J.BASE.Helpers.generateUuid();

      // Assert
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('does not hand out the same identifier twice', () =>
    {
      // Arrange- every battler on the map is keyed by one of these, and a collision would have two
      // of them sharing state.
      const uuids = new Set();

      // Act
      for (let i = 0; i < 50; i++)
      {
        uuids.add(globalThis.J.BASE.Helpers.generateUuid());
      }

      // Assert
      expect(uuids.size).toBe(50);
    });
  });

  describe('J.BASE.Helpers.shortUuid', () =>
  {
    it('renders six hexadecimal digits split across a dash', () =>
    {
      // Arrange & Act- deliberately carries no variant placeholder: `y` marks the RFC-4122 variant
      // position, and a short id has no variant to encode.
      const uuid = globalThis.J.BASE.Helpers.shortUuid();

      // Assert
      expect(uuid).toMatch(/^[0-9a-f]{3}-[0-9a-f]{3}$/);
    });
  });

  describe('J.BASE.Helpers.modVariable', () =>
  {
    it('adjusts a variable by an amount rather than replacing it', () =>
    {
      // Arrange- this is what every tracked statistic in the game accumulates through.
      const values = { 12: 40 };
      globalThis.$gameVariables = {
        value: id => values[id],
        setValue: (id, value) =>
        {
          values[id] = value;
        },
      };

      // Act
      globalThis.J.BASE.Helpers.modVariable(12, 5);

      // Assert
      expect(values[12]).toBe(45);
    });
  });

  describe('J.BASE.Helpers.getKeyFromRegexp', () =>
  {
    it('lifts the tag name out of a value-carrying structure', () =>
    {
      // Arrange- the name between the opening bracket and the colon is the key an editor board
      // writes under, so this is how a regex and a data file stay in agreement.
      // Act
      const key = globalThis.J.BASE.Helpers.getKeyFromRegexp(/<someTag:[ ]?(\d+)>/i);

      // Assert
      expect(key).toBe('someTag');
    });

    it('lifts the tag name out of a boolean structure, which ends at the bracket instead', () =>
    {
      // Arrange- a marker tag carries no colon at all, so the closing character has to change.
      // Act
      const key = globalThis.J.BASE.Helpers.getKeyFromRegexp(/<someMarker>/i, true);

      // Assert
      expect(key).toBe('someMarker');
    });
  });
});
//endregion plugins/_base/_metadata/initialization-helpers-residual.test.js
