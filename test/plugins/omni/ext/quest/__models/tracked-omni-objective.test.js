//region plugins/omni/ext/quest/__models/tracked-omni-objective.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TrackedOmniObjective statically imports QuestManager for hasCompletedAllQuests(); mock it so the
// hoisted static import resolves to a spyable double instead of the real manager (which itself reaches
// through to $gameParty).
vi.mock('../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({
  default: { quest: vi.fn() },
}));

import QuestManager from '../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js';
import OmniFulfillmentData from '../../../../../../src/plugins/omni/ext/quest/__models/OmniFulfillmentData.js';
import OmniObjective from '../../../../../../src/plugins/omni/ext/quest/__models/OmniObjective.js';
import DestinationData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/DestinationData.js';
import FetchData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/FetchData.js';
import SlayData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/SlayData.js';
import QuestData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/QuestData.js';

describe('TrackedOmniObjective (omni ext/quest, direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniObjective.js').default} */
  let TrackedOmniObjective;

  beforeAll(async () =>
  {
    // TrackedOmniObjective.js calls SerializableRegistry.register(...) as an import-time side effect.
    globalThis.SerializableRegistry = { register: vi.fn() };

    // initializeFulfillmentData() defaults _indiscriminateTargetData to String.empty, the J-Base
    // sentinel polyfill normally installed by _base/_metadata/initialization.js.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }

    ({ default: TrackedOmniObjective } =
      await import('../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniObjective.js'));
  });

  afterAll(() =>
  {
    delete globalThis.SerializableRegistry;
  });

  beforeEach(() =>
  {
    // objectiveMetadata()/parentQuestMetadata() read straight from the plugin's parsed metadata map.
    globalThis.J = { OMNI: { EXT: { QUEST: { Metadata: { questsMap: new Map() } } } } };

    // $diaLogManager gates onObjectiveUpdate()'s logging side effect; default it off so tests that
    // aren't specifically about logging don't need a DiaLogBuilder stub.
    globalThis.$diaLogManager = undefined;
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.$diaLogManager;
    delete globalThis.$gameMap;
    delete globalThis.$gamePlayer;
    delete globalThis.$gameParty;
    delete globalThis.$dataItems;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.DiaLogBuilder;
    vi.clearAllMocks();
  });

  /**
   * Registers a quest with a single objective of the given type/fulfillment in the metadata map so
   * objectiveMetadata()/parentQuestMetadata() have something to resolve.
   * @param {string} type One of OmniObjective.Types.
   * @param {OmniFulfillmentData} fulfillment The fulfillment payload for the objective.
   * @param {object=} logsOverride Overrides the default logs object.
   * @returns {TrackedOmniObjective}
   */
  function buildTracked(type, fulfillment, logsOverride = undefined)
  {
    const logs = logsOverride ?? {
      inactive: 'inactive-log',
      active: 'active-log',
      completed: 'completed-log',
      failed: 'failed-log',
      missed: 'missed-log',
    };

    const objectiveMetadata = new OmniObjective(0, type, 'a description', logs, fulfillment);
    const questMetadata = { name: 'Quest Name', objectives: [ objectiveMetadata ] };

    globalThis.J.OMNI.EXT.QUEST.Metadata.questsMap.set('quest-key', questMetadata);

    return new TrackedOmniObjective('quest-key', 0, fulfillment, true, false);
  }

  describe('constructor / populateFulfillmentData', () =>
  {
    it('captures the indiscriminate hint, falling back to the default message when none is provided', () =>
    {
      const fulfillment = new OmniFulfillmentData();
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, fulfillment);

      expect(tracked._indiscriminateTargetData).toBe('No indiscriminate objective instructions provided.');
    });

    it('captures the provided indiscriminate hint when present', () =>
    {
      const fulfillment = new OmniFulfillmentData({ hint: 'go talk to the mayor' });
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, fulfillment);

      expect(tracked._indiscriminateTargetData).toBe('go talk to the mayor');
    });

    it('captures the mapId and coordinate range for destination objectives', () =>
    {
      const destination = Object.assign(new DestinationData(), { mapId: 3, x1: 1, y1: 2, x2: 5, y2: 6 });
      const fulfillment = new OmniFulfillmentData(undefined, destination);
      const tracked = buildTracked(OmniObjective.Types.Destination, fulfillment);

      expect(tracked._targetMapId).toBe(3);
      expect(tracked._targetCoordinateRange).toEqual([ [ 1, 2 ], [ 5, 6 ] ]);
    });

    it('captures the type/id/amount for fetch objectives', () =>
    {
      const fetch = Object.assign(new FetchData(), { type: 1, id: 9, amount: 4 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);

      expect(tracked._targetItemType).toBe(1);
      expect(tracked._targetItemId).toBe(9);
      expect(tracked._targetItemFetchQuantity).toBe(4);
    });

    it('captures the enemyId/amount for slay objectives', () =>
    {
      const slay = Object.assign(new SlayData(), { id: 15, amount: 3 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, slay);
      const tracked = buildTracked(OmniObjective.Types.Slay, fulfillment);

      expect(tracked._targetEnemyId).toBe(15);
      expect(tracked._targetEnemyAmount).toBe(3);
    });

    it('captures a copy of the quest keys for quest objectives', () =>
    {
      const quest = Object.assign(new QuestData(), { keys: [ 'a', 'b' ] });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, undefined, quest);
      const tracked = buildTracked(OmniObjective.Types.Quest, fulfillment);

      expect(tracked._targetQuestKeys).toEqual([ 'a', 'b' ]);
      // it must be a copy, not the same array reference, so mutating the source doesn't leak in.
      expect(tracked._targetQuestKeys).not.toBe(quest.keys);
    });

    it('starts every objective in the Inactive state', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());

      expect(tracked.state).toBe(OmniObjective.States.Inactive);
    });
  });

  describe('state check predicates', () =>
  {
    let tracked;

    beforeEach(() =>
    {
      tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
    });

    it('isKnown is true for a non-hidden inactive objective', () =>
    {
      tracked.hidden = false;

      expect(tracked.isKnown()).toBe(true);
    });

    it('isKnown is false for a hidden, still-inactive objective', () =>
    {
      tracked.hidden = true;

      expect(tracked.isKnown()).toBe(false);
    });

    it('isKnown is true once the objective has moved beyond inactive, even if hidden', () =>
    {
      tracked.hidden = true;
      tracked.state = OmniObjective.States.Active;

      expect(tracked.isKnown()).toBe(true);
    });

    it.each([
      [ OmniObjective.States.Completed, true ],
      [ OmniObjective.States.Failed, true ],
      [ OmniObjective.States.Missed, true ],
      [ OmniObjective.States.Active, false ],
      [ OmniObjective.States.Inactive, false ],
    ])('isFinalized is %s for state %i', (state, expected) =>
    {
      tracked.state = state;

      expect(tracked.isFinalized()).toBe(expected);
    });

    it('isValid rejects already-finalized objectives', () =>
    {
      tracked.state = OmniObjective.States.Completed;

      expect(tracked.isValid(OmniObjective.Types.Indiscriminate)).toBe(false);
    });

    it('isValid rejects hidden, non-active objectives', () =>
    {
      tracked.state = OmniObjective.States.Inactive;
      tracked.hidden = true;

      expect(tracked.isValid(OmniObjective.Types.Indiscriminate)).toBe(false);
    });

    it('isValid rejects a type mismatch', () =>
    {
      tracked.state = OmniObjective.States.Active;

      expect(tracked.isValid(OmniObjective.Types.Slay)).toBe(false);
    });

    it('isValid accepts an active, matching-type objective', () =>
    {
      tracked.state = OmniObjective.States.Active;

      expect(tracked.isValid(OmniObjective.Types.Indiscriminate)).toBe(true);
    });
  });

  describe('isFulfilled', () =>
  {
    it('indiscriminate objectives can never be programmatically fulfilled', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());

      expect(tracked.isFulfilled()).toBe(false);
    });

    it('destination objectives are fulfilled when the player is within the coordinate rectangle', () =>
    {
      const destination = Object.assign(new DestinationData(), { mapId: 1, x1: 0, y1: 0, x2: 5, y2: 5 });
      const fulfillment = new OmniFulfillmentData(undefined, destination);
      const tracked = buildTracked(OmniObjective.Types.Destination, fulfillment);

      globalThis.$gameMap = { mapId: () => 1 };
      globalThis.$gamePlayer = { x: 3, y: 3 };

      expect(tracked.isFulfilled()).toBe(true);
    });

    it('destination objectives are not fulfilled on the wrong map', () =>
    {
      const destination = Object.assign(new DestinationData(), { mapId: 1, x1: 0, y1: 0, x2: 5, y2: 5 });
      const fulfillment = new OmniFulfillmentData(undefined, destination);
      const tracked = buildTracked(OmniObjective.Types.Destination, fulfillment);

      globalThis.$gameMap = { mapId: () => 2 };
      globalThis.$gamePlayer = { x: 3, y: 3 };

      expect(tracked.isFulfilled()).toBe(false);
    });

    it('fetch objectives synchronize against $gameParty.numItems before evaluating', () =>
    {
      const targetItem = { id: 1 };
      const fetch = Object.assign(new FetchData(), { type: 0, id: 1, amount: 2 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);

      globalThis.$dataItems = [ undefined, targetItem ];
      globalThis.$gameParty = { numItems: vi.fn(() => 2) };

      expect(tracked.isFulfilled()).toBe(true);
      expect(globalThis.$gameParty.numItems).toHaveBeenCalledWith(targetItem);
    });

    it('fetch objectives are not fulfilled while under the target quantity', () =>
    {
      const targetItem = { id: 1 };
      const fetch = Object.assign(new FetchData(), { type: 0, id: 1, amount: 5 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);

      globalThis.$dataItems = [ undefined, targetItem ];
      globalThis.$gameParty = { numItems: vi.fn(() => 1) };

      expect(tracked.isFulfilled()).toBe(false);
    });

    it('slay objectives are fulfilled once the tracked kill count meets the target', () =>
    {
      const slay = Object.assign(new SlayData(), { id: 4, amount: 2 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, slay);
      const tracked = buildTracked(OmniObjective.Types.Slay, fulfillment);

      tracked.incrementSlayTargetEnemyAmount();
      expect(tracked.isFulfilled()).toBe(false);

      tracked.incrementSlayTargetEnemyAmount();
      expect(tracked.isFulfilled()).toBe(true);
    });

    it('quest objectives with no required keys are trivially fulfilled', () =>
    {
      const quest = Object.assign(new QuestData(), { keys: [] });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, undefined, quest);
      const tracked = buildTracked(OmniObjective.Types.Quest, fulfillment);

      expect(tracked.isFulfilled()).toBe(true);
    });

    it('quest objectives are fulfilled once every required quest reports isCompleted()', () =>
    {
      const quest = Object.assign(new QuestData(), { keys: [ 'other-quest' ] });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, undefined, quest);
      const tracked = buildTracked(OmniObjective.Types.Quest, fulfillment);

      QuestManager.quest.mockReturnValue({ isCompleted: () => true });

      expect(tracked.isFulfilled()).toBe(true);
      expect(QuestManager.quest).toHaveBeenCalledWith('other-quest');
    });

    it('quest objectives are not fulfilled while a required quest is not yet completed', () =>
    {
      const quest = Object.assign(new QuestData(), { keys: [ 'other-quest' ] });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, undefined, undefined, quest);
      const tracked = buildTracked(OmniObjective.Types.Quest, fulfillment);

      QuestManager.quest.mockReturnValue({ isCompleted: () => false });

      expect(tracked.isFulfilled()).toBe(false);
    });
  });

  describe('isFetchTarget', () =>
  {
    it('returns false for non-fetch objectives regardless of the entry', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData());

      expect(tracked.isFetchTarget({ id: 1, isItem: () => true })).toBe(false);
    });

    it('returns false when the entry type does not match the target item type', () =>
    {
      const fetch = Object.assign(new FetchData(), { type: 0, id: 1, amount: 1 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);

      const weaponEntry = { id: 1, isItem: () => false, isWeapon: () => true, isArmor: () => false };

      expect(tracked.isFetchTarget(weaponEntry)).toBe(false);
    });

    it('returns true when both the type and id match', () =>
    {
      const fetch = Object.assign(new FetchData(), { type: 0, id: 1, amount: 1 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);

      const itemEntry = { id: 1, isItem: () => true, isWeapon: () => false, isArmor: () => false };

      expect(tracked.isFetchTarget(itemEntry)).toBe(true);
    });
  });

  describe('setState', () =>
  {
    it('changes state and calls onObjectiveUpdate when the new state differs', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      const updateSpy = vi.spyOn(tracked, 'onObjectiveUpdate');

      tracked.setState(OmniObjective.States.Active);

      expect(tracked.state).toBe(OmniObjective.States.Active);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the new state matches the current state', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      const updateSpy = vi.spyOn(tracked, 'onObjectiveUpdate');

      tracked.setState(OmniObjective.States.Inactive);

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('logging via handleObjectiveUpdateLog', () =>
  {
    it('adds a completed-state log line to $diaLogManager when finalized as completed', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Completed;

      const builtLog = {};
      const builder = { setLines: vi.fn().mockReturnThis(), build: vi.fn(() => builtLog) };
      globalThis.DiaLogBuilder = function()
      {
        return builder;
      };
      globalThis.$diaLogManager = { addLog: vi.fn() };

      tracked.onObjectiveUpdate();

      expect(builder.setLines).toHaveBeenCalledWith([
        '\\C[1][Quest Name]\\C[0] updated.',
        'Objective completed.',
      ]);
      expect(globalThis.$diaLogManager.addLog).toHaveBeenCalledWith(builtLog);
    });

    it('does nothing when the objective has not been finalized', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Active;

      globalThis.DiaLogBuilder = vi.fn();
      globalThis.$diaLogManager = { addLog: vi.fn() };

      tracked.onObjectiveUpdate();

      expect(globalThis.$diaLogManager.addLog).not.toHaveBeenCalled();
    });
  });

  describe('log()', () =>
  {
    it('returns the log line matching the current state', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Failed;

      expect(tracked.log()).toBe('failed-log');
    });
  });

  describe('fetchDataSourceTextPrefix / fetchItemDataSource', () =>
  {
    it('throws for an unrecognized target item type', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData());
      tracked._targetItemType = 99;

      expect(() => tracked.fetchDataSourceTextPrefix()).toThrow('unknown target item type: 99');
      expect(() => tracked.fetchItemDataSource()).toThrow('unknown target item type: 99');
    });

    it('resolves the escape code and datasource for each known item type', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData());
      globalThis.$dataItems = [ 'items' ];
      globalThis.$dataWeapons = [ 'weapons' ];
      globalThis.$dataArmors = [ 'armors' ];

      tracked._targetItemType = OmniObjective.FetchTypes.Item;
      expect(tracked.fetchDataSourceTextPrefix()).toBe('\\Item');
      expect(tracked.fetchItemDataSource()).toBe(globalThis.$dataItems);

      tracked._targetItemType = OmniObjective.FetchTypes.Weapon;
      expect(tracked.fetchDataSourceTextPrefix()).toBe('\\Weapon');
      expect(tracked.fetchItemDataSource()).toBe(globalThis.$dataWeapons);

      tracked._targetItemType = OmniObjective.FetchTypes.Armor;
      expect(tracked.fetchDataSourceTextPrefix()).toBe('\\Armor');
      expect(tracked.fetchItemDataSource()).toBe(globalThis.$dataArmors);
    });
  });
});
//endregion plugins/omni/ext/quest/__models/tracked-omni-objective.test.js
