//region plugins/sdp/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// stand in for the real PanelRanking so this stays a unit test of Game_Actor alone- the real class
// reaches into SdpMasteryManager and the panels map on rankUp, which is a different file's problem.
vi.mock('../../../../../src/plugins/sdp/core/models/PanelRanking.js', () => ({
  default: class PanelRankingStub
  {
    constructor(key, actorId)
    {
      this.key = key;
      this.actorId = actorId;
      this.currentRank = 0;
      this._isUnlocked = false;
    }

    isUnlocked()
    {
      return this._isUnlocked;
    }

    unlock()
    {
      this._isUnlocked = true;
    }

    lock()
    {
      this._isUnlocked = false;
    }

    rankUp()
    {
      this.currentRank += 1;
    }

    isPanelMaxed()
    {
      return this.maxed === true;
    }
  },
}));

describe('Game_Actor ext/sdp augments (direct src import)', () =>
{
  // the plugin overwrites the prototype methods it aliases, so the original stubs are only reachable
  // through these captured handles- reading Game_Actor.prototype.param after import yields the
  // augmented function, not the mock.
  let baseInitMembers;
  let baseParam;
  let baseXparam;
  let baseSparam;
  let baseMaxTp;

  /**
   * Builds a panel ranking shaped like the real one, for direct injection into an actor's rank list.
   * Bypasses getOrCreateSdpRankByKey so each test controls rank and unlock state precisely.
   */
  const makeRanking = (key, overrides = {}) => ({
    key,
    currentRank: 0,
    _isUnlocked: false,
    maxed: false,
    isUnlocked()
    {
      return this._isUnlocked;
    },
    unlock()
    {
      this._isUnlocked = true;
    },
    lock()
    {
      this._isUnlocked = false;
    },
    rankUp()
    {
      this.currentRank += 1;
    },
    isPanelMaxed()
    {
      return this.maxed;
    },
    ...overrides,
  });

  /**
   * Builds a panel stub exposing only the two methods Game_Actor asks of a panel.
   * @param {Object} parametersByKey Map of parameter key to the panel parameters it yields.
   * @param {number} bonusByRank The flat value calculateBonusByRank should report.
   */
  const makePanel = (parametersByKey = {}, bonusByRank = 0) => ({
    getPanelParameterByKey: vi.fn(key => parametersByKey[key] ?? []),
    calculateBonusByRank: vi.fn(() => bonusByRank),
  });

  /**
   * Produces a fully initialized actor with the SDP members bootstrapped.
   */
  const makeActor = () =>
  {
    const actor = new globalThis.Game_Actor();
    actor.initMembers();
    return actor;
  };

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = {
      SDP: {
        Aliased: { Game_Actor: new Map() },
        Metadata: {
          panelsMap: new Map(),
          panelStatFloorMhp: 1,
          panelStatFloorDefault: 0,
        },
        RegExp: { SdpBonusFormula: /sdpBonusFormula/gi },
      },
    };

    globalThis.RPGManager = {
      getResultsFromAllNotesByRegex: vi.fn(() => 0),
      getSumFromAllNotesByRegex: vi.fn(() => 0),
    };

    globalThis.ParameterKeys = {
      legacyLongParamKey: vi.fn(paramId => `legacy-${paramId}`),
      bparamKey: vi.fn(paramId => `bparam-${paramId}`),
      xparamKey: vi.fn(paramId => `xparam-${paramId}`),
      sparamKey: vi.fn(paramId => `sparam-${paramId}`),
    };

    function StubGameActor()
    {
    }

    // the aliasing at import time captures whatever lives on the prototype, so every method the
    // plugin aliases must exist beforehand or the Map stores undefined and the extension explodes.
    baseInitMembers = vi.fn();
    baseParam = vi.fn(() => 0);
    baseXparam = vi.fn(() => 0);
    baseSparam = vi.fn(() => 0);
    baseMaxTp = vi.fn(() => 0);
    StubGameActor.prototype.initMembers = baseInitMembers;
    StubGameActor.prototype.param = baseParam;
    StubGameActor.prototype.xparam = baseXparam;
    StubGameActor.prototype.sparam = baseSparam;
    StubGameActor.prototype.maxTp = baseMaxTp;
    StubGameActor.prototype.actorId = vi.fn(() => 1);
    StubGameActor.prototype.getAllNotes = vi.fn(() => []);
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../src/plugins/sdp/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    // a shared panels map across tests would leak panel stubs between cases; clear it every time.
    J.SDP.Metadata.panelsMap.clear();
    J.SDP.Metadata.panelStatFloorMhp = 1;
    J.SDP.Metadata.panelStatFloorDefault = 0;
    RPGManager.getResultsFromAllNotesByRegex.mockReturnValue(0);
    RPGManager.getSumFromAllNotesByRegex.mockReturnValue(0);
    baseParam.mockReturnValue(0);
    baseXparam.mockReturnValue(0);
    baseSparam.mockReturnValue(0);
    baseMaxTp.mockReturnValue(0);
  });

  describe('initMembers', () =>
  {
    it('executes the original logic it aliased', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      baseInitMembers.mockClear();

      // Act
      actor.initMembers();

      // Assert
      expect(J.SDP.Aliased.Game_Actor.get('initMembers')).toHaveBeenCalledTimes(1);
    });

    it('seeds the sdp members with their starting values', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act
      actor.initMembers();

      // Assert
      expect(actor._j._sdp._pointsEverGained).toEqual(0);
      expect(actor._j._sdp._pointsSpent).toEqual(0);
      expect(actor._j._sdp._points).toEqual(0);
      expect(actor._j._sdp._ranks).toEqual([]);
    });

    it('preserves a pre-existing _j container rather than replacing it', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor._j = { somethingElse: 'kept' };

      // Act
      actor.initMembers();

      // Assert
      expect(actor._j.somethingElse).toEqual('kept');
    });

    it('preserves a pre-existing _sdp container rather than replacing it', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor._j = { _sdp: { customField: 'kept' } };

      // Act
      actor.initMembers();

      // Assert
      expect(actor._j._sdp.customField).toEqual('kept');
    });
  });

  describe('getOrCreateSdpRankByKey', () =>
  {
    it('returns the existing ranking when one already matches the key', () =>
    {
      // Arrange
      const actor = makeActor();
      const existing = makeRanking('alpha');
      actor._j._sdp._ranks.push(existing);

      // Act
      const result = actor.getOrCreateSdpRankByKey('alpha');

      // Assert
      expect(result).toBe(existing);
      expect(actor._j._sdp._ranks).toHaveLength(1);
    });

    it('creates and stores a new ranking when the key is unknown', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getOrCreateSdpRankByKey('beta');

      // Assert
      expect(result.key).toEqual('beta');
      expect(result.actorId).toEqual(1);
      expect(actor._j._sdp._ranks).toEqual([ result ]);
    });
  });

  describe('getSdpByKey', () =>
  {
    it('delegates to the get-or-create path', () =>
    {
      // Arrange
      const actor = makeActor();
      const existing = makeRanking('gamma');
      actor._j._sdp._ranks.push(existing);

      // Act
      const result = actor.getSdpByKey('gamma');

      // Assert
      expect(result).toBe(existing);
    });
  });

  describe('getAllSdpRankings', () =>
  {
    it('returns the backing rankings collection', () =>
    {
      // Arrange
      const actor = makeActor();
      const ranking = makeRanking('delta');
      actor._j._sdp._ranks.push(ranking);

      // Act
      const result = actor.getAllSdpRankings();

      // Assert
      expect(result).toEqual([ ranking ]);
    });
  });

  describe('getTotalSdpRanks', () =>
  {
    it('returns 0 when the actor has no rankings', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getTotalSdpRanks();

      // Assert
      expect(result).toEqual(0);
    });

    it('sums the current rank across every ranking', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }), makeRanking('b', { currentRank: 4 }));

      // Act
      const result = actor.getTotalSdpRanks();

      // Assert
      expect(result).toEqual(7);
    });
  });

  describe('getMasteryCount', () =>
  {
    it('counts only the rankings reporting themselves as maxed', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(
        makeRanking('a', { maxed: true }),
        makeRanking('b', { maxed: false }),
        makeRanking('c', { maxed: true }));

      // Act
      const result = actor.getMasteryCount();

      // Assert
      expect(result).toEqual(2);
    });
  });

  describe('getAllUnlockedSdps', () =>
  {
    it('returns only the rankings that are unlocked', () =>
    {
      // Arrange
      const actor = makeActor();
      const unlocked = makeRanking('a', { _isUnlocked: true });
      actor._j._sdp._ranks.push(unlocked, makeRanking('b'));

      // Act
      const result = actor.getAllUnlockedSdps();

      // Assert
      expect(result).toEqual([ unlocked ]);
    });
  });

  describe('unlockSdpByKey', () =>
  {
    it('flags the matching ranking as unlocked', () =>
    {
      // Arrange
      const actor = makeActor();
      const ranking = makeRanking('a');
      actor._j._sdp._ranks.push(ranking);

      // Act
      actor.unlockSdpByKey('a');

      // Assert
      expect(ranking.isUnlocked()).toBe(true);
    });
  });

  describe('isSdpUnlocked', () =>
  {
    it('reports the unlock state of the matching ranking', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a', { _isUnlocked: true }));

      // Act
      const result = actor.isSdpUnlocked('a');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('hasAnyUnlockedSdps', () =>
  {
    it('returns true when at least one ranking is unlocked', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a', { _isUnlocked: true }));

      // Act
      const result = actor.hasAnyUnlockedSdps();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when no rankings are unlocked', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a'));

      // Act
      const result = actor.hasAnyUnlockedSdps();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('lockSdpByKey', () =>
  {
    it('clears the unlock flag on the matching ranking', () =>
    {
      // Arrange
      const actor = makeActor();
      const ranking = makeRanking('a', { _isUnlocked: true });
      actor._j._sdp._ranks.push(ranking);

      // Act
      actor.lockSdpByKey('a');

      // Assert
      expect(ranking.isUnlocked()).toBe(false);
    });
  });

  describe('getAccumulatedTotalSdpPoints', () =>
  {
    it('returns the running accumulative total', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._pointsEverGained = 42;

      // Act
      const result = actor.getAccumulatedTotalSdpPoints();

      // Assert
      expect(result).toEqual(42);
    });
  });

  describe('modAccumulatedTotalSdpPoints', () =>
  {
    it('adds the points when the amount is positive', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      actor.modAccumulatedTotalSdpPoints(25);

      // Assert
      expect(actor._j._sdp._pointsEverGained).toEqual(25);
    });

    it('ignores the amount when it is not positive, as the total never decreases', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._pointsEverGained = 10;

      // Act
      actor.modAccumulatedTotalSdpPoints(-5);

      // Assert
      expect(actor._j._sdp._pointsEverGained).toEqual(10);
    });
  });

  describe('getAccumulatedSpentSdpPoints', () =>
  {
    it('returns the running spent total', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._pointsSpent = 17;

      // Act
      const result = actor.getAccumulatedSpentSdpPoints();

      // Assert
      expect(result).toEqual(17);
    });
  });

  describe('modAccumulatedSpentSdpPoints', () =>
  {
    it('adds the given points to the spent total', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._pointsSpent = 5;

      // Act
      actor.modAccumulatedSpentSdpPoints(8);

      // Assert
      expect(actor._j._sdp._pointsSpent).toEqual(13);
    });

    it('permits a reduction, which is how refunds are applied', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._pointsSpent = 20;

      // Act
      actor.modAccumulatedSpentSdpPoints(-6);

      // Assert
      expect(actor._j._sdp._pointsSpent).toEqual(14);
    });
  });

  describe('getSdpPoints', () =>
  {
    it('returns the actor current point balance', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._points = 99;

      // Act
      const result = actor.getSdpPoints();

      // Assert
      expect(result).toEqual(99);
    });
  });

  describe('modSdpPoints', () =>
  {
    it('applies the sdp multiplier to a positive gain', () =>
    {
      // Arrange
      const actor = makeActor();
      // 50 percent-points of SDR turns the base 100 into a 1.5x factor.
      RPGManager.getSumFromAllNotesByRegex.mockReturnValue(50);

      // Act
      const result = actor.modSdpPoints(10);

      // Assert
      expect(result).toEqual(15);
      expect(actor._j._sdp._points).toEqual(15);
    });

    it('layers a formula bonus on top of the multiplier when one is present', () =>
    {
      // Arrange
      const actor = makeActor();
      RPGManager.getResultsFromAllNotesByRegex.mockReturnValue(0.5);

      // Act
      const result = actor.modSdpPoints(10);

      // Assert
      expect(result).toEqual(15);
    });

    it('skips the formula layer entirely when no formula tags contributed', () =>
    {
      // Arrange
      const actor = makeActor();
      RPGManager.getResultsFromAllNotesByRegex.mockReturnValue(0);

      // Act
      const result = actor.modSdpPoints(10);

      // Assert
      expect(result).toEqual(10);
    });

    it('feeds a positive gain into the accumulative total', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      actor.modSdpPoints(10);

      // Assert
      expect(actor._j._sdp._pointsEverGained).toEqual(10);
    });

    it('subtracts without multiplying when the amount is negative', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._points = 30;
      RPGManager.getSumFromAllNotesByRegex.mockReturnValue(50);

      // Act
      const result = actor.modSdpPoints(-10);

      // Assert
      expect(result).toEqual(-10);
      expect(actor._j._sdp._points).toEqual(20);
      expect(actor._j._sdp._pointsEverGained).toEqual(0);
    });

    it('clamps the balance to zero when a reduction would take it negative', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._points = 5;

      // Act
      actor.modSdpPoints(-50);

      // Assert
      expect(actor._j._sdp._points).toEqual(0);
    });
  });

  describe('sdpMultiplier', () =>
  {
    it('returns a 1x factor when nothing contributes a bonus', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.sdpMultiplier;

      // Assert
      expect(result).toEqual(1);
    });

    it('folds note-sourced percent-points into the factor', () =>
    {
      // Arrange
      const actor = makeActor();
      RPGManager.getSumFromAllNotesByRegex.mockReturnValue(25);

      // Act
      const result = actor.sdpMultiplier;

      // Assert
      expect(result).toEqual(1.25);
    });

    it('folds sdr panel bonuses into the factor', () =>
    {
      // Arrange
      const actor = makeActor();
      const panel = makePanel({}, 75);
      J.SDP.Metadata.panelsMap.set('a', panel);
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.sdpMultiplier;

      // Assert
      expect(result).toEqual(1.75);
    });

    it('treats the panel bonus as zero when the lookup method is unavailable', () =>
    {
      // Arrange
      const actor = makeActor();
      // simulate the SDP panel-bonus accessor being absent, which the getter guards against.
      actor.getSdpBonusForParameterKey = undefined;

      // Act
      const result = actor.sdpMultiplier;

      // Assert
      expect(result).toEqual(1);
    });
  });

  describe('rankUpPanel', () =>
  {
    it('advances the rank of the matching panel', () =>
    {
      // Arrange
      const actor = makeActor();
      const ranking = makeRanking('a', { currentRank: 2 });
      actor._j._sdp._ranks.push(ranking);

      // Act
      actor.rankUpPanel('a');

      // Assert
      expect(ranking.currentRank).toEqual(3);
    });
  });

  describe('getSdpBonusForParameterKey', () =>
  {
    it('returns 0 when the SDP namespace is unavailable', () =>
    {
      // Arrange
      const actor = makeActor();
      const originalSdp = J.SDP;
      J.SDP = null;

      // Act
      const result = actor.getSdpBonusForParameterKey('cdm', 1);
      J.SDP = originalSdp;

      // Assert
      expect(result).toEqual(0);
    });

    it('returns 0 when no parameter key was supplied', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getSdpBonusForParameterKey(String.empty, 1);

      // Assert
      expect(result).toEqual(0);
    });

    it('returns 0 when the actor has no rankings at all', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getSdpBonusForParameterKey('cdm', 1);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips rankings whose panel is missing from the panels map', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('ghost', { currentRank: 3 }));

      // Act
      const result = actor.getSdpBonusForParameterKey('cdm', 1);

      // Assert
      expect(result).toEqual(0);
    });

    it('accumulates the bonus reported by every matching panel', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({}, 5));
      J.SDP.Metadata.panelsMap.set('b', makePanel({}, 7));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }), makeRanking('b', { currentRank: 2 }));

      // Act
      const result = actor.getSdpBonusForParameterKey('cdm', 1);

      // Assert
      expect(result).toEqual(12);
    });
  });

  describe('getSdpBonusForCustomParam', () =>
  {
    it('translates the legacy numeric id into a key before delegating', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({}, 3));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.getSdpBonusForCustomParam(12, 100);

      // Assert
      expect(ParameterKeys.legacyLongParamKey).toHaveBeenCalledWith(12);
      expect(result).toEqual(3);
    });
  });

  describe('getSdpBonusForCoreParam', () =>
  {
    it('returns 0 when the actor has no rankings', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getSdpBonusForCoreParam(0, 100);

      // Assert
      expect(result).toEqual(0);
    });

    it('returns 0 when the parameter id maps to no key', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a'));
      ParameterKeys.bparamKey.mockReturnValueOnce(String.empty);

      // Act
      const result = actor.getSdpBonusForCoreParam(99, 100);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips rankings whose panel is missing from the panels map', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('ghost', { currentRank: 2 }));

      // Act
      const result = actor.getSdpBonusForCoreParam(0, 100);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips panels that expose no parameters for the key', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({}));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.getSdpBonusForCoreParam(0, 100);

      // Assert
      expect(result).toEqual(0);
    });

    it('adds a flat parameter as rank times per-rank', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'bparam-0': [ { perRank: 5, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }));

      // Act
      const result = actor.getSdpBonusForCoreParam(0, 100);

      // Assert
      expect(result).toEqual(15);
    });

    it('adds a percent parameter as a floored percentage of the base', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'bparam-0': [ { perRank: 7, isFlat: false } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }));

      // Act
      const result = actor.getSdpBonusForCoreParam(0, 150);

      // Assert
      // 150 * (3 * 7) / 100 = 31.5, floored to 31.
      expect(result).toEqual(31);
    });
  });

  describe('getSdpBonusForNonCoreParam', () =>
  {
    it('resolves an xparam key when the id extra marks it as an ex-parameter', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'xparam-2': [ { perRank: 100, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(2, 0, 8);

      // Assert
      expect(ParameterKeys.xparamKey).toHaveBeenCalledWith(2);
      expect(result).toEqual(1);
    });

    it('resolves an sparam key for any other id extra', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'sparam-2': [ { perRank: 100, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(2, 0, 18);

      // Assert
      expect(ParameterKeys.sparamKey).toHaveBeenCalledWith(2);
      expect(result).toEqual(1);
    });

    it('returns 0 when the actor has no rankings', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 100, 18);

      // Assert
      expect(result).toEqual(0);
    });

    it('returns 0 when the parameter id maps to no key', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('a'));
      ParameterKeys.sparamKey.mockReturnValueOnce(String.empty);

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 100, 18);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips rankings whose panel is missing from the panels map', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('ghost', { currentRank: 2 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 100, 18);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips panels that expose no parameters for the key', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({}));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 100, 18);

      // Assert
      expect(result).toEqual(0);
    });

    it('adds a percent parameter as an unfloored percentage of the base', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'sparam-0': [ { perRank: 7, isFlat: false } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 150, 18);

      // Assert
      // non-core params keep their fraction- 150 * (3 * 7) / 100 = 31.5.
      expect(result).toEqual(31.5);
    });

    it('adds a flat parameter as rank times per-rank over one hundred', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'sparam-0': [ { perRank: 50, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 4 }));

      // Act
      const result = actor.getSdpBonusForNonCoreParam(0, 100, 18);

      // Assert
      // flat non-core growth is still expressed in percent-points- (4 * 50) / 100 = 2.
      expect(result).toEqual(2);
    });
  });

  describe('applySdpPanelStatFloor', () =>
  {
    it('returns the combined total when it meets the floor', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.applySdpPanelStatFloor(100, 25, 1);

      // Assert
      expect(result).toEqual(125);
    });

    it('returns the floor when the combined total falls beneath it', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.applySdpPanelStatFloor(10, -50, 1);

      // Assert
      expect(result).toEqual(1);
    });
  });

  describe('param', () =>
  {
    it('adds the core panel bonus onto the original parameter', () =>
    {
      // Arrange
      const actor = makeActor();
      baseParam.mockReturnValue(200);
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'bparam-2': [ { perRank: 10, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.param(2);

      // Assert
      expect(result).toEqual(220);
    });

    it('applies the dedicated mhp floor for parameter zero', () =>
    {
      // Arrange
      const actor = makeActor();
      baseParam.mockReturnValue(5);
      J.SDP.Metadata.panelStatFloorMhp = 1;
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'bparam-0': [ { perRank: -100, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.param(0);

      // Assert
      expect(result).toEqual(1);
    });

    it('applies the default floor for every other parameter', () =>
    {
      // Arrange
      const actor = makeActor();
      baseParam.mockReturnValue(5);
      J.SDP.Metadata.panelStatFloorDefault = 0;
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'bparam-3': [ { perRank: -100, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 1 }));

      // Act
      const result = actor.param(3);

      // Assert
      expect(result).toEqual(0);
    });
  });

  describe('xparam', () =>
  {
    it('adds the ex-parameter panel bonus onto the original value', () =>
    {
      // Arrange
      const actor = makeActor();
      baseXparam.mockReturnValue(1);
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'xparam-1': [ { perRank: 50, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.xparam(1);

      // Assert
      expect(result).toEqual(2);
    });
  });

  describe('sparam', () =>
  {
    it('adds the sp-parameter panel bonus onto the original value', () =>
    {
      // Arrange
      const actor = makeActor();
      baseSparam.mockReturnValue(1);
      J.SDP.Metadata.panelsMap.set('a', makePanel({ 'sparam-1': [ { perRank: 50, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.sparam(1);

      // Assert
      expect(result).toEqual(2);
    });
  });

  describe('maxTp', () =>
  {
    it('adds the panel-sourced max tp bonus onto the original value', () =>
    {
      // Arrange
      const actor = makeActor();
      baseMaxTp.mockReturnValue(100);
      J.SDP.Metadata.panelsMap.set('a', makePanel({ mtp: [ { perRank: 10, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.maxTp();

      // Assert
      expect(result).toEqual(120);
    });
  });

  describe('maxTpSdpBonuses', () =>
  {
    it('returns 0 when the actor has no rankings', () =>
    {
      // Arrange
      const actor = makeActor();

      // Act
      const result = actor.maxTpSdpBonuses(100);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips rankings whose panel is missing from the panels map', () =>
    {
      // Arrange
      const actor = makeActor();
      actor._j._sdp._ranks.push(makeRanking('ghost', { currentRank: 2 }));

      // Act
      const result = actor.maxTpSdpBonuses(100);

      // Assert
      expect(result).toEqual(0);
    });

    it('skips panels that expose no mtp parameters', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({}));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 2 }));

      // Act
      const result = actor.maxTpSdpBonuses(100);

      // Assert
      expect(result).toEqual(0);
    });

    it('adds a flat mtp parameter as rank times per-rank', () =>
    {
      // Arrange: the base is deliberately not 100, because at a base of 100 the percent formula
      // and the flat formula produce the same number and neither one could be told apart.
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ mtp: [ { perRank: 5, isFlat: true } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }));

      // Act
      const result = actor.maxTpSdpBonuses(40);

      // Assert
      expect(result).toEqual(15);
    });

    it('adds a percent mtp parameter as a floored percentage of the base', () =>
    {
      // Arrange
      const actor = makeActor();
      J.SDP.Metadata.panelsMap.set('a', makePanel({ mtp: [ { perRank: 7, isFlat: false } ] }));
      actor._j._sdp._ranks.push(makeRanking('a', { currentRank: 3 }));

      // Act
      const result = actor.maxTpSdpBonuses(150);

      // Assert
      // 150 * (3 * 7) / 100 = 31.5, floored to 31.
      expect(result).toEqual(31);
    });
  });
});
//endregion plugins/sdp/core/objects/game-actor.test.js
