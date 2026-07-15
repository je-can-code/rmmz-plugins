//region plugins/hud/ext/quest/_models/tracked-omni-quest.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TrackedOmniQuest ext/quest augments (direct src import)', () =>
{
  let TrackedOmniQuest;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      HUD: {
        EXT: {
          QUEST: {
            Aliased: {
              TrackedOmniQuest: new Map(),
            },
          },
        },
      },
    };

    globalThis.OmniQuest = { States: { Active: 'active', Inactive: 'inactive' } };

    function StubTrackedOmniQuest(state)
    {
      this.state = state;
    }

    StubTrackedOmniQuest.prototype.refreshState = vi.fn();
    StubTrackedOmniQuest.prototype.unlock = vi.fn(function(objectiveId = null)
    {
      // the real base implementation would apply the objectiveId; irrelevant to this augment's branching.
      this.unlockedWith = objectiveId;
    });
    StubTrackedOmniQuest.prototype.toggleTracked = vi.fn();
    globalThis.TrackedOmniQuest = StubTrackedOmniQuest;

    globalThis.QuestManager = { trackedQuests: vi.fn() };
    globalThis.$hudManager = { requestQuestRefresh: vi.fn() };

    await import('../../../../../../src/plugins/hud/ext/quest/_models/TrackedOmniQuest.js');
    ({ TrackedOmniQuest } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('refreshState', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Active);

      // Act
      quest.refreshState();

      // Assert
      expect(globalThis.J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('refreshState')).toHaveBeenCalled();
    });

    it('always requests a hud quest refresh', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Active);

      // Act
      quest.refreshState();

      // Assert
      expect(globalThis.$hudManager.requestQuestRefresh).toHaveBeenCalled();
    });
  });

  describe('unlock', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Active);
      globalThis.QuestManager.trackedQuests.mockReturnValue([]);

      // Act
      quest.unlock(3);

      // Assert
      expect(globalThis.J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('unlock')).toHaveBeenCalledWith(3);
    });

    it('starts tracking and refreshes the hud when no quests are tracked and this quest is now active', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Active);
      globalThis.QuestManager.trackedQuests.mockReturnValue([]);

      // Act
      quest.unlock();

      // Assert
      expect(quest.toggleTracked).toHaveBeenCalled();
      expect(globalThis.$hudManager.requestQuestRefresh).toHaveBeenCalled();
    });

    it('does not start tracking when other quests are already tracked', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Active);
      globalThis.QuestManager.trackedQuests.mockReturnValue([ {} ]);

      // Act
      quest.unlock();

      // Assert
      expect(quest.toggleTracked).not.toHaveBeenCalled();
      expect(globalThis.$hudManager.requestQuestRefresh).not.toHaveBeenCalled();
    });

    it('does not start tracking when this quest is not now active', () =>
    {
      // Arrange
      const quest = new TrackedOmniQuest(globalThis.OmniQuest.States.Inactive);
      globalThis.QuestManager.trackedQuests.mockReturnValue([]);

      // Act
      quest.unlock();

      // Assert
      expect(quest.toggleTracked).not.toHaveBeenCalled();
      expect(globalThis.$hudManager.requestQuestRefresh).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/hud/ext/quest/_models/tracked-omni-quest.test.js
