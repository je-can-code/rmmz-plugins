//region plugins/_base/_component/json-mapper.test.js
import { describe, expect, it } from 'vitest';

import JsonMapper from '../../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

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

    it('strips the quotes RMMZ leaves on each entry of a string list', () =>
    {
      // Arrange- this is verbatim what the parameter panel hands over for a `string[]` parameter.
      const input = '["physical","fire"]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert- left quoted, no entry could ever match a plain string comparison downstream.
      expect(result).toEqual([ 'physical', 'fire' ]);
    });

    it('resolves a quoted numeric entry into a real number', () =>
    {
      // Arrange- `Number('"7"')` is NaN, which is what made id-based list entries silently inert.
      const input = '["7","12"]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 7, 12 ]);
    });

    it('handles a list mixing quoted names and quoted numbers', () =>
    {
      // Arrange
      const input = '["physical","7"]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ 'physical', 7 ]);
    });

    it('resolves a quoted boolean entry into a real boolean', () =>
    {
      // Arrange
      const input = '["true","false"]';

      // Act
      const result = JsonMapper.parseObject(input);

      // Assert
      expect(result).toEqual([ true, false ]);
    });
  });

  describe('unquoteString', () =>
  {
    it('peels a matching pair of surrounding quotes', () =>
    {
      // Arrange & Act & Assert
      expect(JsonMapper.unquoteString('"wrapped"')).toBe('wrapped');
    });

    it('leaves an unquoted token alone', () =>
    {
      // Arrange & Act & Assert
      expect(JsonMapper.unquoteString('bare')).toBe('bare');
    });

    it('leaves a token quoted on only one end alone', () =>
    {
      // Arrange- an unbalanced quote is more likely authored content than JSON encoding.
      // Act & Assert
      expect(JsonMapper.unquoteString('"halfway')).toBe('"halfway');
      expect(JsonMapper.unquoteString('halfway"')).toBe('halfway"');
    });

    it('leaves a lone quote character alone', () =>
    {
      // Arrange- a single character has no pair to peel, and slicing it would yield an empty string.
      // Act & Assert
      expect(JsonMapper.unquoteString('"')).toBe('"');
    });

    it('leaves an empty string alone', () =>
    {
      // Arrange & Act & Assert
      expect(JsonMapper.unquoteString('')).toBe('');
    });

    it('peels only the outermost pair', () =>
    {
      // Arrange- a doubly-encoded token should surface its inner quoting rather than lose it.
      // Act & Assert
      expect(JsonMapper.unquoteString('""nested""')).toBe('"nested"');
    });

    it('preserves quotes that sit inside the token', () =>
    {
      // Arrange & Act & Assert
      expect(JsonMapper.unquoteString('say "hi"')).toBe('say "hi"');
    });
  });
});
//endregion plugins/_base/_component/json-mapper.test.js
