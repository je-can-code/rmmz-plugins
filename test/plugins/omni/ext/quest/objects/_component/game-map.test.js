//region plugins/omni/ext/quest/objects/_component/game-map.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Map ext/quest augments (direct src import)', () =>
{
  let FakeQuestManager;

  beforeEach(async () =>
  {
    vi.resetModules();

    FakeQuestManager = { getValidDestinationObjectives: vi.fn().mockReturnValue([]), quest: vi.fn() };
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({ default: FakeQuestManager }));

    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { Game_Map: new Map() } } } } };

    function StubGameMap()
    {
    }

    StubGameMap.prototype.initMembers = vi.fn();
    StubGameMap.prototype.update = vi.fn();
    globalThis.Game_Map = StubGameMap;

    function FakeJTimer(frames)
    {
      this.frames = frames;
      this.complete = false;
    }

    FakeJTimer.prototype.isTimerComplete = vi.fn(function()
    {
      return this.complete;
    });
    FakeJTimer.prototype.reset = vi.fn(function()
    {
      this.complete = false;
    });
    FakeJTimer.prototype.update = vi.fn();
    globalThis.J_Timer = FakeJTimer;

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/Game_Map.js');
  });

  describe('initMembers/initQuestopediaMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.initMembers();

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Map.get('initMembers')).toHaveBeenCalled();
    });

    it('initializes a destination timer for tracking', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.initMembers();

      // Assert
      expect(map.getDestinationTimer()).toBeInstanceOf(globalThis.J_Timer);
    });
  });

  describe('update/processDestinationCheck', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initMembers();

      // Act
      map.update(true);

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Map.get('update')).toHaveBeenCalledWith(true);
    });

    it('ticks the timer forward when not yet complete', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initMembers();
      map.getDestinationTimer().complete = false;

      // Act
      map.update(true);

      // Assert
      expect(map.getDestinationTimer().update).toHaveBeenCalled();
      expect(FakeQuestManager.getValidDestinationObjectives).not.toHaveBeenCalled();
    });

    it('evaluates destination objectives and resets the timer once complete', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initMembers();
      map.getDestinationTimer().complete = true;

      // Act
      map.update(true);

      // Assert
      expect(FakeQuestManager.getValidDestinationObjectives).toHaveBeenCalled();
      expect(map.getDestinationTimer().reset).toHaveBeenCalled();
    });
  });

  describe('evaluateDestinationObjectives', () =>
  {
    it('does nothing when there are no valid destination objectives', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      FakeQuestManager.getValidDestinationObjectives.mockReturnValue([]);

      // Act/Assert (no throw)
      expect(() => map.evaluateDestinationObjectives()).not.toThrow();
    });

    it('does not progress the quest when the player is outside the destination range', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      const objective = {
        destinationData: () => [ 'map-1', [ 0, 0, 5, 5 ] ],
        isPlayerWithinDestinationRange: vi.fn().mockReturnValue(false),
      };
      FakeQuestManager.getValidDestinationObjectives.mockReturnValue([ objective ]);

      // Act
      map.evaluateDestinationObjectives();

      // Assert
      expect(FakeQuestManager.quest).not.toHaveBeenCalled();
    });

    it('progresses the quest once the player reaches the destination range', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      const objective = {
        id: 4,
        questKey: 'quest-1',
        destinationData: () => [ 'map-1', [ 0, 0, 5, 5 ] ],
        isPlayerWithinDestinationRange: vi.fn().mockReturnValue(true),
      };
      FakeQuestManager.getValidDestinationObjectives.mockReturnValue([ objective ]);
      const quest = { flagObjectiveAsCompleted: vi.fn(), progressObjectives: vi.fn() };
      FakeQuestManager.quest.mockReturnValue(quest);

      // Act
      map.evaluateDestinationObjectives();

      // Assert
      expect(quest.flagObjectiveAsCompleted).toHaveBeenCalledWith(4);
      expect(quest.progressObjectives).toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-map.test.js
