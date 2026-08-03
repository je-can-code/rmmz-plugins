//region plugins/_base/_utilities/array-helper.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('ArrayHelper (direct src import)', () =>
{
  let ArrayHelper;

  beforeAll(async () =>
  {
    ({ default: ArrayHelper } = await import('../../../../../src/plugins/_base/core/_utilities/ArrayHelper.js'));
  });

  describe('NoNulls', () =>
  {
    it('returns false for undefined', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.NoNulls(undefined)).toBe(false);
    });

    it('returns false for null', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.NoNulls(null)).toBe(false);
    });

    it('returns true for any non-nullish value', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.NoNulls(0)).toBe(true);
    });
  });

  describe('hasAnyIntersection', () =>
  {
    it('returns false when the left array is missing', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.hasAnyIntersection(null, [ 1 ])).toBe(false);
    });

    it('returns false when the left array is empty', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.hasAnyIntersection([], [ 1 ])).toBe(false);
    });

    it('returns false when the right array is missing', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.hasAnyIntersection([ 1 ], null)).toBe(false);
    });

    it('returns false when the right array is empty', () =>
    {
      // Arrange & Act & Assert
      expect(ArrayHelper.hasAnyIntersection([ 1 ], [])).toBe(false);
    });

    it('builds the lookup set from the right array when it is smaller than the left', () =>
    {
      // Arrange- right (2 items) is smaller than left (3 items).
      const left = [ 1, 2, 3 ];
      const right = [ 3, 4 ];

      // Act
      const result = ArrayHelper.hasAnyIntersection(left, right);

      // Assert
      expect(result).toBe(true);
    });

    it('builds the lookup set from the left array when it is smaller than or equal to the right', () =>
    {
      // Arrange- left (2 items) is smaller than right (3 items).
      const left = [ 3, 4 ];
      const right = [ 1, 2, 3 ];

      // Act
      const result = ArrayHelper.hasAnyIntersection(left, right);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when neither array shares any value', () =>
    {
      // Arrange
      const left = [ 1, 2 ];
      const right = [ 3, 4 ];

      // Act
      const result = ArrayHelper.hasAnyIntersection(left, right);

      // Assert
      expect(result).toBe(false);
    });

    it('supports string values', () =>
    {
      // Arrange
      const left = [ 'atk', 'def' ];
      const right = [ 'def', 'mat' ];

      // Act
      const result = ArrayHelper.hasAnyIntersection(left, right);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('rangeInclusive', () =>
  {
    it('returns an inclusive ascending range', () =>
    {
      // Arrange & Act
      const result = ArrayHelper.rangeInclusive(2, 5);

      // Assert
      expect(result).toEqual([ 2, 3, 4, 5 ]);
    });

    it('returns a single-element array when a and b are equal', () =>
    {
      // Arrange & Act
      const result = ArrayHelper.rangeInclusive(4, 4);

      // Assert
      expect(result).toEqual([ 4 ]);
    });
  });
});
//endregion plugins/_base/_utilities/array-helper.test.js
