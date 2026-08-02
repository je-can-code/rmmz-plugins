//region plugins/_base/objects/game-character.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-Base Game_Character (direct src import)', () =>
{
  beforeAll(async () =>
  {
    function Game_Character()
    {
    }

    globalThis.Game_Character = Game_Character;

    await import('../../../../../src/plugins/_base/core/objects/Game_Character.js');
  });

  describe('isPlayer', () =>
  {
    it('returns false', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isPlayer()).toBe(false);
    });
  });

  describe('isEvent', () =>
  {
    it('returns false', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isEvent()).toBe(false);
    });
  });

  describe('isFollower', () =>
  {
    it('returns false', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isFollower()).toBe(false);
    });
  });

  describe('isErased', () =>
  {
    it('returns false', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isErased()).toBe(false);
    });
  });

  describe('isVehicle', () =>
  {
    it('returns false', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isVehicle()).toBe(false);
    });
  });

  describe('isVisible', () =>
  {
    it('returns true', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act & Assert
      expect(character.isVisible()).toBe(true);
    });
  });

  describe('distanceFromCharacter', () =>
  {
    it('returns 0 when checking distance to itself, without touching $gameMap', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();
      globalThis.$gameMap = { distance: () => { throw new Error('should not be called'); } };

      // Act
      const result = character.distanceFromCharacter(character);

      // Assert
      expect(result).toBe(0);
    });

    it('delegates to $gameMap.distance and constrains the result to three decimals', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();
      character.x = 1;
      character.y = 1;
      const other = { x: 4, y: 5 };
      globalThis.$gameMap = { distance: () => 5.123456789 };

      // Act
      const result = character.distanceFromCharacter(other);

      // Assert
      expect(result).toBe(5.123);
    });
  });

  describe('distanceFromPlayer', () =>
  {
    it('delegates to distanceFromCharacter with $gamePlayer', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();
      character.x = 0;
      character.y = 0;
      globalThis.$gamePlayer = { x: 0, y: 0 };
      globalThis.$gameMap = { distance: () => 2.5 };

      // Act
      const result = character.distanceFromPlayer();

      // Assert
      expect(result).toBe(2.5);
    });
  });
});
//endregion plugins/_base/objects/game-character.test.js
