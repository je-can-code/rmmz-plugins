//region plugins/hud/ext/quest/_models/tracked-omni-objective.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TrackedOmniObjective ext/quest augments (direct src import)', () =>
{
  let TrackedOmniObjective;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { HUD: { EXT: { QUEST: { Aliased: { TrackedOmniObjective: new Map() } } } } };

    function StubTrackedOmniObjective(questKey)
    {
      this.questKey = questKey;
    }

    StubTrackedOmniObjective.prototype.onObjectiveUpdate = vi.fn();
    globalThis.TrackedOmniObjective = StubTrackedOmniObjective;

    globalThis.QuestManager = { quest: vi.fn() };
    globalThis.$hudManager = { requestQuestRefresh: vi.fn() };

    await import('../../../../../../src/plugins/hud/ext/quest/_models/TrackedOmniObjective.js');
    ({ TrackedOmniObjective } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('onObjectiveUpdate', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const objective = new TrackedOmniObjective('quest-1');
      globalThis.QuestManager.quest.mockReturnValue({ tracked: false });

      // Act
      objective.onObjectiveUpdate();

      // Assert
      expect(globalThis.J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective.get('onObjectiveUpdate')).toHaveBeenCalled();
    });

    it('requests a hud quest refresh when the quest is being tracked', () =>
    {
      // Arrange
      const objective = new TrackedOmniObjective('quest-1');
      globalThis.QuestManager.quest.mockReturnValue({ tracked: true });

      // Act
      objective.onObjectiveUpdate();

      // Assert
      expect(globalThis.QuestManager.quest).toHaveBeenCalledWith('quest-1');
      expect(globalThis.$hudManager.requestQuestRefresh).toHaveBeenCalled();
    });

    it('does not request a hud quest refresh when the quest is not being tracked', () =>
    {
      // Arrange
      const objective = new TrackedOmniObjective('quest-1');
      globalThis.QuestManager.quest.mockReturnValue({ tracked: false });

      // Act
      objective.onObjectiveUpdate();

      // Assert
      expect(globalThis.$hudManager.requestQuestRefresh).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/hud/ext/quest/_models/tracked-omni-objective.test.js
