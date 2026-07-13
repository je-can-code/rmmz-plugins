//region plugins/_base/json-mapper.test.js
import { describe, expect, it } from 'vitest';

import JsonMapper from '../../../src/plugins/_base/_utilities/JsonMapper.js';

describe('JsonMapper', () =>
{
  describe('parseObject', () =>
  {
    it('returns null for a null input', () =>
    {
      // Arrange
      const input = null;

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(null);
    });

    it('returns null for an undefined input', () =>
    {
      // Arrange
      const input = undefined;

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(null);
    });

    it('delegates a bracketed string to parseArrayFromString', () =>
    {
      // Arrange
      const input = '[1, 2, 3]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
    });

    it('delegates a non-bracketed string to parseString', () =>
    {
      // Arrange
      const input = 'hello';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe('hello');
    });

    it('recursively parses each element of an array', () =>
    {
      // Arrange
      const input = [ '1', 'true', 'x' ];

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 1, true, 'x' ]);
    });

    it('passes a number through unchanged', () =>
    {
      // Arrange
      const input = 42;

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(42);
    });

    it('passes a boolean through unchanged', () =>
    {
      // Arrange
      const input = true;

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('parseString (reached via parseObject)', () =>
  {
    it('maps "true" to boolean true, case-insensitively', () =>
    {
      // Arrange
      const input = 'true';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(true);
    });

    it('maps "FALSE" to boolean false, case-insensitively', () =>
    {
      // Arrange
      const input = 'FALSE';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(false);
    });

    it('parses a numeric string via parseFloat', () =>
    {
      // Arrange
      const input = '3.5';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(3.5);
    });

    it('parses a negative numeric string via parseFloat', () =>
    {
      // Arrange
      const input = '-2';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe(-2);
    });

    it('leaves a non-numeric, non-boolean token as a string', () =>
    {
      // Arrange
      const input = 'hello';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toBe('hello');
    });
  });

  describe('parseArrayFromString (reached via parseObject)', () =>
  {
    it('splits a flat bracketed list into its top-level comma segments', () =>
    {
      // Arrange
      const input = '[1, 2, 3]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
    });

    it('splices one nested bracket segment back in as an inner array', () =>
    {
      // Arrange
      const input = '[1, [2, 3], 4]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 1, [ 2, 3 ], 4 ]);
    });
  });
});
//endregion plugins/_base/json-mapper.test.js
