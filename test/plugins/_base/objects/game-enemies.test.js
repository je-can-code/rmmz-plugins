//region plugins/_base/objects/game-enemies.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('Game_Enemies (direct src import)', () =>
{
  let Game_Enemies;

  beforeAll(async () =>
  {
    function Game_Enemy(enemyId)
    {
      this.enemyId = enemyId;
    }

    globalThis.Game_Enemy = Game_Enemy;

    ({ default: Game_Enemies } = await import('../../../../src/plugins/_base/objects/Game_Enemies.js'));
  });

  describe('enemy', () =>
  {
    it('builds and caches a new Game_Enemy on a cold cache', () =>
    {
      // Arrange
      const enemies = new Game_Enemies();

      // Act
      const result = enemies.enemy(5);

      // Assert
      expect(result.enemyId).toBe(5);
    });

    it('returns the cached instance on a repeat lookup rather than rebuilding', () =>
    {
      // Arrange
      const enemies = new Game_Enemies();
      const first = enemies.enemy(5);

      // Act
      const second = enemies.enemy(5);

      // Assert
      expect(second).toBe(first);
    });
  });
});
//endregion plugins/_base/objects/game-enemies.test.js
