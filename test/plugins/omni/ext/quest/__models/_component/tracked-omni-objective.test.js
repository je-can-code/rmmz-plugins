//region plugins/omni/ext/quest/__models/_component/tracked-omni-objective.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TrackedOmniObjective statically imports QuestManager for hasCompletedAllQuests(); mock it so the
// hoisted static import resolves to a spyable double instead of the real manager (which itself reaches
// through to $gameParty).
vi.mock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({
  default: { quest: vi.fn() },
}));

import QuestManager from '../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js';
import OmniFulfillmentData from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniFulfillmentData.js';
import OmniObjective from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniObjective.js';
import DestinationData from '../../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/DestinationData.js';
import FetchData from '../../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/FetchData.js';
import SlayData from '../../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/SlayData.js';
import QuestData from '../../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/QuestData.js';

describe('TrackedOmniObjective (omni ext/quest, direct src import)', () =>
{
  /** @type {typeof import('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniObjective.js').default} */
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
      await import('../../../../../../../src/plugins/omni/ext/quest/__models/TrackedOmniObjective.js'));
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

    it('isHidden is false for an objective the player is allowed to see', () =>
    {
      tracked.hidden = false;

      expect(tracked.isHidden()).toBe(false);
    });

    it('isHidden is true for an objective the player has not uncovered', () =>
    {
      tracked.hidden = true;

      expect(tracked.isHidden()).toBe(true);
    });

    it('isValid rejects already-finalized objectives', () =>
    {
      // the objective is left visible on purpose- a hidden, non-active objective is refused by a
      // second guard further down, which would answer false here no matter what the state said.
      tracked.hidden = false;
      tracked.state = OmniObjective.States.Completed;

      expect(tracked.isValid(OmniObjective.Types.Indiscriminate)).toBe(false);
    });

    it('isValid rejects a failed objective', () =>
    {
      // a failed objective is finalized just as firmly as a completed one, and the visibility guard
      // is again taken out of the picture.
      tracked.hidden = false;
      tracked.state = OmniObjective.States.Failed;

      expect(tracked.isValid(OmniObjective.Types.Indiscriminate)).toBe(false);
    });

    it('isValid rejects a missed objective', () =>
    {
      tracked.hidden = false;
      tracked.state = OmniObjective.States.Missed;

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

    it('returns false for a non-fetch objective whose item fields happen to line up with the entry', () =>
    {
      // Arrange- the fetch fields are dialed in by hand so every downstream check would pass; the
      // objective's own type is then the only thing left that can refuse the entry.
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData());
      tracked.setTargetItemType(0);
      tracked.setTargetItemId(9);
      const itemEntry = { id: 9, isItem: () => true, isWeapon: () => false, isArmor: () => false };

      // Act & Assert
      expect(tracked.isFetchTarget(itemEntry)).toBe(false);
    });

    it('returns true for a weapon the objective is asking for', () =>
    {
      // Arrange- each item-type arm reads its own table, so the weapon arm must not be gated on the
      // entry also being an ordinary item.
      const fetch = Object.assign(new FetchData(), { type: 1, id: 9, amount: 1 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);
      const weaponEntry = { id: 9, isItem: () => false, isWeapon: () => true, isArmor: () => false };

      // Act & Assert
      expect(tracked.isFetchTarget(weaponEntry)).toBe(true);
    });

    it('returns false for the right kind of entry carrying the wrong id', () =>
    {
      // Arrange- a potion is not the potion this quest wants; the type match alone cannot decide it.
      const fetch = Object.assign(new FetchData(), { type: 0, id: 9, amount: 1 });
      const fulfillment = new OmniFulfillmentData(undefined, undefined, fetch);
      const tracked = buildTracked(OmniObjective.Types.Fetch, fulfillment);
      const otherItemEntry = { id: 4, isItem: () => true, isWeapon: () => false, isArmor: () => false };

      // Act & Assert
      expect(tracked.isFetchTarget(otherItemEntry)).toBe(false);
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

  describe('isPlayerWithinDestinationRange', () =>
  {
    /**
     * Stands up a destination objective covering the rectangle from (2,2) to (5,5) on map 1, and
     * drops the player at the given tile.
     * @param {number} x The player's x tile.
     * @param {number} y The player's y tile.
     * @returns {TrackedOmniObjective} The objective under test.
     */
    function trackedWithPlayerAt(x, y)
    {
      const destination = Object.assign(new DestinationData(), { mapId: 1, x1: 2, y1: 2, x2: 5, y2: 5 });
      const fulfillment = new OmniFulfillmentData(undefined, destination);
      const tracked = buildTracked(OmniObjective.Types.Destination, fulfillment);

      globalThis.$gameMap = { mapId: () => 1 };
      globalThis.$gamePlayer = { x, y };

      return tracked;
    }

    it('accepts a player standing inside the rectangle', () =>
    {
      // Arrange
      const tracked = trackedWithPlayerAt(3, 3);

      // Act & Assert
      expect(tracked.isPlayerWithinDestinationRange()).toBe(true);
    });

    it('rejects a player standing west of the rectangle', () =>
    {
      // Arrange- every other edge is satisfied, so the western edge is the only one that can refuse.
      const tracked = trackedWithPlayerAt(1, 3);

      // Act & Assert
      expect(tracked.isPlayerWithinDestinationRange()).toBe(false);
    });

    it('rejects a player standing east of the rectangle', () =>
    {
      // Arrange
      const tracked = trackedWithPlayerAt(6, 3);

      // Act & Assert
      expect(tracked.isPlayerWithinDestinationRange()).toBe(false);
    });

    it('rejects a player standing north of the rectangle', () =>
    {
      // Arrange
      const tracked = trackedWithPlayerAt(3, 1);

      // Act & Assert
      expect(tracked.isPlayerWithinDestinationRange()).toBe(false);
    });

    it('rejects a player standing south of the rectangle', () =>
    {
      // Arrange
      const tracked = trackedWithPlayerAt(3, 6);

      // Act & Assert
      expect(tracked.isPlayerWithinDestinationRange()).toBe(false);
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
      // J-Log must be present for the announcement path to run at all.
      globalThis.J.LOG = {};
      globalThis.$diaLogManager = { addLog: vi.fn() };

      tracked.onObjectiveUpdate();

      expect(builder.setLines).toHaveBeenCalledWith([
        '\\C[1][Quest Name]\\C[0] updated.',
        'Objective completed.',
      ]);
      expect(globalThis.$diaLogManager.addLog).toHaveBeenCalledWith(builtLog);
    });

    it('announces nothing at all when J-Log is not installed', () =>
    {
      // Arrange- the objective is finalized and the log manager is standing by, so the handler's own
      // not-finalized guard cannot be what keeps the journal quiet; only J-Log's absence can.
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Completed;

      const builder = { setLines: vi.fn().mockReturnThis(), build: vi.fn(() => ({})) };
      globalThis.DiaLogBuilder = function()
      {
        return builder;
      };
      globalThis.$diaLogManager = { addLog: vi.fn() };

      // Act
      tracked.onObjectiveUpdate();

      // Assert
      expect(globalThis.$diaLogManager.addLog).not.toHaveBeenCalled();
    });

    it('does nothing when the objective has not been finalized', () =>
    {
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Active;

      globalThis.DiaLogBuilder = vi.fn();
      // J-Log must be present for the announcement path to run at all.
      globalThis.J.LOG = {};
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

  //region what the objective reads as
  describe('indiscriminateTargetData()', () =>
  {
    it('hands back the hint the fulfillment data carried in', () =>
    {
      // Arrange
      const fulfillment = new OmniFulfillmentData({ hint: 'go talk to the mayor' });

      // Act
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, fulfillment);

      // Assert
      expect(tracked.indiscriminateTargetData())
        .toBe('go talk to the mayor');
    });
  });

  describe('targetEnemyId()', () =>
  {
    it('hands back the enemy this objective is counting', () =>
    {
      // Arrange
      const slay = Object.assign(new SlayData(), { id: 15, amount: 3 });

      // Act
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData(undefined, undefined, undefined,
        slay));

      // Assert
      expect(tracked.targetEnemyId())
        .toBe(15);
    });
  });

  describe('fetchData()', () =>
  {
    it('pairs the wanted item with how many of it are wanted', () =>
    {
      // Arrange
      const fetch = Object.assign(new FetchData(), { type: 0, id: 9, amount: 4 });
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData(undefined, undefined, fetch));

      // Act
      const data = tracked.fetchData();

      // Assert
      expect(data)
        .toEqual([ 9, 4 ]);
    });
  });

  describe('slayData()', () =>
  {
    it('pairs the wanted enemy with how many of it are wanted', () =>
    {
      // Arrange
      const slay = Object.assign(new SlayData(), { id: 15, amount: 3 });
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData(undefined, undefined, undefined,
        slay));

      // Act
      const data = tracked.slayData();

      // Assert
      expect(data)
        .toEqual([ 15, 3 ]);
    });
  });

  describe('description()', () =>
  {
    it('reads the objective\'s description off the quest metadata rather than storing a copy', () =>
    {
      // Arrange: a description copied into the tracker at save time would freeze there, and rewording
      // a quest would then never reach a playthrough already carrying it.
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());

      // Act
      const description = tracked.description();

      // Assert
      expect(description)
        .toBe('a description');
    });
  });

  describe('log()', () =>
  {
    [
      [ 'Inactive', 'inactive-log' ],
      [ 'Active', 'active-log' ],
      [ 'Completed', 'completed-log' ],
      [ 'Failed', 'failed-log' ],
      [ 'Missed', 'missed-log' ],
    ].forEach(([ stateName, expected ]) =>
    {
      it(`reads the ${stateName.toLowerCase()} line while the objective sits in that state`, () =>
      {
        // Arrange
        const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
        tracked.state = OmniObjective.States[stateName];

        // Act
        const log = tracked.log();

        // Assert: the quest journal shows one of five sentences per objective, and which one is the
        // only thing distinguishing "go find the mayor" from "you found the mayor".
        expect(log)
          .toBe(expected);
      });
    });
  });

  describe('iconIndexByState()', () =>
  {
    [
      [ 'Inactive', 93 ],
      [ 'Active', 92 ],
      [ 'Completed', 91 ],
      [ 'Failed', 90 ],
      [ 'Missed', 95 ],
    ].forEach(([ stateName, expected ]) =>
    {
      it(`marks a ${stateName.toLowerCase()} objective with its own icon`, () =>
      {
        // Arrange
        const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
        tracked.state = OmniObjective.States[stateName];

        // Act
        const iconIndex = tracked.iconIndexByState();

        // Assert
        expect(iconIndex)
          .toBe(expected);
      });
    });
  });

  describe('fulfillmentText()', () =>
  {
    it('states an indiscriminate objective as the hint it was written with', () =>
    {
      // Arrange
      const fulfillment = new OmniFulfillmentData({ hint: 'go talk to the mayor' });
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, fulfillment);

      // Act
      const text = tracked.fulfillmentText();

      // Assert
      expect(text)
        .toBe('go talk to the mayor');
    });

    it('states a destination as the map and the corners of its region', () =>
    {
      // Arrange
      const destination = Object.assign(new DestinationData(), {
        mapId: 3,
        x1: 1,
        y1: 2,
        x2: 5,
        y2: 6,
      });
      const tracked = buildTracked(OmniObjective.Types.Destination, new OmniFulfillmentData(undefined, destination));
      globalThis.$gameMap = { displayName: () => 'The Kitchen' };

      // Act
      const text = tracked.fulfillmentText();

      // Assert
      expect(text)
        .toBe('Navigate to The Kitchen at [1,2, 5,6].');
    });

    it('colors a fetch objective as falling short while the count is under target', () =>
    {
      // Arrange
      const fetch = Object.assign(new FetchData(), {
        type: 0,
        id: 9,
        amount: 4,
      });
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData(undefined, undefined, fetch));
      tracked.setCurrentItemFetchQuantity(1);

      // Act
      const text = tracked.fulfillmentText();

      // Assert: 25 is the power-down color, which is what tells a glance apart from a read.
      expect(text)
        .toContain('\\C[25]1 / 4\\C[0]');
      expect(text)
        .toContain('\\Item[9]');
    });

    it('colors a fetch objective as satisfied once the count reaches target', () =>
    {
      // Arrange
      const fetch = Object.assign(new FetchData(), {
        type: 0,
        id: 9,
        amount: 4,
      });
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData(undefined, undefined, fetch));
      tracked.setCurrentItemFetchQuantity(4);

      // Act
      const text = tracked.fulfillmentText();

      // Assert
      expect(text)
        .toContain('\\C[24]4 / 4\\C[0]');
    });

    it('colors a slay objective as falling short while the count is under target', () =>
    {
      // Arrange
      const slay = Object.assign(new SlayData(), {
        id: 15,
        amount: 3,
      });
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData(undefined, undefined, undefined,
        slay));
      tracked.setCurrentEnemyAmount(1);

      // Act
      const text = tracked.fulfillmentText();

      // Assert
      expect(text)
        .toBe('Defeat \\*\\C[25]1 / 3\\C[0]\\* \\Enemy[15].');
    });

    it('colors a slay objective as satisfied once the count reaches target', () =>
    {
      // Arrange
      const slay = Object.assign(new SlayData(), {
        id: 15,
        amount: 3,
      });
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData(undefined, undefined, undefined,
        slay));
      tracked.setCurrentEnemyAmount(3);

      // Act
      const text = tracked.fulfillmentText();

      // Assert
      expect(text)
        .toContain('\\C[24]3 / 3\\C[0]');
    });

    it('states a quest objective as the quests it is waiting on, by name', () =>
    {
      // Arrange
      const quest = Object.assign(new QuestData(), { keys: [ 'first-quest', 'second-quest' ] });
      const tracked = buildTracked(OmniObjective.Types.Quest,
        new OmniFulfillmentData(undefined, undefined, undefined, undefined, quest));

      // Act
      const text = tracked.fulfillmentText();

      // Assert: the escape code resolves each key to its own title, so the journal never shows a key.
      expect(text)
        .toBe("Complete the other quest(s): '\\quest[first-quest]', '\\quest[second-quest]'.");
    });
  });
  //endregion what the objective reads as

  //region what counts toward the objective
  describe('isFetchTarget()', () =>
  {
    it('rejects an item when the objective wants a weapon', () =>
    {
      // Arrange
      const fetch = Object.assign(new FetchData(), {
        type: 1,
        id: 9,
        amount: 4,
      });
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData(undefined, undefined, fetch));

      // Act
      const isTarget = tracked.isFetchTarget({
        id: 9,
        isItem: () => true,
        isWeapon: () => false,
        isArmor: () => false,
      });

      // Assert: a matching id across the wrong table would otherwise count a potion as a sword.
      expect(isTarget)
        .toBe(false);
    });

    it('rejects an item when the objective wants armor', () =>
    {
      // Arrange
      const fetch = Object.assign(new FetchData(), {
        type: 2,
        id: 9,
        amount: 4,
      });
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData(undefined, undefined, fetch));

      // Act
      const isTarget = tracked.isFetchTarget({
        id: 9,
        isItem: () => true,
        isWeapon: () => false,
        isArmor: () => false,
      });

      // Assert
      expect(isTarget)
        .toBe(false);
    });
  });

  describe('hasFetchedEnoughItems()', () =>
  {
    it('is never satisfied by an objective that is not a fetch at all', () =>
    {
      // Arrange
      const tracked = buildTracked(OmniObjective.Types.Slay, new OmniFulfillmentData());

      // Act
      const hasEnough = tracked.hasFetchedEnoughItems();

      // Assert
      expect(hasEnough)
        .toBe(false);
    });
  });

  describe('hasSlainEnoughEnemies()', () =>
  {
    it('is never satisfied by an objective that is not a slay at all', () =>
    {
      // Arrange
      const tracked = buildTracked(OmniObjective.Types.Fetch, new OmniFulfillmentData());

      // Act
      const hasEnough = tracked.hasSlainEnoughEnemies();

      // Assert
      expect(hasEnough)
        .toBe(false);
    });
  });
  //endregion what counts toward the objective

  //region the rest of the finalization messages
  describe('handleObjectiveUpdateLog()', () =>
  {
    /**
     * Stands up the announcement path and hands back the builder it will run through.
     * @returns {object} The stubbed builder.
     */
    const installLogBuilder = () =>
    {
      const builder = {
        setLines: vi.fn()
          .mockReturnThis(),
        build: vi.fn(() => ({})),
      };

      globalThis.DiaLogBuilder = function()
      {
        return builder;
      };

      globalThis.J.LOG = {};
      globalThis.$diaLogManager = { addLog: vi.fn() };

      return builder;
    };

    it('says an objective failed when that is how it finalized', () =>
    {
      // Arrange
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Failed;
      const builder = installLogBuilder();

      // Act
      tracked.handleObjectiveUpdateLog();

      // Assert
      expect(builder.setLines)
        .toHaveBeenCalledWith([ '\\C[1][Quest Name]\\C[0] updated.', 'Objective failed.' ]);
    });

    it('says an objective was missed when that is how it finalized', () =>
    {
      // Arrange
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = OmniObjective.States.Missed;
      const builder = installLogBuilder();

      // Act
      tracked.handleObjectiveUpdateLog();

      // Assert
      expect(builder.setLines)
        .toHaveBeenCalledWith([ '\\C[1][Quest Name]\\C[0] updated.', 'Objective missed.' ]);
    });

    it('throws rather than announcing a finalization it has no sentence for', () =>
    {
      // Arrange: a state that reports as finalized but matches no case is a contradiction, and a
      // silent log line would hide it until somebody noticed the journal had gone quiet.
      const tracked = buildTracked(OmniObjective.Types.Indiscriminate, new OmniFulfillmentData());
      tracked.state = 999;
      tracked.isFinalized = () => true;
      installLogBuilder();

      // Act
      // Assert
      expect(() => tracked.handleObjectiveUpdateLog())
        .toThrow('Unknown finalization state for objective update message.');
    });
  });
  //endregion the rest of the finalization messages
});
//endregion plugins/omni/ext/quest/__models/_component/tracked-omni-objective.test.js
