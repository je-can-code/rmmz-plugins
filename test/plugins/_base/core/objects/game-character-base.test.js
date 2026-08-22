//region plugins/_base/objects/game-character-base.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Game_CharacterBase.js is a prototype-patch file (adds methods onto the real RMMZ
 * `Game_CharacterBase.prototype`), so this file direct-imports it against a bare placeholder
 * engine global rather than nesting a vm context.
 */
describe('J-Base Game_CharacterBase (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extension (rmmz_core.js)- stubbed explicitly rather than
    // relying on another test file having already mutated the prototype.
    Array.prototype.contains = function(element)
    {
      return this.indexOf(element) !== -1;
    };

    function Game_CharacterBase()
    {
    }

    globalThis.Game_CharacterBase = Game_CharacterBase;

    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');
  });

  describe('getValidDiagonalDirections', () =>
  {
    it('returns the four diagonal direction codes', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getValidDiagonalDirections();

      // Assert
      expect(result).toEqual([ 1, 3, 7, 9 ]);
    });
  });

  describe('getValidCardinalDirections', () =>
  {
    it('returns the four cardinal direction codes', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getValidCardinalDirections();

      // Assert
      expect(result).toEqual([ 2, 4, 6, 8 ]);
    });
  });

  describe('getValidDirections', () =>
  {
    it('returns cardinal directions followed by diagonal directions', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getValidDirections();

      // Assert
      expect(result).toEqual([ 2, 4, 6, 8, 1, 3, 7, 9 ]);
    });
  });

  describe('isDiagonalDirection', () =>
  {
    it('returns true for a diagonal direction code', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.isDiagonalDirection(7);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for a non-diagonal direction code', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.isDiagonalDirection(2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isStraightDirection', () =>
  {
    it('returns true for a straight direction code', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.isStraightDirection(4);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for a non-straight direction code', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.isStraightDirection(9);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getDiagonalDirections', () =>
  {
    it('resolves down-left (1) to [left, down]', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getDiagonalDirections(1);

      // Assert
      expect(result).toEqual([ 4, 2 ]);
    });

    it('resolves down-right (3) to [right, down]', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getDiagonalDirections(3);

      // Assert
      expect(result).toEqual([ 6, 2 ]);
    });

    it('resolves up-left (7) to [left, up]', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getDiagonalDirections(7);

      // Assert
      expect(result).toEqual([ 4, 8 ]);
    });

    it('resolves up-right (9) to [right, up]', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getDiagonalDirections(9);

      // Assert
      expect(result).toEqual([ 6, 8 ]);
    });

    it('returns undefined for a non-diagonal direction code', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.getDiagonalDirections(2);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('directionFromHorzVert', () =>
  {
    it('resolves left+down to down-left (1)', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.directionFromHorzVert(4, 2);

      // Assert
      expect(result).toBe(1);
    });

    it('resolves right+down to down-right (3)', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.directionFromHorzVert(6, 2);

      // Assert
      expect(result).toBe(3);
    });

    it('resolves left+up to up-left (7)', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.directionFromHorzVert(4, 8);

      // Assert
      expect(result).toBe(7);
    });

    it('resolves right+up to up-right (9)', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const result = character.directionFromHorzVert(6, 8);

      // Assert
      expect(result).toBe(9);
    });

    it('returns 0 for an invalid horz/vert combination', () =>
    {
      // Arrange- every pair below is a near-miss of a real diagonal, holding one valid component
      // beside a garbage one, so each of the four resolution checks has to be discriminating on
      // both of its halves rather than on whichever half the earlier checks happened to filter out.
      const character = new globalThis.Game_CharacterBase();

      // Act
      const leftWithGarbageVert = character.directionFromHorzVert(4, 4);
      const rightWithGarbageVert = character.directionFromHorzVert(6, 0);
      const garbageHorzWithDown = character.directionFromHorzVert(0, 2);
      const garbageHorzWithUp = character.directionFromHorzVert(0, 8);

      // Assert
      expect(leftWithGarbageVert).toBe(0);
      expect(rightWithGarbageVert).toBe(0);
      expect(garbageHorzWithDown).toBe(0);
      expect(garbageHorzWithUp).toBe(0);
    });
  });
});
//endregion plugins/_base/objects/game-character-base.test.js
