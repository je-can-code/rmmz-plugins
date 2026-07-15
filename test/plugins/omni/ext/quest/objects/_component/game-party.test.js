//region plugins/omni/ext/quest/objects/_component/game-party.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Party (omni ext/quest, direct src import)', () =>
{
  let FakeTrackedOmniQuest;
  let FakeTrackedOmniObjective;
  let FakeQuestManager;

  beforeEach(async () =>
  {
    vi.resetModules();

    FakeTrackedOmniQuest = vi.fn(function(key, categoryKey, objectives)
    {
      this.key = key;
      this.categoryKey = categoryKey;
      this.objectives = objectives;
    });
    FakeTrackedOmniObjective = vi.fn(function(questKey, id, fulfillment, hidden, optional)
    {
      this.questKey = questKey;
      this.id = id;
      this.fulfillment = fulfillment;
      this.hidden = hidden;
      this.optional = optional;
      this.populateFulfillmentData = vi.fn();
    });
    FakeQuestManager = {
      getValidFetchObjectives: vi.fn().mockReturnValue([]),
      quest: vi.fn(),
    };

    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniQuest.js', () => ({ default: FakeTrackedOmniQuest }));
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniObjective.js', () => ({ default: FakeTrackedOmniObjective }));
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({ default: FakeQuestManager }));

    function Game_Party()
    {
    }

    Game_Party.prototype.initOmnipediaMembers = vi.fn();
    Game_Party.prototype.processItemGain = vi.fn();
    globalThis.Game_Party = Game_Party;
    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { Game_Party: new Map() }, Metadata: { quests: [] } } } } };

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/Game_Party.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_Party;
    delete globalThis.J;
  });

  function makeOmniQuest({ key = 'quest-1', name = 'Quest Name', categoryKey = 'main', objectives = [] } = {})
  {
    return { key, name, categoryKey, objectives };
  }

  function makeOmniObjective({ id = 1, fulfillment = {}, hiddenByDefault = false, isOptional = false } = {})
  {
    return { id, fulfillment, hiddenByDefault, isOptional };
  }

  describe('initOmnipediaMembers', () =>
  {
    it('calls the original hook, then initializes and populates the questopedia', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const originalHook = globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Party.get('initOmnipediaMembers');

      // Act
      party.initOmnipediaMembers();

      // Assert
      expect(originalHook).toHaveBeenCalled();
      expect(party.getSavedQuestopediaEntries()).toEqual([]);
      expect(party.getQuestopediaEntriesCache()).toBeInstanceOf(Map);
    });
  });

  describe('populateQuestopediaTrackings/toTrackedOmniQuest', () =>
  {
    it('converts each configured omniquest into a TrackedOmniQuest and caches it by key', () =>
    {
      // Arrange
      const objective = makeOmniObjective({ id: 1 });
      const omniquest = makeOmniQuest({ key: 'quest-1', objectives: [ objective ] });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();

      // Act
      party.populateQuestopediaTrackings();

      // Assert
      expect(FakeTrackedOmniObjective).toHaveBeenCalledWith('quest-1', 1, objective.fulfillment, false, false);
      expect(FakeTrackedOmniQuest).toHaveBeenCalledWith('quest-1', 'main', expect.any(Array));
      expect(party.getQuestopediaEntryByKey('quest-1')).toBeInstanceOf(FakeTrackedOmniQuest);
    });
  });

  describe('getSavedQuestopediaEntries/setSavedQuestopediaEntries', () =>
  {
    it('round-trips the saveable entries collection', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const entries = [ { key: 'quest-1' } ];

      // Act
      party.setSavedQuestopediaEntries(entries);

      // Assert
      expect(party.getSavedQuestopediaEntries()).toBe(entries);
    });
  });

  describe('getQuestopediaEntriesCache/setQuestopediaEntriesCache', () =>
  {
    it('round-trips the entries cache', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const cache = new Map([ [ 'quest-1', {} ] ]);

      // Act
      party.setQuestopediaEntriesCache(cache);

      // Assert
      expect(party.getQuestopediaEntriesCache()).toBe(cache);
    });
  });

  describe('translateQuestopediaCacheToSaveables/translateQuestopediaSaveablesToCache', () =>
  {
    it('converts the cache into a saveable array', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const tracked = { key: 'quest-1' };
      party.setQuestopediaEntriesCache(new Map([ [ 'quest-1', tracked ] ]));

      // Act
      party.translateQuestopediaCacheToSaveables();

      // Assert
      expect(party.getSavedQuestopediaEntries()).toEqual([ tracked ]);
    });

    it('converts the saveable array back into a keyed cache', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const tracked = { key: 'quest-1' };
      party.setSavedQuestopediaEntries([ tracked ]);

      // Act
      party.translateQuestopediaSaveablesToCache();

      // Assert
      expect(party.getQuestopediaEntriesCache().get('quest-1')).toBe(tracked);
    });
  });

  describe('synchronizeQuestopediaDataBeforeSave/synchronizeQuestopediaAfterLoad', () =>
  {
    it('initializes the omnipedia first if it was not yet initialized, before saving', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.isOmnipediaInitialized = vi.fn().mockReturnValue(false);
      party.initOmnipediaMembers = vi.fn(() => party.initQuestopediaMembers());

      // Act
      party.synchronizeQuestopediaDataBeforeSave();

      // Assert
      expect(party.initOmnipediaMembers).toHaveBeenCalled();
    });

    it('does not re-initialize the omnipedia when already initialized, before saving', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      party.isOmnipediaInitialized = vi.fn().mockReturnValue(true);
      party.initOmnipediaMembers = vi.fn();

      // Act
      party.synchronizeQuestopediaDataBeforeSave();

      // Assert
      expect(party.initOmnipediaMembers).not.toHaveBeenCalled();
    });

    it('initializes the omnipedia first if it was not yet initialized, after load', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.isOmnipediaInitialized = vi.fn().mockReturnValue(false);
      party.initOmnipediaMembers = vi.fn(() => party.initQuestopediaMembers());

      // Act
      party.synchronizeQuestopediaAfterLoad();

      // Assert
      expect(party.initOmnipediaMembers).toHaveBeenCalled();
    });
  });

  describe('getQuestopediaEntries', () =>
  {
    it('returns all cached entries as an array', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const trackedA = { key: 'quest-1' };
      const trackedB = { key: 'quest-2' };
      party.setQuestopediaEntriesCache(new Map([ [ 'quest-1', trackedA ], [ 'quest-2', trackedB ] ]));

      // Act
      const result = party.getQuestopediaEntries();

      // Assert
      expect(result).toEqual([ trackedA, trackedB ]);
    });
  });

  describe('canGainEntry', () =>
  {
    it('rejects a null name', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry(null);

      // Assert
      expect(result).toEqual(false);
    });

    it('rejects an empty/whitespace-only name', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry('   ');

      // Assert
      expect(result).toEqual(false);
    });

    it('rejects a name starting with an underscore', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry('_divider');

      // Assert
      expect(result).toEqual(false);
    });

    it('rejects a name starting with a double-equals divider', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry('== Section ==');

      // Assert
      expect(result).toEqual(false);
    });

    it('rejects the "-- empty --" sentinel name', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry('-- empty --');

      // Assert
      expect(result).toEqual(false);
    });

    it('accepts a normal quest name', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();

      // Act
      const result = party.canGainEntry('Rescue the Merchant');

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('updateTrackedOmniQuestsFromConfig', () =>
  {
    it('skips a configured quest whose key/name fails canGainEntry', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      party.setSavedQuestopediaEntries([]);
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ makeOmniQuest({ key: '_hidden', objectives: [] }) ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      expect(party.getSavedQuestopediaEntries()).toEqual([]);
    });

    it('adds a brand-new tracking for a quest with no existing tracking', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      party.setSavedQuestopediaEntries([]);
      const omniquest = makeOmniQuest({ key: 'quest-1', objectives: [ makeOmniObjective({ id: 1 }) ] });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      expect(party.getSavedQuestopediaEntries()).toHaveLength(1);
      expect(party.getSavedQuestopediaEntries()[0].key).toEqual('quest-1');
    });

    it('updates the categoryKey of an existing tracking', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const existingTracking = { key: 'quest-1', categoryKey: 'old-category', objectives: [] };
      party.setSavedQuestopediaEntries([ existingTracking ]);
      const omniquest = makeOmniQuest({ key: 'quest-1', categoryKey: 'new-category', objectives: [] });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      expect(existingTracking.categoryKey).toEqual('new-category');
    });

    it('appends newly-added objectives onto an existing tracking without disturbing prior ones', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const existingObjective = { id: 1, hidden: false, optional: false, populateFulfillmentData: vi.fn() };
      const existingTracking = { key: 'quest-1', categoryKey: 'main', objectives: [ existingObjective ] };
      party.setSavedQuestopediaEntries([ existingTracking ]);
      const omniquest = makeOmniQuest({
        key: 'quest-1',
        objectives: [ makeOmniObjective({ id: 1 }), makeOmniObjective({ id: 2 }) ],
      });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      expect(existingTracking.objectives).toHaveLength(2);
      expect(existingTracking.objectives[0]).toBe(existingObjective);
    });

    it('refreshes fulfillment/hidden/optional data on every still-present existing objective', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const existingObjective = { id: 1, hidden: true, optional: true, populateFulfillmentData: vi.fn() };
      const existingTracking = { key: 'quest-1', categoryKey: 'main', objectives: [ existingObjective ] };
      party.setSavedQuestopediaEntries([ existingTracking ]);
      const newFulfillment = { targetCount: 5 };
      const omniquest = makeOmniQuest({
        key: 'quest-1',
        objectives: [ makeOmniObjective({ id: 1, fulfillment: newFulfillment, hiddenByDefault: false, isOptional: false }) ],
      });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      expect(existingObjective.populateFulfillmentData).toHaveBeenCalledWith(newFulfillment);
      expect(existingObjective.hidden).toEqual(false);
      expect(existingObjective.optional).toEqual(false);
    });

    it('skips refreshing an existing objective whose index no longer exists in the config', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      const existingObjective = { id: 2, hidden: false, optional: false, populateFulfillmentData: vi.fn() };
      const existingTracking = { key: 'quest-1', categoryKey: 'main', objectives: [ existingObjective ] };
      party.setSavedQuestopediaEntries([ existingTracking ]);
      // config now has fewer objectives than the existing tracking.
      const omniquest = makeOmniQuest({ key: 'quest-1', objectives: [] });
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [ omniquest ];

      // Act/Assert (no throw)
      expect(() => party.updateTrackedOmniQuestsFromConfig()).not.toThrow();
      expect(existingObjective.populateFulfillmentData).not.toHaveBeenCalled();
    });

    it('sorts the resulting trackings alphabetically by key', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initQuestopediaMembers();
      party.setSavedQuestopediaEntries([]);
      globalThis.J.OMNI.EXT.QUEST.Metadata.quests = [
        makeOmniQuest({ key: 'quest-zebra', objectives: [] }),
        makeOmniQuest({ key: 'quest-apple', objectives: [] }),
        makeOmniQuest({ key: 'quest-mango', objectives: [] }),
      ];

      // Act
      party.updateTrackedOmniQuestsFromConfig();

      // Assert
      const keys = party.getSavedQuestopediaEntries().map(tracking => tracking.key);
      expect(keys).toEqual([ 'quest-apple', 'quest-mango', 'quest-zebra' ]);
    });
  });

  describe('processItemGain/processItemCheck', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const item = {};

      // Act
      party.processItemGain(item, 1, false);

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Party.get('processItemGain')).toHaveBeenCalledWith(item, 1, false);
    });

    it('does nothing further when there are no valid fetch objectives', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      FakeQuestManager.getValidFetchObjectives.mockReturnValue([]);

      // Act/Assert (no throw)
      expect(() => party.processItemCheck({})).not.toThrow();
    });

    it('skips a fetch objective that is not targeting the gained item', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const objective = { isFetchTarget: vi.fn().mockReturnValue(false), synchronizeFetchTargetItemQuantity: vi.fn() };
      FakeQuestManager.getValidFetchObjectives.mockReturnValue([ objective ]);

      // Act
      party.processItemCheck({});

      // Assert
      expect(objective.synchronizeFetchTargetItemQuantity).not.toHaveBeenCalled();
    });

    it('synchronizes a matching fetch objective but does not progress the quest when not yet fulfilled', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const objective = {
        isFetchTarget: vi.fn().mockReturnValue(true),
        synchronizeFetchTargetItemQuantity: vi.fn(),
        hasFetchedEnoughItems: vi.fn().mockReturnValue(false),
      };
      FakeQuestManager.getValidFetchObjectives.mockReturnValue([ objective ]);

      // Act
      party.processItemCheck({});

      // Assert
      expect(objective.synchronizeFetchTargetItemQuantity).toHaveBeenCalled();
      expect(FakeQuestManager.quest).not.toHaveBeenCalled();
    });

    it('progresses the quest when a matching fetch objective becomes fulfilled', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const objective = {
        id: 3,
        questKey: 'quest-1',
        isFetchTarget: vi.fn().mockReturnValue(true),
        synchronizeFetchTargetItemQuantity: vi.fn(),
        hasFetchedEnoughItems: vi.fn().mockReturnValue(true),
      };
      FakeQuestManager.getValidFetchObjectives.mockReturnValue([ objective ]);
      const quest = { flagObjectiveAsCompleted: vi.fn(), progressObjectives: vi.fn() };
      FakeQuestManager.quest.mockReturnValue(quest);

      // Act
      party.processItemCheck({});

      // Assert
      expect(quest.flagObjectiveAsCompleted).toHaveBeenCalledWith(3);
      expect(quest.progressObjectives).toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-party.test.js
