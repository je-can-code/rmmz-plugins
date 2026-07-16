//region plugins/abs/core/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Map.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Map.prototype`), so this file direct-imports it against bare placeholder engine globals
 * rather than nesting a vm context. Every sibling model/manager it imports is mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention. Aliased-original hooks
 * are captured as `vi.fn()`s so tests can assert calls without reassigning the prototype after
 * import (reassignment would not affect the reference the Aliased map already captured).
 */
describe('J-ABS Game_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalSetup;
  let originalUpdate;
  let JABS_AiManagerMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Game_Map: new Map() } } };

    function Game_Map()
    {
    }
    originalSetup = vi.fn();
    originalUpdate = vi.fn();
    Game_Map.prototype.setup = originalSetup;
    Game_Map.prototype.update = originalUpdate;
    globalThis.Game_Map = Game_Map;

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    JABS_AiManagerMock = {
      clearBattlers: vi.fn(),
      addOrUpdateBattlers: vi.fn(),
      convertEventsToBattlers: vi.fn(() => []),
      getBattlerByUuid: vi.fn(),
      removeBattler: vi.fn(),
      convertEventToBattler: vi.fn(),
      addOrUpdateBattler: vi.fn(),
    };
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: JABS_AiManagerMock }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    originalSetup.mockClear();
    originalUpdate.mockClear();
    Object.values(JABS_AiManagerMock).forEach(fn => fn.mockClear());
    JABS_AiManagerMock.convertEventsToBattlers.mockReturnValue([]);
    globalThis.$jabsEngine = {
      absEnabled: true,
      initialize: vi.fn(),
      refreshPlayer1Data: vi.fn(),
      update: vi.fn(),
      event: vi.fn(),
      clearActionEvents: vi.fn(),
    };
    globalThis.$dataMap = { events: [] };
    globalThis.$gameMap = {
      roundXWithDirection: (x) => x,
      roundYWithDirection: (y) => y,
      isCounter: () => false,
      eventsXy: vi.fn(() => []),
    };
  });

  /**
   * Builds a real Game_Map-prototype-backed instance with sane, overridable defaults.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object} A stubbed Game_Map instance.
   */
  function buildMap(overrides = {})
  {
    const map = Object.create(globalThis.Game_Map.prototype);
    Object.assign(map, {
      _events: [],
      events: () => [],
      eventsXy: () => [],
      ...overrides,
    });
    return map;
  }

  describe('setup()/initJabsEngine()', () =>
  {
    it('performs original logic then initializes jabs when enabled', () =>
    {
      const map = buildMap();
      const initSpy = vi.spyOn(map, 'initJabsEngine');

      map.setup(1);

      expect(originalSetup).toHaveBeenCalledWith(1);
      expect(initSpy).toHaveBeenCalled();
    });

    it('does nothing further when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const map = buildMap();

      map.initJabsEngine();

      expect(globalThis.$jabsEngine.initialize).not.toHaveBeenCalled();
    });

    it('initializes the battle map and refreshes all battlers when enabled', () =>
    {
      const map = buildMap();
      const refreshSpy = vi.spyOn(map, 'refreshAllBattlers').mockImplementation(() => {});

      map.initJabsEngine();

      expect(globalThis.$jabsEngine.initialize).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('refreshAllBattlers()/parseBattlers()', () =>
  {
    it('clears, parses, and re-tracks battlers, then refreshes the player', () =>
    {
      const parsedBattlers = [ { tag: 'battler' } ];
      JABS_AiManagerMock.convertEventsToBattlers.mockReturnValue(parsedBattlers);
      const events = [ { tag: 'event' } ];
      const map = buildMap({ events: () => events });

      map.refreshAllBattlers();

      expect(JABS_AiManagerMock.clearBattlers).toHaveBeenCalled();
      expect(JABS_AiManagerMock.convertEventsToBattlers).toHaveBeenCalledWith(events);
      expect(JABS_AiManagerMock.addOrUpdateBattlers).toHaveBeenCalledWith(parsedBattlers);
      expect(globalThis.$jabsEngine.refreshPlayer1Data).toHaveBeenCalled();
    });
  });

  describe('refreshOneBattler()', () =>
  {
    it('removes an existing tracked battler before converting', () =>
    {
      const currentBattler = { tag: 'current' };
      JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(currentBattler);
      const event = { getJabsBattlerUuid: () => 'uuid', isErased: () => false };
      const map = buildMap();

      map.refreshOneBattler(event);

      expect(JABS_AiManagerMock.removeBattler).toHaveBeenCalledWith(currentBattler);
    });

    it('does not remove when there is no currently-tracked battler', () =>
    {
      JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(undefined);
      const event = { getJabsBattlerUuid: () => 'uuid', isErased: () => false };
      const map = buildMap();

      map.refreshOneBattler(event);

      expect(JABS_AiManagerMock.removeBattler).not.toHaveBeenCalled();
    });

    it('adds the newly converted battler when the event is not erased', () =>
    {
      const newBattler = { tag: 'new' };
      JABS_AiManagerMock.convertEventToBattler.mockReturnValue(newBattler);
      const event = { getJabsBattlerUuid: () => 'uuid', isErased: () => false };
      const map = buildMap();

      map.refreshOneBattler(event);

      expect(JABS_AiManagerMock.addOrUpdateBattler).toHaveBeenCalledWith(newBattler);
    });

    it('does not add a battler for an erased event', () =>
    {
      JABS_AiManagerMock.convertEventToBattler.mockReturnValue({ tag: 'new' });
      const event = { getJabsBattlerUuid: () => 'uuid', isErased: () => true };
      const map = buildMap();

      map.refreshOneBattler(event);

      expect(JABS_AiManagerMock.addOrUpdateBattler).not.toHaveBeenCalled();
    });

    it('does not add when conversion produced no battler', () =>
    {
      JABS_AiManagerMock.convertEventToBattler.mockReturnValue(null);
      const event = { getJabsBattlerUuid: () => 'uuid', isErased: () => false };
      const map = buildMap();

      map.refreshOneBattler(event);

      expect(JABS_AiManagerMock.addOrUpdateBattler).not.toHaveBeenCalled();
    });
  });

  describe('update()/updateJabs()', () =>
  {
    it('performs original logic then updates jabs', () =>
    {
      const map = buildMap();

      map.update(true);

      expect(originalUpdate).toHaveBeenCalledWith(true);
      expect(globalThis.$jabsEngine.update).toHaveBeenCalled();
    });
  });

  describe('newActionEvents()/expiredActionEvents()/actionEvents()', () =>
  {
    it('filters to only action events', () =>
    {
      const actionEvent = { isJabsAction: () => true };
      const normalEvent = { isJabsAction: () => false };
      const map = buildMap({ events: () => [ actionEvent, normalEvent ] });

      expect(map.actionEvents()).toEqual([ actionEvent ]);
    });

    it('filters action events needing sprite addition', () =>
    {
      const needsAdding = { isJabsAction: () => true, getActionSpriteNeedsAdding: () => true };
      const doesNotNeedAdding = { isJabsAction: () => true, getActionSpriteNeedsAdding: () => false };
      const map = buildMap({ events: () => [ needsAdding, doesNotNeedAdding ] });

      expect(map.newActionEvents()).toEqual([ needsAdding ]);
    });

    it('filters action events flagged for removal', () =>
    {
      const expired = { isJabsAction: () => true, getJabsActionNeedsRemoving: () => true };
      const active = { isJabsAction: () => true, getJabsActionNeedsRemoving: () => false };
      const map = buildMap({ events: () => [ expired, active ] });

      expect(map.expiredActionEvents()).toEqual([ expired ]);
    });
  });

  describe('actionEventsFromDataMapByUuid()', () =>
  {
    it('excludes metadata with no actionIndex', () =>
    {
      globalThis.$dataMap.events = [ null, { actionIndex: 0 } ];
      const map = buildMap();

      expect(map.actionEventsFromDataMapByUuid('uuid')).toEqual([]);
    });

    it('includes only metadata matching the resolved action index', () =>
    {
      globalThis.$jabsEngine.event.mockReturnValue({ actionIndex: 2 });
      const matching = { actionIndex: 2 };
      const nonMatching = { actionIndex: 3 };
      globalThis.$dataMap.events = [ matching, nonMatching ];
      const map = buildMap();

      expect(map.actionEventsFromDataMapByUuid('uuid')).toEqual([ matching ]);
    });
  });

  describe('newLootEvents()/expiredLootEvents()/lootEvents()', () =>
  {
    it('filters to only loot events', () =>
    {
      const lootEvent = { isJabsLoot: () => true };
      const normalEvent = { isJabsLoot: () => false };
      const map = buildMap({ events: () => [ lootEvent, normalEvent ] });

      expect(map.lootEvents()).toEqual([ lootEvent ]);
    });

    it('filters loot events needing sprite addition', () =>
    {
      const needsAdding = { isJabsLoot: () => true, getLootNeedsAdding: () => true };
      const doesNotNeedAdding = { isJabsLoot: () => true, getLootNeedsAdding: () => false };
      const map = buildMap({ events: () => [ needsAdding, doesNotNeedAdding ] });

      expect(map.newLootEvents()).toEqual([ needsAdding ]);
    });

    it('filters loot events flagged for removal', () =>
    {
      const expired = { isJabsLoot: () => true, getLootNeedsRemoving: () => true };
      const active = { isJabsLoot: () => true, getLootNeedsRemoving: () => false };
      const map = buildMap({ events: () => [ expired, active ] });

      expect(map.expiredLootEvents()).toEqual([ expired ]);
    });
  });

  describe('lootEventsFromDataMapByUuid()', () =>
  {
    it('excludes metadata with no uuid', () =>
    {
      globalThis.$dataMap.events = [ null, {} ];
      const map = buildMap();

      expect(map.lootEventsFromDataMapByUuid('uuid')).toEqual([]);
    });

    it('includes only metadata matching the given uuid', () =>
    {
      const matching = { uuid: 'match' };
      const nonMatching = { uuid: 'other' };
      globalThis.$dataMap.events = [ matching, nonMatching ];
      const map = buildMap();

      expect(map.lootEventsFromDataMapByUuid('match')).toEqual([ matching ]);
    });
  });

  describe('clearLeaderDataByUuid()', () =>
  {
    it('does nothing when no battler is found', () =>
    {
      JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(undefined);
      const map = buildMap();

      expect(() => map.clearLeaderDataByUuid('uuid')).not.toThrow();
    });

    it('clears leader data when the battler is found', () =>
    {
      const battler = { clearLeaderData: vi.fn() };
      JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(battler);
      const map = buildMap();

      map.clearLeaderDataByUuid('uuid');

      expect(battler.clearLeaderData).toHaveBeenCalled();
    });
  });

  describe('getJabsLootDrops()', () =>
  {
    it('returns all loot events on the map', () =>
    {
      const lootEvent = { isJabsLoot: () => true };
      const map = buildMap({ events: () => [ lootEvent, { isJabsLoot: () => false } ] });

      expect(map.getJabsLootDrops()).toEqual([ lootEvent ]);
    });
  });

  describe('newBattlerEvents()', () =>
  {
    it('excludes loot events', () =>
    {
      const event = { isJabsLoot: () => true, isJabsAction: () => false, doesBattlerNeedAdding: () => true };
      const map = buildMap({ events: () => [ event ] });

      expect(map.newBattlerEvents()).toEqual([]);
    });

    it('excludes action events', () =>
    {
      const event = { isJabsLoot: () => false, isJabsAction: () => true, doesBattlerNeedAdding: () => true };
      const map = buildMap({ events: () => [ event ] });

      expect(map.newBattlerEvents()).toEqual([]);
    });

    it('includes battler events flagged as needing addition', () =>
    {
      const event = { isJabsLoot: () => false, isJabsAction: () => false, doesBattlerNeedAdding: () => true };
      const map = buildMap({ events: () => [ event ] });

      expect(map.newBattlerEvents()).toEqual([ event ]);
    });

    it('excludes battler events not flagged as needing addition', () =>
    {
      const event = { isJabsLoot: () => false, isJabsAction: () => false, doesBattlerNeedAdding: () => false };
      const map = buildMap({ events: () => [ event ] });

      expect(map.newBattlerEvents()).toEqual([]);
    });
  });

  describe('addEvent()', () =>
  {
    it('reuses the first empty hole in the event list', () =>
    {
      const existing = { tag: 'existing' };
      const newEvent = { tag: 'new' };
      const map = buildMap({ _events: [ existing, null, existing ] });

      map.addEvent(newEvent);

      expect(map._events).toEqual([ existing, newEvent, existing ]);
    });

    it('appends to the end when there are no holes', () =>
    {
      const existing = { tag: 'existing' };
      const newEvent = { tag: 'new' };
      const map = buildMap({ _events: [ existing ] });

      map.addEvent(newEvent);

      expect(map._events).toEqual([ existing, newEvent ]);
    });
  });

  describe('removeEvent()', () =>
  {
    it('does nothing when the event is not tracked', () =>
    {
      const map = buildMap({ _events: [ {} ] });

      expect(() => map.removeEvent({})).not.toThrow();
    });

    it('nulls the slot and runs action/loot cleanup for a tracked event', () =>
    {
      const eventToRemove = { isJabsAction: () => false, isJabsLoot: () => false };
      const map = buildMap({ _events: [ eventToRemove ] });
      const actionSpy = vi.spyOn(map, 'handleActionEventRemoval');
      const lootSpy = vi.spyOn(map, 'handleLootEventRemoval');

      map.removeEvent(eventToRemove);

      expect(actionSpy).toHaveBeenCalledWith(eventToRemove);
      expect(lootSpy).toHaveBeenCalledWith(eventToRemove);
      expect(map._events).toEqual([ null ]);
    });
  });

  describe('handleActionEventRemoval()', () =>
  {
    it('does nothing for a non-action event', () =>
    {
      const event = { isJabsAction: () => false };
      const map = buildMap();

      map.handleActionEventRemoval(event);

      expect(globalThis.$jabsEngine.clearActionEvents).not.toHaveBeenCalled();
    });

    it('erases the event and clears the tracked action event metadata', () =>
    {
      const metadata = { actionIndex: 1 };
      globalThis.$dataMap.events = [ null, metadata ];
      globalThis.$jabsEngine.event.mockReturnValue(metadata);
      const event = { isJabsAction: () => true, getJabsActionUuid: () => 'uuid', erase: vi.fn() };
      const map = buildMap();

      map.handleActionEventRemoval(event);

      expect(event.erase).toHaveBeenCalled();
      expect(globalThis.$jabsEngine.clearActionEvents).toHaveBeenCalled();
      expect(globalThis.$dataMap.events[1]).toBeNull();
    });
  });

  describe('handleLootEventRemoval()', () =>
  {
    it('does nothing for a non-loot event', () =>
    {
      const event = { isJabsLoot: () => false };
      const map = buildMap();

      expect(() => map.handleLootEventRemoval(event)).not.toThrow();
    });

    it('nulls the matching loot metadata slot', () =>
    {
      const metadata = { uuid: 'loot-uuid', lootIndex: 2 };
      globalThis.$dataMap.events = [ null, null, metadata ];
      const event = { isJabsLoot: () => true, getJabsLoot: () => ({ uuid: 'loot-uuid' }) };
      const map = buildMap();

      map.handleLootEventRemoval(event);

      expect(globalThis.$dataMap.events[2]).toBeNull();
    });
  });

  describe('clearExpiredJabsActionEvents()/clearExpiredJabsActionEvent()', () =>
  {
    it('removes every expired action event', () =>
    {
      const expired = { isJabsAction: () => true, getJabsActionNeedsRemoving: () => true };
      const map = buildMap({ events: () => [ expired ] });
      const removeSpy = vi.spyOn(map, 'removeEvent').mockImplementation(() => {});

      map.clearExpiredJabsActionEvents();

      expect(removeSpy).toHaveBeenCalledWith(expired);
    });
  });

  describe('clearExpiredLootEvents()/clearExpiredLootEvent()', () =>
  {
    it('removes every expired loot event', () =>
    {
      const expired = { isJabsLoot: () => true, getLootNeedsRemoving: () => true };
      const map = buildMap({ events: () => [ expired ] });
      const removeSpy = vi.spyOn(map, 'removeEvent').mockImplementation(() => {});

      map.clearExpiredLootEvents();

      expect(removeSpy).toHaveBeenCalledWith(expired);
    });
  });

  describe('hasInteractableEventInFront()', () =>
  {
    /**
     * Builds a fake jabs battler test double positioned/facing as given.
     * @param {number} x The x coordinate.
     * @param {number} y The y coordinate.
     * @param {number} direction The facing direction.
     * @returns {object} A fake jabs battler.
     */
    function buildJabsBattler(x, y, direction)
    {
      return { getCharacter: () => ({ x, y, direction: () => direction }) };
    }

    it('returns false when an enemy battler event is directly in front', () =>
    {
      const map = buildMap({
        eventsXy: () => [ { isJabsBattler: () => true } ],
      });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(false);
    });

    it('returns true when a normal-priority, triggerable event is directly in front', () =>
    {
      const map = buildMap({
        eventsXy: () => [ { isJabsBattler: () => false, isTriggerIn: () => true, isNormalPriority: () => true } ],
      });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(true);
    });

    it('returns false when the event in front is not interactable', () =>
    {
      const map = buildMap({
        eventsXy: () => [ { isJabsBattler: () => false, isTriggerIn: () => false, isNormalPriority: () => true } ],
      });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(false);
    });

    it('checks one tile further when standing on a counter', () =>
    {
      globalThis.$gameMap.isCounter = () => true;
      globalThis.$gameMap.eventsXy = vi.fn(() => [
        { isJabsBattler: () => false, isTriggerIn: () => true, isNormalPriority: () => true },
      ]);
      const map = buildMap({ eventsXy: () => [] });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(true);
    });

    it('returns false when an enemy is found beyond the counter', () =>
    {
      globalThis.$gameMap.isCounter = () => true;
      globalThis.$gameMap.eventsXy = vi.fn(() => [ { isJabsBattler: () => true } ]);
      const map = buildMap({ eventsXy: () => [] });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(false);
    });

    it('returns false when nothing interactable is found anywhere', () =>
    {
      const map = buildMap({ eventsXy: () => [] });

      expect(map.hasInteractableEventInFront(buildJabsBattler(0, 0, 2))).toEqual(false);
    });
  });
});
//endregion plugins/abs/core/objects/game-map.test.js
