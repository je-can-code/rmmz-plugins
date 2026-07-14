//region plugins/abs/ext/speed/objects/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed Game_Character (unit, all downstream dependencies mocked)', () =>
{
  let originalDistancePerFrame;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SPEED: { Aliased: { Game_Character: new Map() } } } } };

    function Game_Character()
    {
    }

    originalDistancePerFrame = vi.fn();
    Game_Character.prototype.distancePerFrame = originalDistancePerFrame;
    globalThis.Game_Character = Game_Character;

    await import('../../../../../../src/plugins/abs/ext/speed/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalDistancePerFrame.mockReset();
  });

  function buildCharacter(overrides = {})
  {
    const character = Object.create(globalThis.Game_Character.prototype);
    character.getJabsBattler = () => null;
    return Object.assign(character, overrides);
  }

  describe('distancePerFrame', () =>
  {
    it('adds the calculated speed-boost bonus to the original base distance', () =>
    {
      // Arrange
      originalDistancePerFrame.mockReturnValue(0.2);
      const character = buildCharacter();
      character.calculateSpeedBoostBonus = vi.fn(() => 0.1);

      // Act
      const result = character.distancePerFrame();

      // Assert
      expect(character.calculateSpeedBoostBonus).toHaveBeenCalledWith(0.2);
      expect(result).toBeCloseTo(0.3);
    });

    it('clamps the result up to the minimum distance when the bonus pushes it too low', () =>
    {
      // Arrange- a steep negative bonus needs clamping to the minimum distance so movement never
      // goes negative ("moonwalking").
      originalDistancePerFrame.mockReturnValue(0.2);
      const character = buildCharacter();
      character.calculateSpeedBoostBonus = () => -0.19;
      character.minimumDistancePerFrame = () => 0.015625;

      // Act
      const result = character.distancePerFrame();

      // Assert- 0.2 + (-0.19) = 0.01, which is below the minimum (0.015625), so it clamps up to it.
      expect(result).toBeCloseTo(0.015625);
    });
  });

  describe('calculateSpeedBoostBonus', () =>
  {
    it('returns 0 when there is no jabs battler on this character', () =>
    {
      // Arrange
      const character = buildCharacter({ getJabsBattler: () => null });

      // Act / Assert
      expect(character.calculateSpeedBoostBonus(0.2)).toBe(0);
    });

    it('returns 0 when the battler has no speed boost scale', () =>
    {
      // Arrange
      const character = buildCharacter({
        getJabsBattler: () => ({ getBattler: () => ({ msb: 0 }) }),
      });

      // Act / Assert
      expect(character.calculateSpeedBoostBonus(0.2)).toBe(0);
    });

    it('scales the base distance by the boost percentage', () =>
    {
      // Arrange- 50% boost => base * 0.5.
      const character = buildCharacter({
        getJabsBattler: () => ({ getBattler: () => ({ msb: 50 }) }),
      });

      // Act / Assert
      expect(character.calculateSpeedBoostBonus(0.2)).toBeCloseTo(0.1);
    });

    it('applies a negative scale as a movement penalty', () =>
    {
      // Arrange- -50% => base * -0.5.
      const character = buildCharacter({
        getJabsBattler: () => ({ getBattler: () => ({ msb: -50 }) }),
      });

      // Act / Assert
      expect(character.calculateSpeedBoostBonus(0.2)).toBeCloseTo(-0.1);
    });

    it('clamps a penalty steeper than -90% to the minimum walk speed boost', () =>
    {
      // Arrange
      const character = buildCharacter({
        getJabsBattler: () => ({ getBattler: () => ({ msb: -200 }) }),
      });

      // Act- clamped to -90%, so base * -0.9.
      const result = character.calculateSpeedBoostBonus(0.2);

      // Assert
      expect(result).toBeCloseTo(-0.18);
    });
  });

  describe('minimumWalkSpeedBoost', () =>
  {
    it('is -90', () =>
    {
      const character = buildCharacter();
      expect(character.minimumWalkSpeedBoost()).toBe(-90);
    });
  });

  describe('minimumDistancePerFrame', () =>
  {
    it('is the configured minimum distance constant', () =>
    {
      const character = buildCharacter();
      expect(character.minimumDistancePerFrame()).toBe(0.015625);
    });
  });
});
//endregion plugins/abs/ext/speed/objects/game-character.test.js
