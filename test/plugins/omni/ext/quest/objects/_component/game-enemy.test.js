//region plugins/omni/ext/quest/objects/_component/game-enemy.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Enemy ext/quest augments (direct src import)', () =>
{
  let FakeQuestManager;

  beforeEach(async () =>
  {
    vi.resetModules();

    FakeQuestManager = { getValidSlayObjectives: vi.fn().mockReturnValue([]), quest: vi.fn() };
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({ default: FakeQuestManager }));

    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { Game_Enemy: new Map() } } } } };

    function StubGameEnemy()
    {
    }

    StubGameEnemy.prototype.onDeath = vi.fn();
    StubGameEnemy.prototype.enemyId = vi.fn();
    globalThis.Game_Enemy = StubGameEnemy;

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/Game_Enemy.js');
  });

  describe('onDeath/processSlayQuestsCheck', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();

      // Act
      enemy.onDeath();

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Enemy.get('onDeath')).toHaveBeenCalled();
    });

    it('does nothing further when there are no valid slay objectives', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      FakeQuestManager.getValidSlayObjectives.mockReturnValue([]);

      // Act/Assert (no throw)
      expect(() => enemy.onDeath()).not.toThrow();
    });

    it('skips an objective targeting a different enemy id', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.enemyId.mockReturnValue(5);
      const objective = { slayData: () => [ 99 ], incrementSlayTargetEnemyAmount: vi.fn() };
      FakeQuestManager.getValidSlayObjectives.mockReturnValue([ objective ]);

      // Act
      enemy.onDeath();

      // Assert
      expect(objective.incrementSlayTargetEnemyAmount).not.toHaveBeenCalled();
    });

    it('increments the slay counter for a matching objective but does not progress when not enough slain yet', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.enemyId.mockReturnValue(5);
      const objective = {
        slayData: () => [ 5 ],
        incrementSlayTargetEnemyAmount: vi.fn(),
        hasSlainEnoughEnemies: vi.fn().mockReturnValue(false),
      };
      FakeQuestManager.getValidSlayObjectives.mockReturnValue([ objective ]);

      // Act
      enemy.onDeath();

      // Assert
      expect(objective.incrementSlayTargetEnemyAmount).toHaveBeenCalled();
      expect(FakeQuestManager.quest).not.toHaveBeenCalled();
    });

    it('progresses the quest once enough matching enemies have been slain', () =>
    {
      // Arrange
      const enemy = new globalThis.Game_Enemy();
      enemy.enemyId.mockReturnValue(5);
      const objective = {
        id: 2,
        questKey: 'quest-1',
        slayData: () => [ 5 ],
        incrementSlayTargetEnemyAmount: vi.fn(),
        hasSlainEnoughEnemies: vi.fn().mockReturnValue(true),
      };
      FakeQuestManager.getValidSlayObjectives.mockReturnValue([ objective ]);
      const quest = { flagObjectiveAsCompleted: vi.fn(), progressObjectives: vi.fn() };
      FakeQuestManager.quest.mockReturnValue(quest);

      // Act
      enemy.onDeath();

      // Assert
      expect(quest.flagObjectiveAsCompleted).toHaveBeenCalledWith(2);
      expect(quest.progressObjectives).toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-enemy.test.js
