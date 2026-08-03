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

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Game_BattlerBase: new Map() } } };

    function Game_BattlerBase()
    {
    }

    // vanilla RMMZ statics this file's overrides key their trait lookups by.
    Game_BattlerBase.TRAIT_SPARAM = 23;
    Game_BattlerBase.TRAIT_ELEMENT_RATE = 11;
    Game_BattlerBase.TRAIT_PARAM = 21;
    Game_BattlerBase.TRAIT_STATE_RATE = 14;

    originalInitMembers = vi.fn();
    Game_BattlerBase.prototype.initMembers = originalInitMembers;

    globalThis.Game_BattlerBase = Game_BattlerBase;

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockClear();
  });

  function buildBattler()
  {
    return Object.create(globalThis.Game_BattlerBase.prototype);
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
      const battler = buildBattler();
      battler.traitsWithId = (code, id) => (code === 23 && id === 2 ? [ { value: 1.5 }, { value: 1.5 } ] : []);

      // Act
      const result = battler.sparam(2);

      // Assert- 1.0 + (0.5 + 0.5) = 2.0, not the multiplicative 2.25.
      expect(result).toBeCloseTo(2.0);
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
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: 1.5 }, { value: 1.5 } ];

      // Act
      const result = battler.paramRate(2);

      // Assert
      expect(result).toBeCloseTo(2.0);
    });

    it('floors the result at 0 when stacked negative deltas would go negative', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.traitsWithId = () => [ { value: -5 } ];

      // Act
      const result = battler.paramRate(2);

      // Assert
      expect(result).toBe(0);
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
