//region plugins/_base/objects/game-battler-base.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_BattlerBase.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_BattlerBase.prototype`), so this file direct-imports it against a bare placeholder engine
 * global rather than nesting a vm context.
 */
describe('J-Base Game_BattlerBase (direct src import)', () =>
{
  let originalInitMembers;
  let originalXparam;

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Game_BattlerBase: new Map() } } };

    function Game_BattlerBase()
    {
    }

    // vanilla RMMZ statics this file's overrides key their trait lookups by.
    Game_BattlerBase.TRAIT_XPARAM = 22;
    Game_BattlerBase.TRAIT_SPARAM = 23;
    Game_BattlerBase.TRAIT_ELEMENT_RATE = 11;
    Game_BattlerBase.TRAIT_PARAM = 21;
    Game_BattlerBase.TRAIT_STATE_RATE = 14;

    originalInitMembers = vi.fn();
    Game_BattlerBase.prototype.initMembers = originalInitMembers;

    // xparam is aliased rather than overwritten, so the original has to exist before the import or the
    // alias captures undefined and every call through it explodes.
    originalXparam = vi.fn(() => 0);
    Game_BattlerBase.prototype.xparam = originalXparam;

    globalThis.Game_BattlerBase = Game_BattlerBase;

    // J-Base adds Array.empty in initialization.js, which this bare-global harness does not load.
    if (Array.empty === undefined)
    {
      Object.defineProperty(Array, 'empty', {
        get: () => Array.of(),
        configurable: true,
      });
    }

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockClear();
    originalXparam.mockClear();
    originalXparam.mockReturnValue(0);
  });

  function buildBattler()
  {
    return Object.create(globalThis.Game_BattlerBase.prototype);
  }

  /**
   * A battler that has been through `initMembers`, as every real one has.
   *
   * The bare {@link buildBattler} above exists so the `initMembers` tests can observe a virgin object.
   * Everything reading a parameter needs the `_j._base` cache namespace that `initMembers` establishes,
   * because in the engine that always runs from the constructor before anything can ask for a stat.
   * @returns {Game_BattlerBase}
   */
  function buildInitializedBattler()
  {
    const battler = buildBattler();
    battler.initMembers();

    return battler;
  }

  describe('initMembers', () =>
  {
    it('calls the original aliased initMembers', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledOnce();
    });

    it('initializes fresh _j/_j._base cache fields to null when none existed', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.initMembers();

      // Assert
      expect(battler._j._base._cachedTraitObjects).toBeNull();
      expect(battler._j._base._cachedAllTraits).toBeNull();
    });

    it('preserves an existing _j object instead of overwriting it', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._j = { existing: 1 };

      // Act
      battler.initMembers();

      // Assert
      expect(battler._j.existing).toBe(1);
    });

    it('preserves an existing _j._base object instead of overwriting it', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._j = { _base: { existing: 2 } };

      // Act
      battler.initMembers();

      // Assert
      expect(battler._j._base.existing).toBe(2);
    });
  });

  describe('getCachedTraitObjects / setCachedTraitObjects', () =>
  {
    it('round-trips a cached value', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      const traitObjects = [ { traits: [] } ];

      // Act
      battler.setCachedTraitObjects(traitObjects);

      // Assert
      expect(battler.getCachedTraitObjects()).toBe(traitObjects);
    });
  });

  describe('traitObjects', () =>
  {
    it('returns the cached value when the cache is warm', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      const cached = [ { traits: [] } ];
      battler.setCachedTraitObjects(cached);
      battler.buildTraitObjects = vi.fn();

      // Act
      const result = battler.traitObjects();

      // Assert
      expect(result).toBe(cached);
      expect(battler.buildTraitObjects).not.toHaveBeenCalled();
    });

    it('builds and caches the result when the cache is cold', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      const built = [ { traits: [ 'x' ] } ];
      battler.buildTraitObjects = vi.fn(() => built);

      // Act
      const result = battler.traitObjects();

      // Assert
      expect(result).toBe(built);
      expect(battler.getCachedTraitObjects()).toBe(built);
    });
  });

  describe('buildTraitObjects', () =>
  {
    it('returns a fresh array copy of states()', () =>
    {
      // Arrange
      const battler = buildBattler();
      const states = [ { id: 1 } ];
      battler.states = () => states;

      // Act
      const result = battler.buildTraitObjects();

      // Assert
      expect(result).toEqual(states);
      expect(result).not.toBe(states);
    });
  });

  describe('getCachedAllTraits / setCachedAllTraits', () =>
  {
    it('round-trips a cached value', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      const allTraits = [ { code: 1 } ];

      // Act
      battler.setCachedAllTraits(allTraits);

      // Assert
      expect(battler.getCachedAllTraits()).toBe(allTraits);
    });
  });

  describe('allTraits', () =>
  {
    it('returns the cached value when the cache is warm', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      const cached = [ { code: 1 } ];
      battler.setCachedAllTraits(cached);
      battler.traitObjects = vi.fn();

      // Act
      const result = battler.allTraits();

      // Assert
      expect(result).toBe(cached);
      expect(battler.traitObjects).not.toHaveBeenCalled();
    });

    it('flattens traits from every trait object and caches the result when the cache is cold', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.initMembers();
      battler.traitObjects = () => [
        { traits: [ { code: 1 } ] },
        { traits: [ { code: 2 }, { code: 3 } ] },
      ];

      // Act
      const result = battler.allTraits();

      // Assert
      expect(result).toEqual([ { code: 1 }, { code: 2 }, { code: 3 } ]);
      expect(battler.getCachedAllTraits()).toEqual(result);
    });
  });

  describe('knownBaseParameterIds / knownExParameterIds / knownSpParameterIds', () =>
  {
    it('returns the 8 base parameter ids', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_BattlerBase.knownBaseParameterIds()).toEqual([ 0, 1, 2, 3, 4, 5, 6, 7 ]);
    });

    it('returns the 10 ex-parameter ids', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_BattlerBase.knownExParameterIds()).toEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
    });

    it('returns the 10 sp-parameter ids', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.Game_BattlerBase.knownSpParameterIds()).toEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
    });
  });

  describe('traitsDeltaSum', () =>
  {
    it('sums the delta above the 1.0 baseline for every matching trait', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: 1.5 }, { value: 1.2 } ];

      // Act
      const result = battler.traitsDeltaSum(23, 4);

      // Assert- (1.5 - 1) + (1.2 - 1) = 0.7.
      expect(result).toBeCloseTo(0.7);
    });

    it('returns 0 when there are no matching traits', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [];

      // Act
      const result = battler.traitsDeltaSum(23, 4);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('sparam', () =>
  {
    it('additively stacks sparam trait deltas instead of multiplying them', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();
      battler.traitsWithId = (code, id) => (code === 23 && id === 2 ? [ { value: 1.5 }, { value: 1.5 } ] : []);

      // Act
      const result = battler.sparam(2);

      // Assert- 1.0 + (0.5 + 0.5) = 2.0, not the multiplicative 2.25.
      expect(result).toBeCloseTo(2.0);
    });

    it('replaces equipment share of the stacked total with each item own scaled base', () =>
    {
      // Arrange- the flattened traits total +1.0, of which +0.5 came from this shield. Localised, the
      // shield instead contributes (30 / 100) * 1.5 = 0.45 against its own parry base.
      const battler = buildInitializedBattler();
      battler.traitsWithId = (code, id) => (code === 23 && id === 1 ? [ { value: 1.5 }, { value: 1.5 } ] : []);
      battler.localisedEquips = () => [ fakeEquip(1.5, 0, 30) ];

      // Act
      const result = battler.sparam(1);

      // Assert- (1.0 + 1.0 - 0.5) + 0.45.
      expect(result).toBeCloseTo(1.95);
    });
  });

  //region localised equipment parameters
  describe('localisedEquips', () =>
  {
    it('answers with nothing at the battler level, since only actors wear equipment', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();

      // Act
      const result = battler.localisedEquips();

      // Assert
      expect(result).toEqual([]);
    });
  });

  /**
   * Builds a stand-in equip exposing only what the contribution helpers ask of one.
   *
   * Written from the caller's side rather than mirrored from RPG_EquipItem, so a change in how the real
   * class computes `ownRate` cannot quietly agree with a wrong expectation here.
   * @param {number} ownRate The multiplier this item applies to its own base.
   * @param {number} xBase The ex-parameter base this item is worth, in whole percents.
   * @param {number} sBase The sp-parameter base this item is worth, in whole percents.
   * @returns {{ownRate: Function, thisXParam: Function, thisSParam: Function}}
   */
  const fakeEquip = (ownRate, xBase = 0, sBase = 0) => ({
    ownRate: () => ownRate,
    thisXParam: () => xBase,
    thisSParam: () => sBase,
  });

  describe('buildEquipParameterContribution', () =>
  {
    it('answers with zero on both counts when nothing is equipped', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();

      // Act
      const result = battler.buildEquipParameterContribution(21, 2);

      // Assert
      expect(result.delta).toBe(0);
      expect(result.local).toBe(0);
    });

    it('sums each item distance from the neutral multiplier into the delta', () =>
    {
      // Arrange- two items at different rates, so a reader that took only the first or only the last
      // would land on 0.5 or 0.25 rather than their sum.
      const battler = buildInitializedBattler();
      battler.localisedEquips = () => [ fakeEquip(1.5), fakeEquip(1.25) ];

      // Act
      const result = battler.buildEquipParameterContribution(21, 2);

      // Assert- 0.5 + 0.25.
      expect(result.delta).toBeCloseTo(0.75);
    });

    it('contributes no local half for a base parameter, whatever bases the item carries', () =>
    {
      // Arrange- the item carries both an ex and an sp base, and neither may reach the result. Reading
      // either one would mean asking for a different family with a base-parameter id; paramPlus owns
      // this half. Without the guard the sp base leaks through as (90 / 100) * 2.0.
      const battler = buildInitializedBattler();
      battler.localisedEquips = () => [ fakeEquip(2.0, 40, 90) ];

      // Act
      const result = battler.buildEquipParameterContribution(21, 2);

      // Assert- the delta anchors that the item was visited at all, so the zero is a decision and not
      // an empty loop.
      expect(result.local).toBe(0);
      expect(result.delta).toBeCloseTo(1.0);
    });

    it('reads the ex-parameter base for code 22', () =>
    {
      // Arrange- the two bases differ so reading the wrong one is visible in the result.
      const battler = buildInitializedBattler();
      battler.localisedEquips = () => [ fakeEquip(2.0, 40, 90) ];

      // Act
      const result = battler.buildEquipParameterContribution(22, 0);

      // Assert- (40 / 100) * 2.0, proving the ex base was taken and scaled by the item's own rate.
      expect(result.local).toBeCloseTo(0.8);
    });

    it('reads the sp-parameter base for any other code', () =>
    {
      // Arrange- same fixture, different family. This is the other arm of the base conditional.
      const battler = buildInitializedBattler();
      battler.localisedEquips = () => [ fakeEquip(2.0, 40, 90) ];

      // Act
      const result = battler.buildEquipParameterContribution(23, 1);

      // Assert- (90 / 100) * 2.0.
      expect(result.local).toBeCloseTo(1.8);
    });
  });

  describe('equipParameterContribution', () =>
  {
    it('allocates the cache when it is cold', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();

      // Act
      battler.equipParameterContribution(21, 2);

      // Assert
      expect(battler.getCachedEquipContributions()).toBeInstanceOf(Map);
    });

    it('serves a repeat ask for the same parameter without recomputing', () =>
    {
      // Arrange- asserting on the returned values instead would pass with no cache at all, so the claim
      // has to be about how many times the builder ran.
      const battler = buildInitializedBattler();
      const builder = vi.spyOn(battler, 'buildEquipParameterContribution');

      // Act
      battler.equipParameterContribution(21, 2);
      battler.equipParameterContribution(21, 2);

      // Assert
      expect(builder).toHaveBeenCalledOnce();

      // spies on this battler are restored by hand; restoreAllMocks does not reach them reliably here.
      builder.mockRestore();
    });

    it('computes separately for a different parameter within the same family', () =>
    {
      // Arrange- proves the key carries the dataId, not merely "something has been cached".
      const battler = buildInitializedBattler();
      const builder = vi.spyOn(battler, 'buildEquipParameterContribution');

      // Act
      battler.equipParameterContribution(21, 2);
      battler.equipParameterContribution(21, 5);

      // Assert
      expect(builder).toHaveBeenCalledTimes(2);

      builder.mockRestore();
    });

    it('computes separately for the same parameter id in a different family', () =>
    {
      // Arrange- and proves the key carries the code too; xparam 2 and sparam 2 are unrelated stats.
      const battler = buildInitializedBattler();
      const builder = vi.spyOn(battler, 'buildEquipParameterContribution');

      // Act
      battler.equipParameterContribution(22, 2);
      battler.equipParameterContribution(23, 2);

      // Assert
      expect(builder).toHaveBeenCalledTimes(2);

      builder.mockRestore();
    });
  });

  describe('xparam', () =>
  {
    it('performs the original aggregation', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();

      // Act
      battler.xparam(0);

      // Assert
      expect(originalXparam).toHaveBeenCalledOnce();
    });

    it('replaces equipment share of the global sum with each item own scaled base', () =>
    {
      // Arrange- the battler-wide sum is 0.9, of which 0.5 came from this sword. Localised, the sword
      // instead contributes (40 / 100) * 1.5 = 0.6 measured against its own accuracy base.
      const battler = buildInitializedBattler();
      originalXparam.mockReturnValue(0.9);
      battler.localisedEquips = () => [ fakeEquip(1.5, 40) ];

      // Act
      const result = battler.xparam(0);

      // Assert- (0.9 - 0.5) + 0.6.
      expect(result).toBeCloseTo(1.0);
    });

    it('leaves a battler wearing nothing on the original aggregation alone', () =>
    {
      // Arrange- the anchor value proves the method ran rather than returning an untouched zero.
      const battler = buildInitializedBattler();
      originalXparam.mockReturnValue(0.35);

      // Act
      const result = battler.xparam(0);

      // Assert
      expect(result).toBeCloseTo(0.35);
    });
  });

  describe('elementRate', () =>
  {
    it('additively stacks element rate trait deltas', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: 1.2 }, { value: 1.2 } ];

      // Act
      const result = battler.elementRate(3);

      // Assert- 1.0 + (0.2 + 0.2) = 1.4.
      expect(result).toBeCloseTo(1.4);
    });

    it('floors the result at 0 when stacked negative deltas would go negative', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: -5 }, { value: -5 } ];

      // Act
      const result = battler.elementRate(3);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('paramRate', () =>
  {
    it('additively stacks param rate trait deltas', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();
      battler.traitsWithId = () => [ { value: 1.5 }, { value: 1.5 } ];

      // Act
      const result = battler.paramRate(2);

      // Assert
      expect(result).toBeCloseTo(2.0);
    });

    it('floors the result at 0 when stacked negative deltas would go negative', () =>
    {
      // Arrange
      const battler = buildInitializedBattler();
      battler.traitsWithId = () => [ { value: -5 } ];

      // Act
      const result = battler.paramRate(2);

      // Assert
      expect(result).toBe(0);
    });

    it('subtracts equipment share without re-adding it, since paramPlus carries that half', () =>
    {
      // Arrange- the flattened traits total +1.0, of which +0.5 came from this sword. Base parameters
      // have somewhere to be added, so the sword's own scaled worth lands in paramPlus and only the
      // subtraction happens here. The sp base on the fixture must not leak into the result.
      const battler = buildInitializedBattler();
      battler.traitsWithId = () => [ { value: 1.5 }, { value: 1.5 } ];
      battler.localisedEquips = () => [ fakeEquip(1.5, 0, 30) ];

      // Act
      const result = battler.paramRate(2);

      // Assert- 1.0 + 1.0 - 0.5, with no local term added back.
      expect(result).toBeCloseTo(1.5);
    });
  });

  describe('stateRate', () =>
  {
    it('additively stacks state rate trait deltas', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: 0.5 } ];

      // Act
      const result = battler.stateRate(5);

      // Assert- 1.0 + (0.5 - 1.0) = 0.5.
      expect(result).toBeCloseTo(0.5);
    });

    it('floors the result at 0 when stacked resistances exceed full immunity', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: -5 }, { value: -5 } ];

      // Act
      const result = battler.stateRate(5);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('mtp', () =>
  {
    it('delegates to maxTp()', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.maxTp = () => 123;

      // Act & Assert
      expect(battler.mtp).toBe(123);
    });
  });

  describe('mrf', () =>
  {
    it('returns the raw xparam(5) value when non-negative', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.xparam = (id) => (id === 5 ? 0.3 : -1);

      // Act & Assert
      expect(battler.mrf).toBe(0.3);
    });

    it('floors negative xparam(5) values at 0', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.xparam = () => -0.3;

      // Act & Assert
      expect(battler.mrf).toBe(0);
    });
  });

  describe('cnt', () =>
  {
    it('returns the raw xparam(6) value when non-negative', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.xparam = (id) => (id === 6 ? 0.4 : -1);

      // Act & Assert
      expect(battler.cnt).toBe(0.4);
    });

    it('floors negative xparam(6) values at 0', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.xparam = () => -0.4;

      // Act & Assert
      expect(battler.cnt).toBe(0);
    });
  });
});
//endregion plugins/_base/objects/game-battler-base.test.js
