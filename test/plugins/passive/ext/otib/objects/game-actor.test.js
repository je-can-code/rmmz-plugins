//region plugins/passive/ext/otib/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor ext/otib augments (direct src import)', () =>
{
  let Game_Actor;
  let FakeOtibUnlockRecord;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeOtibUnlockRecord = vi.fn(function(itemId, stateIds)
    {
      this.itemId = itemId;
      this.stateIds = stateIds;
    });
    vi.doMock('../../../../../../src/plugins/passive/ext/otib/_models/OtibUnlockRecord.js', () => ({ default: FakeOtibUnlockRecord }));

    globalThis.J = { PASSIVE: { EXT: { OTIB: { Aliased: { Game_Actor: new Map() } } } } };

    function StubGameActor()
    {
    }

    StubGameActor.prototype.initMembers = vi.fn();
    StubGameActor.prototype.getPassiveStateSources = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../../src/plugins/passive/ext/otib/objects/Game_Actor.js');
    ({ Game_Actor } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    delete globalThis.J.LOG;
    delete globalThis.$mapLogs;
    delete globalThis.DiaLogBuilder;
  });

  describe('initMembers/initOtibMembers/otibUnlocks', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.initMembers();

      // Assert
      expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('initMembers')).toHaveBeenCalled();
    });

    it('seeds an empty unlocks list', () =>
    {
      // Arrange
      const actor = new Game_Actor();

      // Act
      actor.initMembers();

      // Assert
      expect(actor.otibUnlocks()).toEqual([]);
    });
  });

  describe('addOtibUnlock/otibUnlocks', () =>
  {
    it('appends the record to the unlocks list', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      const record = new FakeOtibUnlockRecord(1, [ 5 ]);

      // Act
      actor.addOtibUnlock(record);

      // Assert
      expect(actor.otibUnlocks()).toEqual([ record ]);
    });
  });

  describe('otibPassiveStateIds', () =>
  {
    it('flattens state ids across every unlock record', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.addOtibUnlock(new FakeOtibUnlockRecord(1, [ 5, 6 ]));
      actor.addOtibUnlock(new FakeOtibUnlockRecord(2, [ 7 ]));

      // Act
      const result = actor.otibPassiveStateIds();

      // Assert
      expect(result).toEqual([ 5, 6, 7 ]);
    });

    it('returns an empty array when there are no unlocks', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();

      // Act
      const result = actor.otibPassiveStateIds();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isOtibUnlocked', () =>
  {
    it('is true when an unlock record exists for the item id', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.addOtibUnlock(new FakeOtibUnlockRecord(3, [ 5 ]));

      // Act
      const result = actor.isOtibUnlocked(3);

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when no unlock record exists for the item id', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();

      // Act
      const result = actor.isOtibUnlocked(3);

      // Assert
      expect(result).toEqual(false);
    });

    it('is false when the only unlock on file belongs to a different item', () =>
    {
      // Arrange: the case above searches an empty list, where the answer is false whatever the
      // match rule says - so the rule itself was never read. An unlock for a neighbouring item is
      // what separates "this item is unlocked" from "anything at all is unlocked", and getting
      // that wrong would hand the player every one-time bonus off the back of a single unrelated
      // consumable.
      const actor = new Game_Actor();
      actor.initMembers();
      actor.addOtibUnlock(new FakeOtibUnlockRecord(7, [ 5 ]));

      // Act
      const result = actor.isOtibUnlocked(3);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('handleOtibUnlock', () =>
  {
    it('does nothing when the item has no OTIB state ids', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();
      const item = { id: 1, otibStateIds: [] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.otibUnlocks()).toEqual([]);
      expect(actor.refreshPassiveStates).not.toHaveBeenCalled();
    });

    it('does nothing when the item was already unlocked', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.addOtibUnlock(new FakeOtibUnlockRecord(1, [ 5 ]));
      actor.refreshPassiveStates = vi.fn();
      const item = { id: 1, otibStateIds: [ 5 ] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.otibUnlocks()).toHaveLength(1);
      expect(actor.refreshPassiveStates).not.toHaveBeenCalled();
    });

    it('persists a new unlock record and refreshes passive states', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();
      const item = { id: 1, otibStateIds: [ 5, 6 ] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.otibUnlocks()).toHaveLength(1);
      expect(actor.otibUnlocks()[0].itemId).toEqual(1);
      expect(actor.otibUnlocks()[0].stateIds).toEqual([ 5, 6 ]);
      expect(actor.refreshPassiveStates).toHaveBeenCalled();
    });

    it('does not notify when J.LOG is not present', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();
      actor.notifyOtibUnlock = vi.fn();
      globalThis.J.LOG = false;
      const item = { id: 1, otibStateIds: [ 5 ] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.notifyOtibUnlock).not.toHaveBeenCalled();
    });

    it('does not notify when $mapLogs is not present even if J.LOG is', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();
      actor.notifyOtibUnlock = vi.fn();
      globalThis.J.LOG = true;
      globalThis.$mapLogs = undefined;
      const item = { id: 1, otibStateIds: [ 5 ] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.notifyOtibUnlock).not.toHaveBeenCalled();
    });

    it('notifies of the unlock when both J.LOG and $mapLogs are present', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();
      actor.notifyOtibUnlock = vi.fn();
      globalThis.J.LOG = true;
      globalThis.$mapLogs = {};
      const item = { id: 1, otibStateIds: [ 5 ] };

      // Act
      actor.handleOtibUnlock(item);

      // Assert
      expect(actor.notifyOtibUnlock).toHaveBeenCalledWith(item, [ 5 ]);
    });
  });

  describe('notifyOtibUnlock', () =>
  {
    it('adds one DiaLog entry per unlocked state id', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      const addLog = vi.fn();
      globalThis.$mapLogs = { dialog: { addLog } };
      const builtLogs = [ 'log-a', 'log-b' ];
      let callIndex = 0;
      globalThis.DiaLogBuilder = vi.fn(function()
      {
        this.addLine = vi.fn().mockReturnThis();
        this.build = vi.fn(() => builtLogs[callIndex++]);
      });
      const item = { id: 1 };

      // Act
      actor.notifyOtibUnlock(item, [ 5, 6 ]);

      // Assert
      expect(addLog).toHaveBeenCalledTimes(2);
      expect(addLog).toHaveBeenCalledWith('log-a');
      expect(addLog).toHaveBeenCalledWith('log-b');
    });
  });

  describe('getPassiveStateSources/buildOtibPassiveSources', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('getPassiveStateSources').mockReturnValue([]);

      // Act
      actor.getPassiveStateSources();

      // Assert
      expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('getPassiveStateSources')).toHaveBeenCalled();
    });

    it('appends one synthetic source per OTIB unlock onto the base sources', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();
      actor.addOtibUnlock(new FakeOtibUnlockRecord(1, [ 5 ]));
      const baseSource = {};
      globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.get('getPassiveStateSources').mockReturnValue([ baseSource ]);
      const syntheticSource = {};
      actor.buildSourceFromStateIds = vi.fn().mockReturnValue(syntheticSource);

      // Act
      const result = actor.getPassiveStateSources();

      // Assert
      expect(actor.buildSourceFromStateIds).toHaveBeenCalledWith([ 5 ]);
      expect(result).toEqual([ baseSource, syntheticSource ]);
    });

    it('returns an empty synthetic list when there are no unlocks', () =>
    {
      // Arrange
      const actor = new Game_Actor();
      actor.initMembers();

      // Act
      const result = actor.buildOtibPassiveSources();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
//endregion plugins/passive/ext/otib/objects/game-actor.test.js
