//region plugins/abs/ext/danger/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Game_Enemy (unit, all downstream dependencies mocked)', () =>
{
  const NO_INDICATOR_REGEX = Symbol('NoIndicator');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            RegExp: { NoIndicator: NO_INDICATOR_REGEX },
            Metadata: { DefaultEnemyShowDangerIndicator: true },
          },
        },
      },
    };

    globalThis.RPGManager = { checkForBooleanFromNoteByRegex: vi.fn() };

    function Game_Enemy()
    {
    }

    globalThis.Game_Enemy = Game_Enemy;

    await import('../../../../../../src/plugins/abs/ext/danger/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset();
  });

  function buildEnemy()
  {
    const enemyData = { id: 1 };
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    enemy.enemy = () => enemyData;
    return { enemy, enemyData };
  }

  describe('showDangerIndicator', () =>
  {
    it('returns false when the enemy is tagged with <noIndicator>', () =>
    {
      // Arrange
      const { enemy, enemyData } = buildEnemy();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

      // Act
      const result = enemy.showDangerIndicator();

      // Assert
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(enemyData, NO_INDICATOR_REGEX);
      expect(result).toBe(false);
    });

    it('returns the configured default when there is no tag', () =>
    {
      // Arrange
      const { enemy } = buildEnemy();
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      globalThis.J.ABS.EXT.DANGER.Metadata.DefaultEnemyShowDangerIndicator = false;

      // Act
      const result = enemy.showDangerIndicator();

      // Assert
      expect(result).toBe(false);

      // Cleanup
      globalThis.J.ABS.EXT.DANGER.Metadata.DefaultEnemyShowDangerIndicator = true;
    });
  });
});
//endregion plugins/abs/ext/danger/objects/game-enemy.test.js
