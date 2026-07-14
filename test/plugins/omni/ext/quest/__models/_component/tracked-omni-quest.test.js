//region plugins/omni/ext/quest/__models/_component/tracked-omni-quest.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TrackedOmniQuest statically imports QuestManager for _processQuestCompletionQuestsCheck(); mock it so
// the hoisted static import resolves to a spyable double instead of the real manager.
vi.mock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({
  default: { getValidQuestCompletionObjectives: vi.fn(() => []), quest: vi.fn() },
}));

import QuestManager from '../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js';
import OmniObjective from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniObjective.js';
import OmniQuest from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js';

describe('TrackedOmniQuest (omni ext/quest, direct src import)', () =>
{
  /** @type {typeof import('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniQuest.js').default} */
  let TrackedOmniQuest;

  beforeAll(async () =>
  {
    // TrackedOmniQuest.js calls SerializableRegistry.register(...) as an import-time side effect.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: TrackedOmniQuest } =
      await import('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniQuest.js'));
  });

  afterAll(() =>
  {
    delete globalThis.SerializableRegistry;
  });

  beforeEach(() =>
  {
    globalThis.J = {
      OMNI: {
        EXT: {
          QUEST: {
            Metadata: {
              questsMap: new Map([
                [ 'quest-key', {
                  name: 'Quest Name',
                  recommendedLevel: 5,
                  tagKeys: [ 'combat' ],
                  unknownHint: 'unknown hint',
                  overview: 'overview text',
                } ],
              ]),
              tagsMap: new Map([ [ 'combat', { key: 'combat', name: 'Combat' } ] ]),
            },
          },
        },
      },
    };

    globalThis.$diaLogManager = undefined;
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.$diaLogManager;
    delete globalThis.DiaLogBuilder;
    vi.clearAllMocks();
  });

  /**
   * Builds a minimal fake {@link TrackedOmniObjective} stand-in exposing just the duck-typed surface
   * TrackedOmniQuest relies on, so these tests exercise quest-level orchestration without depending on
   * TrackedOmniObjective's own implementation.
   * @param {number} id
   * @param {number} state
   * @param {boolean=} hidden
   * @returns {object}
   */
  function fakeObjective(id, state, hidden = false)
  {
    return {
      id,
      state,
      hidden,
      // these read `this.state` (not the factory's `state` parameter) so that mutating `.state` via
      // setState()- or by direct assignment in a test- is reflected on every subsequent call.
      isActive()
      {
        return this.state === OmniObjective.States.Active;
      },
      isInactive()
      {
        return this.state === OmniObjective.States.Inactive;
      },
      isCompleted()
      {
        return this.state === OmniObjective.States.Completed;
      },
      isFailed()
      {
        return this.state === OmniObjective.States.Failed;
      },
      isMissed()
      {
        return this.state === OmniObjective.States.Missed;
      },
      isHidden()
      {
        return this.hidden;
      },
      isFulfilled: () => false,
      setState(newState)
      {
        this.state = newState;
      },
    };
  }

  describe('constructor', () =>
  {
    it('sorts objectives by ascending id and starts Inactive/untracked', () =>
    {
      const objectives = [ fakeObjective(2, OmniObjective.States.Inactive), fakeObjective(0, OmniObjective.States.Inactive), fakeObjective(1, OmniObjective.States.Inactive) ];

      const quest = new TrackedOmniQuest('quest-key', 'main', objectives);

      expect(quest.objectives.map(o => o.id)).toEqual([ 0, 1, 2 ]);
      expect(quest.state).toBe(OmniQuest.States.Inactive);
      expect(quest.tracked).toBe(false);
    });
  });

  describe('metadata accessors', () =>
  {
    let quest;

    beforeEach(() =>
    {
      quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);
    });

    it('name/recommendedLevel/unknownHint/overview read straight from the metadata map', () =>
    {
      expect(quest.name()).toBe('Quest Name');
      expect(quest.recommendedLevel()).toBe(5);
      expect(quest.unknownHint()).toBe('unknown hint');
      expect(quest.overview()).toBe('overview text');
    });

    it('tagKeys defaults to an empty array when the metadata omits tagKeys', () =>
    {
      globalThis.J.OMNI.EXT.QUEST.Metadata.questsMap.get('quest-key').tagKeys = undefined;

      expect(quest.tagKeys()).toEqual([]);
    });

    it('tags maps tagKeys through the tagsMap', () =>
    {
      expect(quest.tags()).toEqual([ { key: 'combat', name: 'Combat' } ]);
    });
  });

  describe('canBeTracked / isTracked / toggleTracked', () =>
  {
    it('active quests can always be tracked', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Active) ]);
      quest.state = OmniQuest.States.Active;

      expect(quest.canBeTracked()).toBe(true);
    });

    it('inactive quests can be tracked only if some objective is not hidden', () =>
    {
      const hiddenOnly = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive, true) ]);
      expect(hiddenOnly.canBeTracked()).toBe(false);

      const withVisible = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive, false) ]);
      expect(withVisible.canBeTracked()).toBe(true);
    });

    it('isTracked treats both boolean true and the string "true" as tracked', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.tracked = true;
      expect(quest.isTracked()).toBe(true);

      quest.tracked = 'true';
      expect(quest.isTracked()).toBe(true);

      quest.tracked = false;
      expect(quest.isTracked()).toBe(false);
    });

    it('toggleTracked flips the flag when no forced state is given', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.toggleTracked();
      expect(quest.tracked).toBe(true);

      quest.toggleTracked();
      expect(quest.tracked).toBe(false);
    });

    it('toggleTracked sets the exact forced state when provided', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.toggleTracked(true);
      expect(quest.tracked).toBe(true);

      quest.toggleTracked(true);
      expect(quest.tracked).toBe(true);
    });
  });

  describe('state check predicates', () =>
  {
    it('isInactive/isActive/isCompleted/isFailed/isMissed reflect the current state', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(quest.isInactive()).toBe(true);
      expect(quest.isKnown()).toBe(false);

      quest.state = OmniQuest.States.Active;
      expect(quest.isActive()).toBe(true);
      expect(quest.isKnown()).toBe(true);

      quest.state = OmniQuest.States.Completed;
      expect(quest.isCompleted()).toBe(true);

      quest.state = OmniQuest.States.Failed;
      expect(quest.isFailed()).toBe(true);

      quest.state = OmniQuest.States.Missed;
      expect(quest.isMissed()).toBe(true);
    });

    it('isFinalized is true only for completed/failed/missed', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.state = OmniQuest.States.Active;
      expect(quest.isFinalized()).toBe(false);

      quest.state = OmniQuest.States.Completed;
      expect(quest.isFinalized()).toBe(true);
    });
  });

  describe('isObjectiveInState / isObjectiveCompleted / canExecuteObjectiveById', () =>
  {
    it('falls back to the immediate active objective when no id is provided', () =>
    {
      const active = fakeObjective(1, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Completed), active,
      ]);

      expect(quest.canExecuteObjectiveById()).toBe(true);
    });

    it('falls back to the first objective when there is no active objective', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Inactive),
      ]);

      expect(quest.isObjectiveCompleted()).toBe(false);
    });

    it('returns false for a non-existent objective id', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(quest.isObjectiveInState(OmniObjective.States.Active, 99)).toBe(false);
      expect(quest.canExecuteObjectiveById(99)).toBe(false);
    });

    it('isObjectiveCompleted checks the explicit objective id when provided', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Completed),
        fakeObjective(1, OmniObjective.States.Active),
      ]);

      expect(quest.isObjectiveCompleted(0)).toBe(true);
      expect(quest.isObjectiveCompleted(1)).toBe(false);
    });
  });

  describe('unlock / canBeUnlocked / reset', () =>
  {
    it('canBeUnlocked is true only while the quest is still unknown (inactive)', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(quest.canBeUnlocked()).toBe(true);

      quest.state = OmniQuest.States.Active;
      expect(quest.canBeUnlocked()).toBe(false);
    });

    it('unlock activates the target objective and refreshes state to Active', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.unlock();

      expect(quest.objectives[0].state).toBe(OmniObjective.States.Active);
      expect(quest.state).toBe(OmniQuest.States.Active);
    });

    it('unlock is a no-op with a console warning when the quest cannot be unlocked', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);
      quest.state = OmniQuest.States.Completed;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      quest.unlock();

      expect(quest.objectives[0].state).toBe(OmniObjective.States.Inactive);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('reset reverts the quest and every objective back to Inactive', () =>
    {
      const objective = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ objective ]);
      quest.state = OmniQuest.States.Active;

      quest.reset();

      expect(quest.state).toBe(OmniQuest.States.Inactive);
      expect(objective.state).toBe(OmniObjective.States.Inactive);
    });
  });

  describe('progressObjectives / _fastForwardToNextObjective', () =>
  {
    it('completes the single active objective and activates the next inactive one', () =>
    {
      const first = fakeObjective(0, OmniObjective.States.Active);
      const second = fakeObjective(1, OmniObjective.States.Inactive);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ first, second ]);

      quest.progressObjectives();

      expect(first.state).toBe(OmniObjective.States.Completed);
      expect(second.state).toBe(OmniObjective.States.Active);
    });

    it('completes the quest once there are no more objectives to activate', () =>
    {
      const only = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ only ]);

      quest.progressObjectives();

      expect(only.state).toBe(OmniObjective.States.Completed);
      expect(quest.state).toBe(OmniQuest.States.Completed);
    });

    it('warns and does not touch objectives when multiple are active at once', () =>
    {
      const a = fakeObjective(0, OmniObjective.States.Active);
      const b = fakeObjective(1, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ a, b ]);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      quest.progressObjectives();

      expect(a.state).toBe(OmniObjective.States.Active);
      expect(b.state).toBe(OmniObjective.States.Active);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('auto-completes a newly-activated objective that reports as already fulfilled', () =>
    {
      const alreadyFulfilled = fakeObjective(1, OmniObjective.States.Inactive);
      alreadyFulfilled.isFulfilled = () => true;
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Active), alreadyFulfilled,
      ]);

      quest.progressObjectives();

      expect(alreadyFulfilled.state).toBe(OmniObjective.States.Completed);
      expect(quest.state).toBe(OmniQuest.States.Completed);
    });
  });

  describe('activeObjectives / immediateObjective', () =>
  {
    it('returns all currently-active objectives, and the first as immediate', () =>
    {
      const a = fakeObjective(0, OmniObjective.States.Active);
      const b = fakeObjective(1, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ a, b ]);

      expect(quest.activeObjectives()).toEqual([ a, b ]);
      expect(quest.immediateObjective()).toBe(a);
    });

    it('immediateObjective is undefined when nothing is active', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(quest.immediateObjective()).toBeUndefined();
    });
  });

  describe('flag*/changeTargetObjectiveState', () =>
  {
    it('flagObjectiveAsMissed changes state and refreshes the quest', () =>
    {
      const objective = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ objective ]);

      quest.flagObjectiveAsMissed(0);

      expect(objective.state).toBe(OmniObjective.States.Missed);
      expect(quest.state).toBe(OmniQuest.States.Completed);
    });

    it('changeTargetObjectiveState is a no-op when the objective is already the target state', () =>
    {
      const objective = fakeObjective(0, OmniObjective.States.Completed);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ objective ]);
      quest.state = OmniQuest.States.Completed;
      const refreshSpy = vi.spyOn(quest, 'refreshState');

      quest.flagObjectiveAsCompleted(0);

      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('getFallbackObjectiveId', () =>
  {
    it('returns the given objectiveId when provided, even 0', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(quest.getFallbackObjectiveId(0)).toBe(0);
    });

    it('falls back to the immediate active objective id', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Inactive),
        fakeObjective(1, OmniObjective.States.Active),
      ]);

      expect(quest.getFallbackObjectiveId()).toBe(1);
    });

    it('falls back to 0 when there is no immediate objective', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(5, OmniObjective.States.Inactive) ]);

      expect(quest.getFallbackObjectiveId()).toBe(0);
    });
  });

  describe('flagAsMissed / flagAsFailed / flagAsCompleted', () =>
  {
    it('flagAsMissed misses every active/inactive objective, leaving finalized ones untouched', () =>
    {
      const active = fakeObjective(0, OmniObjective.States.Active);
      const completed = fakeObjective(1, OmniObjective.States.Completed);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ active, completed ]);

      quest.flagAsMissed();

      expect(active.state).toBe(OmniObjective.States.Missed);
      expect(completed.state).toBe(OmniObjective.States.Completed);
      expect(quest.state).toBe(OmniQuest.States.Completed);
    });

    it('flagAsFailed fails every active/inactive objective', () =>
    {
      const active = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ active ]);

      quest.flagAsFailed();

      expect(active.state).toBe(OmniObjective.States.Failed);
      expect(quest.state).toBe(OmniQuest.States.Failed);
    });

    it('flagAsCompleted completes active objectives and misses inactive ones, then checks quest-completion chains', () =>
    {
      const active = fakeObjective(0, OmniObjective.States.Active);
      const inactive = fakeObjective(1, OmniObjective.States.Inactive);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ active, inactive ]);

      quest.flagAsCompleted();

      expect(active.state).toBe(OmniObjective.States.Completed);
      expect(inactive.state).toBe(OmniObjective.States.Missed);
      expect(quest.state).toBe(OmniQuest.States.Completed);
      expect(QuestManager.getValidQuestCompletionObjectives).toHaveBeenCalled();
    });

    it('_processQuestCompletionQuestsCheck progresses a dependent quest once all its required quests complete', () =>
    {
      const active = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ active ]);

      const dependentObjective = { questKey: 'other-quest', id: 3, hasCompletedAllQuests: () => true };
      const dependentQuest = { flagObjectiveAsCompleted: vi.fn(), progressObjectives: vi.fn() };
      QuestManager.getValidQuestCompletionObjectives.mockReturnValue([ dependentObjective ]);
      QuestManager.quest.mockReturnValue(dependentQuest);

      quest.flagAsCompleted();

      expect(QuestManager.quest).toHaveBeenCalledWith('other-quest');
      expect(dependentQuest.flagObjectiveAsCompleted).toHaveBeenCalledWith(3);
      expect(dependentQuest.progressObjectives).toHaveBeenCalled();
    });

    it('_processQuestCompletionQuestsCheck skips dependent objectives that are not yet fulfilled', () =>
    {
      const active = fakeObjective(0, OmniObjective.States.Active);
      const quest = new TrackedOmniQuest('quest-key', 'main', [ active ]);

      const dependentObjective = { questKey: 'other-quest', id: 3, hasCompletedAllQuests: () => false };
      QuestManager.getValidQuestCompletionObjectives.mockReturnValue([ dependentObjective ]);

      quest.flagAsCompleted();

      expect(QuestManager.quest).not.toHaveBeenCalled();
    });
  });

  describe('refreshState', () =>
  {
    it('prioritizes Failed over any other objective combination', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Failed),
        fakeObjective(1, OmniObjective.States.Completed),
      ]);

      quest.refreshState();

      expect(quest.state).toBe(OmniQuest.States.Failed);
    });

    it('is Inactive when every objective is still inactive', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      quest.refreshState();

      expect(quest.state).toBe(OmniQuest.States.Inactive);
    });

    it('is Active when at least one objective is active', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Completed),
        fakeObjective(1, OmniObjective.States.Active),
      ]);

      quest.refreshState();

      expect(quest.state).toBe(OmniQuest.States.Active);
    });

    it('is Completed when every objective is completed or missed', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [
        fakeObjective(0, OmniObjective.States.Completed),
        fakeObjective(1, OmniObjective.States.Missed),
      ]);

      quest.refreshState();

      expect(quest.state).toBe(OmniQuest.States.Completed);
    });
  });

  describe('setState', () =>
  {
    it('throws for an out-of-range state', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      expect(() => quest.setState(-1)).toThrow('Invalid quest state provided for setting of state.');
      expect(() => quest.setState(5)).toThrow('Invalid quest state provided for setting of state.');
    });

    it('is a no-op when the state does not change', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);
      const onChangeSpy = vi.spyOn(quest, 'onQuestStateChange');

      quest.setState(OmniQuest.States.Inactive);

      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('logs via $diaLogManager when transitioning to a new, non-inactive state', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);

      const builtLog = {};
      const builder = { setLines: vi.fn().mockReturnThis(), build: vi.fn(() => builtLog) };
      globalThis.DiaLogBuilder = function()
      {
        return builder;
      };
      globalThis.$diaLogManager = { addLog: vi.fn() };

      quest.setState(OmniQuest.States.Active);

      expect(builder.setLines).toHaveBeenCalledWith([ '\\C[1][Quest Name]\\C[0]', 'Quest unlocked.' ]);
      expect(globalThis.$diaLogManager.addLog).toHaveBeenCalledWith(builtLog);
    });

    it('does not log when transitioning back to Inactive', () =>
    {
      const quest = new TrackedOmniQuest('quest-key', 'main', [ fakeObjective(0, OmniObjective.States.Inactive) ]);
      quest.state = OmniQuest.States.Active;

      globalThis.$diaLogManager = { addLog: vi.fn() };

      quest.setState(OmniQuest.States.Inactive);

      expect(globalThis.$diaLogManager.addLog).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/__models/_component/tracked-omni-quest.test.js
