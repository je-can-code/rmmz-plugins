//region plugins/omni/ext/quest/managers/quest-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuestManager from '../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js';
import OmniObjective from '../../../../../../src/plugins/omni/ext/quest/__models/OmniObjective.js';
import OmniQuest from '../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js';

describe('QuestManager (omni ext/quest, direct src import)', () =>
{
  beforeEach(() =>
  {
    globalThis.J = {
      OMNI: {
        EXT: {
          QUEST: {
            Metadata: {
              questsMap: new Map(),
              categoriesMap: new Map(),
              categories: [ { key: 'main' } ],
              tagsMap: new Map(),
              tags: [ { key: 'combat' } ],
            },
          },
        },
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.$gameParty;
    delete globalThis.$gameMap;
    vi.restoreAllMocks();
  });

  it('is a static class that cannot be constructed', () =>
  {
    expect(() => new QuestManager()).toThrow('This is a static class.');
  });

  describe('quest()', () =>
  {
    it('returns the tracked quest from $gameParty when it exists', () =>
    {
      const tracking = { key: 'quest-key' };
      globalThis.$gameParty = { getQuestopediaEntryByKey: vi.fn(() => tracking) };

      expect(QuestManager.quest('quest-key')).toBe(tracking);
    });

    it('throws when the quest key does not resolve to a tracked quest', () =>
    {
      globalThis.$gameParty = { getQuestopediaEntryByKey: vi.fn(() => undefined) };
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => QuestManager.quest('missing'))
        .toThrow('Attempted to leverage a non-existent quest with the key of: missing.');
    });
  });

  describe('questMetadatas()', () =>
  {
    it('returns the questsMap from plugin metadata', () =>
    {
      expect(QuestManager.questMetadatas()).toBe(globalThis.J.OMNI.EXT.QUEST.Metadata.questsMap);
    });
  });

  describe('trackedQuests()', () =>
  {
    it('returns only the quests flagged as tracked', () =>
    {
      const tracked = { isTracked: () => true };
      const untracked = { isTracked: () => false };
      globalThis.$gameParty = {
        getQuestopediaEntriesCache: () => new Map([ [ 'a', tracked ], [ 'b', untracked ] ]),
      };

      expect(QuestManager.trackedQuests()).toEqual([ tracked ]);
    });
  });

  describe('setQuestTrackingByKey()', () =>
  {
    it('toggles tracking on the resolved quest to the given state', () =>
    {
      const quest = { toggleTracked: vi.fn() };
      globalThis.$gameParty = { getQuestopediaEntryByKey: vi.fn(() => quest) };

      QuestManager.setQuestTrackingByKey('quest-key', true);

      expect(quest.toggleTracked).toHaveBeenCalledWith(true);
    });
  });

  describe('category() / categories()', () =>
  {
    it('returns the category metadata by key', () =>
    {
      const category = { key: 'main' };
      globalThis.J.OMNI.EXT.QUEST.Metadata.categoriesMap.set('main', category);

      expect(QuestManager.category('main')).toBe(category);
    });

    it('throws when the category key is unknown', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => QuestManager.category('missing'))
        .toThrow('Attempted to leverage a non-existent quest category with the key of: missing.');
    });

    it('categories(true) returns the map, categories(false) returns the array', () =>
    {
      expect(QuestManager.categories()).toBe(globalThis.J.OMNI.EXT.QUEST.Metadata.categoriesMap);
      expect(QuestManager.categories(false)).toBe(globalThis.J.OMNI.EXT.QUEST.Metadata.categories);
    });
  });

  describe('tag() / tags()', () =>
  {
    it('returns the tag metadata by key', () =>
    {
      const tag = { key: 'combat' };
      globalThis.J.OMNI.EXT.QUEST.Metadata.tagsMap.set('combat', tag);

      expect(QuestManager.tag('combat')).toBe(tag);
    });

    it('throws when the tag key is unknown', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => QuestManager.tag('missing'))
        .toThrow('Attempted to leverage a non-existent quest tag with the key of: missing.');
    });

    it('tags(true) returns the map, tags(false) returns the array', () =>
    {
      expect(QuestManager.tags()).toBe(globalThis.J.OMNI.EXT.QUEST.Metadata.tagsMap);
      expect(QuestManager.tags(false)).toBe(globalThis.J.OMNI.EXT.QUEST.Metadata.tags);
    });
  });

  describe('unlockQuestByKey() / canDoObjective() / isQuestActive() / isQuestUnlocked() / isQuestCompleted() / isObjectiveCompleted() / progressQuest()', () =>
  {
    let quest;

    beforeEach(() =>
    {
      quest = {
        unlock: vi.fn(),
        canExecuteObjectiveById: vi.fn(() => true),
        isActive: vi.fn(() => true),
        isInactive: vi.fn(() => false),
        state: OmniQuest.States.Completed,
        isObjectiveCompleted: vi.fn(() => true),
        progressObjectives: vi.fn(),
      };
      globalThis.$gameParty = { getQuestopediaEntryByKey: vi.fn(() => quest) };
    });

    it('unlockQuestByKey unlocks the resolved quest', () =>
    {
      QuestManager.unlockQuestByKey('quest-key');

      expect(quest.unlock).toHaveBeenCalled();
    });

    it('canDoObjective delegates to the quest, forwarding the objective id', () =>
    {
      expect(QuestManager.canDoObjective('quest-key', 2)).toBe(true);
      expect(quest.canExecuteObjectiveById).toHaveBeenCalledWith(2);
    });

    it('isQuestActive delegates to quest.isActive()', () =>
    {
      expect(QuestManager.isQuestActive('quest-key')).toBe(true);
    });

    it('isQuestUnlocked is the negation of quest.isInactive()', () =>
    {
      expect(QuestManager.isQuestUnlocked('quest-key')).toBe(true);
    });

    it('isQuestCompleted compares quest.state against Completed', () =>
    {
      expect(QuestManager.isQuestCompleted('quest-key')).toBe(true);

      quest.state = OmniQuest.States.Active;
      expect(QuestManager.isQuestCompleted('quest-key')).toBe(false);
    });

    it('isObjectiveCompleted delegates to the quest, forwarding the objective id', () =>
    {
      expect(QuestManager.isObjectiveCompleted('quest-key', 3)).toBe(true);
      expect(quest.isObjectiveCompleted).toHaveBeenCalledWith(3);
    });

    it('progressQuest delegates to quest.progressObjectives()', () =>
    {
      QuestManager.progressQuest('quest-key');

      expect(quest.progressObjectives).toHaveBeenCalled();
    });
  });

  describe('getValidDestinationObjectives / getValidFetchObjectives / getValidSlayObjectives / getValidQuestCompletionObjectives', () =>
  {
    /**
     * Builds a fake tracked quest with a single objective whose isValid()/type-specific data matches
     * the given type, so it passes each getValid*Objectives() filter for that type only.
     * @param {number} state
     * @param {string} validType
     * @param {object=} overrides
     * @returns {object}
     */
    function questWithObjective(state, validType, overrides = {})
    {
      const objective = {
        questKey: 'quest-key',
        id: 0,
        isValid: type => type === validType,
        destinationData: () => [ 1, [] ],
        questCompletionData: () => [ 'other' ],
        ...overrides,
      };

      return { state, objectives: [ objective ] };
    }

    it('getValidDestinationObjectives requires the player to be on the objective map', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Active, OmniObjective.Types.Destination);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };
      globalThis.$gameMap = { mapId: () => 1 };

      expect(QuestManager.getValidDestinationObjectives()).toEqual(quest.objectives);
    });

    it('getValidDestinationObjectives excludes objectives on a different map', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Active, OmniObjective.Types.Destination);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };
      globalThis.$gameMap = { mapId: () => 99 };

      expect(QuestManager.getValidDestinationObjectives()).toEqual([]);
    });

    it('excludes quests in states outside Inactive/Active from every getValid* helper', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Completed, OmniObjective.Types.Destination);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };
      globalThis.$gameMap = { mapId: () => 1 };

      expect(QuestManager.getValidDestinationObjectives()).toEqual([]);
    });

    it('getValidFetchObjectives returns only objectives valid for the Fetch type', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Active, OmniObjective.Types.Fetch);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };

      expect(QuestManager.getValidFetchObjectives()).toEqual(quest.objectives);
    });

    it('getValidSlayObjectives returns only objectives valid for the Slay type', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Active, OmniObjective.Types.Slay);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };

      expect(QuestManager.getValidSlayObjectives()).toEqual(quest.objectives);
    });

    it('getValidQuestCompletionObjectives excludes Quest-type objectives with no required quest keys', () =>
    {
      const quest = questWithObjective(
        OmniQuest.States.Active,
        OmniObjective.Types.Quest,
        { questCompletionData: () => [] });
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(QuestManager.getValidQuestCompletionObjectives()).toEqual([]);
    });

    it('getValidQuestCompletionObjectives returns Quest-type objectives that do have required quest keys', () =>
    {
      const quest = questWithObjective(OmniQuest.States.Active, OmniObjective.Types.Quest);
      globalThis.$gameParty = { getQuestopediaEntriesCache: () => new Map([ [ 'a', quest ] ]) };

      expect(QuestManager.getValidQuestCompletionObjectives()).toEqual(quest.objectives);
    });
  });
});
//endregion plugins/omni/ext/quest/managers/quest-manager.test.js
