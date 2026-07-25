//region plugins/_base/_component/game-battler-methods.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Battler methods (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code- sets up globalThis.J, J.BASE.Aliased maps, RegExp tags, and the
    // String.empty/Array.empty sentinel augmentations.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    // vanilla RMMZ core prototype extension (rmmz_core.js), used by eraseState/addNewState's
    // change-detection- not part of this plugin.
    Array.prototype.equals = function(array)
    {
      if (!array || this.length !== array.length) return false;
      return this.every((value, index) => value === array[index]);
    };

    // vanilla RMMZ Game_Battler methods this file aliases- not part of J-Base, so the fixture
    // doesn't define them; stub bare versions before import so J.BASE.Aliased captures real functions.
    globalThis.Game_Battler.prototype.eraseState = function(stateId)
    {
      const index = this._states.indexOf(stateId);
      if (index >= 0) this._states.splice(index, 1);
    };
    globalThis.Game_Battler.prototype.addNewState = function(stateId)
    {
      if (!this._states.includes(stateId)) this._states.push(stateId);
    };
    globalThis.Game_Battler.prototype.gainHp = function(value)
    {
      this.hp = (this.hp ?? 0) + value;
    };
    globalThis.Game_Battler.prototype.gainMp = function(value)
    {
      this.mp = (this.mp ?? 0) + value;
    };
    globalThis.Game_Battler.prototype.gainTp = function(value)
    {
      this.tp = (this.tp ?? 0) + value;
    };

    // Game_BattlerBase must patch first- Game_Battler's cache-invalidation hooks call its setters.
    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
    globalThis.$dataSkills = [];
    globalThis.$dataStates = [];
    globalThis.$dataClasses = [];
  });

  function buildBattler()
  {
    const battler = new globalThis.Game_Battler();
    battler.initMembers();
    return battler;
  }

  describe('skill', () =>
  {
    it('reads the skill straight from $dataSkills by id', () =>
    {
      // Arrange
      globalThis.$dataSkills[5] = { id: 5, name: 'Fireball' };
      const battler = buildBattler();

      // Act
      const result = battler.skill(5);

      // Assert
      expect(result).toEqual({ id: 5, name: 'Fireball' });
    });
  });

  describe('skills', () =>
  {
    it('returns an empty array by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.skills()).toEqual([]);
    });
  });

  describe('skillIds', () =>
  {
    it('returns an empty array by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.skillIds()).toEqual([]);
    });
  });

  describe('battlerId', () =>
  {
    it('returns 1 by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.battlerId()).toBe(1);
    });
  });

  describe('databaseData', () =>
  {
    it('returns null by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.databaseData()).toBeNull();
    });
  });

  describe('class', () =>
  {
    it('reads the class straight from $dataClasses by id', () =>
    {
      // Arrange
      globalThis.$dataClasses[3] = { id: 3, name: 'Warrior' };
      const battler = buildBattler();

      // Act
      const result = battler.class(3);

      // Assert
      expect(result).toEqual({ id: 3, name: 'Warrior' });
    });
  });

  describe('maxTp', () =>
  {
    it('sums the base max tp and note-driven bonuses', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getBaseMaxTp = () => 50;
      battler.getBaseMaxTpBonuses = () => 25;

      // Act
      const result = battler.maxTp();

      // Assert
      expect(result).toBe(75);
    });

    it('floors the total at 0 when bonuses drive it negative', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getBaseMaxTp = () => 10;
      battler.getBaseMaxTpBonuses = () => -100;

      // Act
      const result = battler.maxTp();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getBaseMaxTp', () =>
  {
    it('returns 0 at the base battler level', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getBaseMaxTp()).toBe(0);
    });
  });

  describe('getBaseMaxTpBonuses', () =>
  {
    it('computes and caches the sum from notes on a cold cache', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getAllNotes = () => [ { note: '<maxTp:20>' } ];

      // Act
      const result = battler.getBaseMaxTpBonuses();

      // Assert
      expect(result).toBe(20);
      expect(battler.getCachedMaxTpBonuses()).toBe(20);
    });

    it('returns the cached value without recomputing when warm', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setCachedMaxTpBonuses(999);
      battler.getAllNotes = () => { throw new Error('should not be called'); };

      // Act
      const result = battler.getBaseMaxTpBonuses();

      // Assert
      expect(result).toBe(999);
    });
  });

  describe('initMembers', () =>
  {
    it('initializes fresh cache fields to null', () =>
    {
      // Arrange & Act
      const battler = buildBattler();

      // Assert
      expect(battler.getCachedAllNotes()).toBeNull();
      expect(battler.getCachedMaxTpBonuses()).toBeNull();
      expect(battler.getCachedHarFactor()).toBeNull();
    });

    it('preserves an existing _j._base object instead of overwriting it', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler();
      battler._j = { _base: { existing: 1 } };

      // Act
      battler.initMembers();

      // Assert
      expect(battler._j._base.existing).toBe(1);
    });
  });

  describe('getCachedMaxTpBonuses / setCachedMaxTpBonuses', () =>
  {
    it('round-trips a cached value', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setCachedMaxTpBonuses(42);

      // Assert
      expect(battler.getCachedMaxTpBonuses()).toBe(42);
    });
  });

  describe('getCachedAllNotes / setCachedAllNotes', () =>
  {
    it('round-trips a cached value', () =>
    {
      // Arrange
      const battler = buildBattler();
      const notes = [ { note: 'x' } ];

      // Act
      battler.setCachedAllNotes(notes);

      // Assert
      expect(battler.getCachedAllNotes()).toBe(notes);
    });
  });

  describe('getAllNotes', () =>
  {
    it('returns the test-hook source list when __testNoteSources is set, bypassing the cache', () =>
    {
      // Arrange
      const battler = buildBattler();
      const testSources = [ { note: 'test-source' } ];
      battler.__testNoteSources = testSources;
      battler.getNotesSources = () => { throw new Error('should not be called'); };

      // Act
      const result = battler.getAllNotes();

      // Assert
      expect(result).toBe(testSources);
    });

    it('returns the cached value when warm', () =>
    {
      // Arrange
      const battler = buildBattler();
      const cached = [ { note: 'cached' } ];
      battler.setCachedAllNotes(cached);
      battler.getNotesSources = () => { throw new Error('should not be called'); };

      // Act
      const result = battler.getAllNotes();

      // Assert
      expect(result).toBe(cached);
    });

    it('builds and caches via getNotesSources when the cache is cold', () =>
    {
      // Arrange
      const battler = buildBattler();
      const built = [ { note: 'built' } ];
      battler.getNotesSources = () => built;

      // Act
      const result = battler.getAllNotes();

      // Assert
      expect(result).toBe(built);
      expect(battler.getCachedAllNotes()).toBe(built);
    });
  });

  describe('getNotesSources', () =>
  {
    it('lists databaseData, skills(), and allStates() in that order', () =>
    {
      // Arrange
      globalThis.$dataStates[9] = { id: 9, note: 'state-note' };
      const battler = buildBattler();
      battler.databaseData = () => ({ note: 'db-note' });
      battler.skills = () => [ { note: 'skill-note' } ];
      battler._states = [ 9 ];

      // Act
      const sources = battler.getNotesSources();

      // Assert
      expect(sources.map(s => s.note)).toEqual([ 'db-note', 'skill-note', 'state-note' ]);
    });
  });

  describe('onBattlerDataChange', () =>
  {
    it('invalidates the notes, trait objects, all-traits, max-tp, and HAR caches', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setCachedAllNotes([ 1 ]);
      battler.setCachedTraitObjects([ 1 ]);
      battler.setCachedAllTraits([ 1 ]);
      battler.setCachedMaxTpBonuses(1);
      battler.setCachedHarFactor(1);

      // Act
      battler.onBattlerDataChange();

      // Assert
      expect(battler.getCachedAllNotes()).toBeNull();
      expect(battler.getCachedTraitObjects()).toBeNull();
      expect(battler.getCachedAllTraits()).toBeNull();
      expect(battler.getCachedMaxTpBonuses()).toBeNull();
      expect(battler.getCachedHarFactor()).toBeNull();
    });
  });

  describe('state', () =>
  {
    it('reads the state straight from $dataStates by id', () =>
    {
      // Arrange
      globalThis.$dataStates[4] = { id: 4, name: 'Poison' };
      const battler = buildBattler();

      // Act
      const result = battler.state(4);

      // Assert
      expect(result).toEqual({ id: 4, name: 'Poison' });
    });
  });

  describe('states', () =>
  {
    it('maps each raw state id to its full state data', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = { id: 1, name: 'A' };
      globalThis.$dataStates[2] = { id: 2, name: 'B' };
      const battler = buildBattler();
      battler._states = [ 1, 2 ];

      // Act
      const result = battler.states();

      // Assert
      expect(result).toEqual([ { id: 1, name: 'A' }, { id: 2, name: 'B' } ]);
    });
  });

  describe('eraseState', () =>
  {
    it('fires onStateRemoval when the state set actually changes', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._states = [ 1 ];
      battler.onStateRemoval = vi.fn();

      // Act
      battler.eraseState(1);

      // Assert
      expect(battler.onStateRemoval).toHaveBeenCalledWith(1);
    });

    it('does not fire onStateRemoval when the state set is unchanged', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._states = [];
      battler.onStateRemoval = vi.fn();

      // Act- erasing a state that was never present leaves _states unchanged.
      battler.eraseState(1);

      // Assert
      expect(battler.onStateRemoval).not.toHaveBeenCalled();
    });
  });

  describe('onStateRemoval', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.onBattlerDataChange = vi.fn();

      // Act
      battler.onStateRemoval(1);

      // Assert
      expect(battler.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('addNewState', () =>
  {
    it('fires onStateAdded when the state set actually changes', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._states = [];
      battler.onStateAdded = vi.fn();

      // Act
      battler.addNewState(1);

      // Assert
      expect(battler.onStateAdded).toHaveBeenCalledWith(1);
    });

    it('does not fire onStateAdded when the state set is unchanged', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._states = [ 1 ];
      battler.onStateAdded = vi.fn();

      // Act- adding a state that's already present leaves _states unchanged.
      battler.addNewState(1);

      // Assert
      expect(battler.onStateAdded).not.toHaveBeenCalled();
    });
  });

  describe('onStateAdded', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.onBattlerDataChange = vi.fn();

      // Act
      battler.onStateAdded(1);

      // Assert
      expect(battler.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('allStates', () =>
  {
    it('returns a fresh array containing this battler\'s own states', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = { id: 1, name: 'A' };
      const battler = buildBattler();
      battler._states = [ 1 ];

      // Act
      const result = battler.allStates();

      // Assert
      expect(result).toEqual([ { id: 1, name: 'A' } ]);
    });
  });

  describe('allStateIds', () =>
  {
    it('returns a copy of the raw _states id array', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler._states = [ 1, 2 ];

      // Act
      const result = battler.allStateIds();

      // Assert
      expect(result).toEqual([ 1, 2 ]);
      expect(result).not.toBe(battler._states);
    });
  });

  describe('isStateAffected', () =>
  {
    it('returns true when the state id is present via allStateIds', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.allStateIds = () => [ 1, 2 ];

      // Act & Assert
      expect(battler.isStateAffected(2)).toBe(true);
    });

    it('returns false when the state id is absent from allStateIds', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.allStateIds = () => [ 1, 2 ];

      // Act & Assert
      expect(battler.isStateAffected(9)).toBe(false);
    });
  });

  describe('currentHpPercent', () =>
  {
    it('returns hp/mhp rounded to two decimals', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.hp = 1;
      battler.mhp = 3;

      // Act
      const result = battler.currentHpPercent();

      // Assert
      expect(result).toBe(0.33);
    });
  });

  describe('currentHpPercent100', () =>
  {
    it('returns the base-100 rounded version of currentHpPercent', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.currentHpPercent = () => 0.33;

      // Act
      const result = battler.currentHpPercent100();

      // Assert
      expect(result).toBe(33);
    });
  });

  describe('parameter', () =>
  {
    it('delegates to ParameterRegistry.resolveValue for the given key', async () =>
    {
      // Arrange
      const { default: ParameterRegistry } = await import('../../../../src/plugins/_base/core/ParameterRegistry.js');
      const { default: ParameterDefinition } = await import('../../../../src/plugins/_base/models/ParameterDefinition.js');
      ParameterRegistry._definitions.clear();
      ParameterRegistry._groupCache.clear();
      ParameterRegistry.register(new ParameterDefinition(
        'atk', 'combat', 0, () => '', () => [], () => 0, () => 0, 'flat', 'none', (b) => b.param(2), null,
      ));
      const battler = buildBattler();
      battler.param = (id) => (id === 2 ? 55 : -1);

      // Act
      const result = battler.parameter('atk');

      // Assert
      expect(result).toBe(55);
    });

    it('returns 0 for an unregistered key', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.parameter('not-a-real-key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('onHeal', () =>
  {
    it('is a no-op hook by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert- exists to be overridden/aliased; calling it directly should not throw.
      expect(() => battler.onHeal('hp', 5)).not.toThrow();
    });
  });

  describe('gainHp', () =>
  {
    it('fires onHeal with the HP resource when the recovery is positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.hp = 0;
      battler.mhp = 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainHp(5);

      // Assert
      expect(battler.onHeal).toHaveBeenCalledWith(globalThis.J.BASE.Resource.HP, 5);
    });

    it('does not fire onHeal when the change is not positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.hp = 10;
      battler.mhp = 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainHp(-5);

      // Assert
      expect(battler.onHeal).not.toHaveBeenCalled();
    });
  });

  describe('gainMp', () =>
  {
    it('fires onHeal with the MP resource when the recovery is positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.mp = 0;
      battler.mmp = 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainMp(5);

      // Assert
      expect(battler.onHeal).toHaveBeenCalledWith(globalThis.J.BASE.Resource.MP, 5);
    });

    it('does not fire onHeal when the change is not positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.mp = 10;
      battler.mmp = 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainMp(-5);

      // Assert
      expect(battler.onHeal).not.toHaveBeenCalled();
    });
  });

  describe('gainTp', () =>
  {
    it('fires onHeal with the TP resource when the recovery is positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.tp = 0;
      battler.maxTp = () => 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainTp(5);

      // Assert
      expect(battler.onHeal).toHaveBeenCalledWith(globalThis.J.BASE.Resource.TP, 5);
    });

    it('does not fire onHeal when the change is not positive', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.tp = 10;
      battler.maxTp = () => 100;
      battler.onHeal = vi.fn();

      // Act
      battler.gainTp(-5);

      // Assert
      expect(battler.onHeal).not.toHaveBeenCalled();
    });
  });

  describe('Game_BattlerBase#har base getter', () =>
  {
    it('returns the 1.0 baseline (shadowed on Game_Battler by its own har getter)', () =>
    {
      // Arrange
      const descriptor = Object.getOwnPropertyDescriptor(globalThis.Game_BattlerBase.prototype, 'har');

      // Act
      const result = descriptor.get.call({});

      // Assert
      expect(result).toBe(1.0);
    });
  });

  describe('har', () =>
  {
    it('adds the SDP bonus on top of baseHarFactor when getSdpBonusForParameterKey exists', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.baseHarFactor = () => 1.2;
      battler.getSdpBonusForParameterKey = (key) => (key === 'har' ? 0.1 : 0);

      // Act & Assert
      expect(battler.har).toBeCloseTo(1.3);
    });

    it('returns baseHarFactor alone when getSdpBonusForParameterKey is absent', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.baseHarFactor = () => 1.2;

      // Act & Assert
      expect(battler.har).toBeCloseTo(1.2);
    });
  });

  describe('baseHarFactor', () =>
  {
    it('computes and caches the factor from note-driven bonuses on a cold cache', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getAllNotes = () => [ { note: '<har:20>' } ];

      // Act
      const result = battler.baseHarFactor();

      // Assert- (100 + 20) / 100 = 1.2.
      expect(result).toBeCloseTo(1.2);
      expect(battler.getCachedHarFactor()).toBeCloseTo(1.2);
    });

    it('returns the cached value without recomputing when warm', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setCachedHarFactor(9.9);
      battler.getAllNotes = () => { throw new Error('should not be called'); };

      // Act
      const result = battler.baseHarFactor();

      // Assert
      expect(result).toBe(9.9);
    });
  });

  describe('getCachedHarFactor / setCachedHarFactor', () =>
  {
    it('round-trips a cached value', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setCachedHarFactor(1.5);

      // Assert
      expect(battler.getCachedHarFactor()).toBe(1.5);
    });
  });
});
//endregion plugins/_base/_component/game-battler-methods.test.js
