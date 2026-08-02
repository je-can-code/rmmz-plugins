//region plugins/passive/core/objects/game-battler.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

describe('J-Passive Game_Battler (direct src import)', () =>
{
  let RPG_BaseItem;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPG_BaseItem } = await import('../../../../../src/plugins/_base/database/base/RPG_BaseItem.js'));
    globalThis.RPG_BaseItem = RPG_BaseItem;

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/passive/core/objects/Game_Battler.js');
  });

  /** Builds a fresh Game_Battler-shaped instance with initPassiveStatesMembers already run. */
  function buildBattler()
  {
    const battler = Object.create(globalThis.Game_Battler.prototype);
    battler.initPassiveStatesMembers();
    battler.onBattlerDataChange = vi.fn();
    return battler;
  }

  /** Builds a minimal source object shaped like a database row for sourceHasAnyPassiveIds. */
  function buildSource(overrides = {})
  {
    return {
      passiveStateIds: [],
      uniquePassiveStateIds: [],
      isEquipItem: () => false,
      equippedPassiveStateIds: [],
      uniqueEquippedPassiveStateIds: [],
      ...overrides,
    };
  }

  describe('initMembers / initPassiveStatesMembers', () =>
  {
    it('initializes empty passive state tracking structures', () =>
    {
      // Act
      const battler = buildBattler();

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([]);
      expect(battler.passiveExternalStateSources()).toEqual([]);
      expect(battler.passiveCapableSources()).toEqual([]);
    });

    it('routes through Game_Battler.prototype.initMembers, which delegates to the base', () =>
    {
      // Arrange
      const battler = Object.create(globalThis.Game_Battler.prototype);

      // Act
      battler.initMembers();

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([]);
    });
  });

  describe('sourceHasAnyPassiveIds', () =>
  {
    it('returns false for a falsy source', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(null)).toBe(false);
    });

    it('returns true when the source has stackable passive state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource({ passiveStateIds: [ 1 ] });

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(true);
    });

    it('returns true when the source has unique passive state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource({ uniquePassiveStateIds: [ 1 ] });

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(true);
    });

    it('returns true when an equip item has equipped passive state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource({ isEquipItem: () => true, equippedPassiveStateIds: [ 1 ] });

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(true);
    });

    it('returns true when an equip item has unique equipped passive state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource({ isEquipItem: () => true, uniqueEquippedPassiveStateIds: [ 1 ] });

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(true);
    });

    it('returns false when an equip item carries no passive ids at all', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource({ isEquipItem: () => true });

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(false);
    });

    it('returns false for a plain non-equip source with no passive ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const source = buildSource();

      // Act & Assert
      expect(battler.sourceHasAnyPassiveIds(source)).toBe(false);
    });
  });

  describe('cachePassiveCapableSources', () =>
  {
    it('filters getPassiveStateSources down to only sources carrying passive ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      const withIds = buildSource({ passiveStateIds: [ 1 ] });
      const withoutIds = buildSource();
      battler.__baseDatabaseData = withoutIds;
      battler.__baseStates = [ withIds ];

      // Act
      battler.cachePassiveCapableSources();

      // Assert
      expect(battler.passiveCapableSources()).toEqual([ withIds ]);
    });
  });

  describe('addPassiveStateExternalSourceByStateIds / addPassiveStateExternalSource', () =>
  {
    it('builds a source from the given state ids and adds it, refreshing by default', () =>
    {
      // Arrange
      const battler = buildBattler();
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.addPassiveStateExternalSourceByStateIds([ 1, 2 ]);

      // Assert
      expect(battler.passiveExternalStateSources()).toHaveLength(1);
      expect(battler.passiveExternalStateSources()[0].note).toBe('<passive:[1,2]>');
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('does not refresh when deferRefresh is true', () =>
    {
      // Arrange
      const battler = buildBattler();
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.addPassiveStateExternalSourceByStateIds([ 3 ], true);

      // Assert
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearPassiveStateExternalSources', () =>
  {
    it('empties the external sources and refreshes by default', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateExternalSourceByStateIds([ 1 ], true);
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.clearPassiveStateExternalSources();

      // Assert
      expect(battler.passiveExternalStateSources()).toEqual([]);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('does not refresh when deferRefresh is true', () =>
    {
      // Arrange
      const battler = buildBattler();
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.clearPassiveStateExternalSources(true);

      // Assert
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('buildSourceFromStateIds', () =>
  {
    it('builds an RPG_BaseItem-shaped fake row carrying the given state ids', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.buildSourceFromStateIds([ 4, 5 ]);

      // Assert
      expect(result).toBeInstanceOf(RPG_BaseItem);
      expect(result.note).toBe('<passive:[4,5]>');
    });
  });

  describe('addPassiveStateId / canAddPassiveStateId', () =>
  {
    it('adds a state id when duplicates are allowed by default', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.addPassiveStateId(1);
      battler.addPassiveStateId(1);

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([ 1, 1 ]);
    });

    it('skips adding a duplicate id when allowDuplicates is false', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateId(1);

      // Act
      battler.addPassiveStateId(1, false);

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([ 1 ]);
    });
  });

  describe('getPassiveStates / clearPassiveStates', () =>
  {
    it('maps tracked state ids into their converted RPG_State form', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.__statesById = { 10: { id: 10, name: 'Regen' } };
      battler.addPassiveStateId(10);

      // Act
      const states = battler.getPassiveStates();

      // Assert
      expect(states).toEqual([ { id: 10, name: 'Regen' } ]);
    });

    it('empties the tracked state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateId(1);

      // Act
      battler.clearPassiveStates();

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([]);
    });
  });

  describe('canIncludePassiveStateFromSource / getPassiveStackContributionFromSource', () =>
  {
    it('always allows inclusion in the base implementation', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.canIncludePassiveStateFromSource({}, 1)).toBe(true);
    });

    it('always contributes a flat 1 stack in the base implementation', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getPassiveStackContributionFromSource({}, 1)).toBe(1);
    });
  });

  describe('getPassiveStateSources', () =>
  {
    it('combines database data, all states, skills, and external sources', () =>
    {
      // Arrange
      const battler = buildBattler();
      const dbData = buildSource({ id: 'db' });
      const state = buildSource({ id: 'state' });
      const skill = buildSource({ id: 'skill' });
      const external = buildSource({ id: 'external' });
      battler.__baseDatabaseData = dbData;
      battler.__baseStates = [ state ];
      battler.__baseSkills = [ skill ];
      battler.addPassiveStateExternalSource(external, true);

      // Act
      const sources = battler.getPassiveStateSources();

      // Assert
      expect(sources).toEqual([ dbData, state, skill, external ]);
    });

    it('includes every entry returned by getPassiveStateSourcedSkills, not just skills()', () =>
    {
      // Arrange- an overridden getPassiveStateSourcedSkills stands in for what an extension would do.
      const battler = buildBattler();
      const narrowedSkill = buildSource({ id: 'narrowed-skill' });
      battler.__baseSkills = [ buildSource({ id: 'excluded-skill' }) ];
      battler.getPassiveStateSourcedSkills = () => [ narrowedSkill ];

      // Act
      const sources = battler.getPassiveStateSources();

      // Assert
      expect(sources).toContain(narrowedSkill);
      expect(sources).not.toContain(battler.__baseSkills[0]);
    });
  });

  describe('getPassiveStateSourcedSkills', () =>
  {
    it('defaults to returning exactly this.skills()', () =>
    {
      // Arrange
      const battler = buildBattler();
      const skill = buildSource({ id: 'skill' });
      battler.__baseSkills = [ skill ];

      // Act
      const sourcedSkills = battler.getPassiveStateSourcedSkills();

      // Assert
      expect(sourcedSkills).toEqual([ skill ]);
    });
  });

  describe('getAllUniquePassiveStateIds', () =>
  {
    it('collects unique ids across sources, including equip-only unique ids for equip items', () =>
    {
      // Arrange
      const battler = buildBattler();
      const equip = buildSource({
        isEquipItem: () => true, uniquePassiveStateIds: [ 1 ], uniqueEquippedPassiveStateIds: [ 2 ],
      });
      battler.__baseDatabaseData = buildSource();
      battler.__baseStates = [ equip ];

      // Act
      const result = battler.getAllUniquePassiveStateIds();

      // Assert
      expect(result).toEqual(new Set([ 1, 2 ]));
    });

    it('gates candidates through canIncludePassiveStateFromSource', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.canIncludePassiveStateFromSource = () => false;
      battler.__baseDatabaseData = buildSource({ uniquePassiveStateIds: [ 1 ] });

      // Act
      const result = battler.getAllUniquePassiveStateIds();

      // Assert
      expect(result).toEqual(new Set());
    });
  });

  describe('getAllStackablePassiveStateIds', () =>
  {
    it('sums contributions across multiple sources for the same state id', () =>
    {
      // Arrange
      const battler = buildBattler();
      const sourceA = buildSource({ passiveStateIds: [ 1 ] });
      const sourceB = buildSource({ passiveStateIds: [ 1 ] });
      battler.__baseDatabaseData = buildSource();
      battler.__baseStates = [ sourceA, sourceB ];

      // Act
      const result = battler.getAllStackablePassiveStateIds();

      // Assert
      expect(result).toEqual(new Map([ [ 1, 2 ] ]));
    });

    it('includes equip-only passive ids for equip items', () =>
    {
      // Arrange
      const battler = buildBattler();
      const equip = buildSource({ isEquipItem: () => true, equippedPassiveStateIds: [ 5 ] });
      battler.__baseDatabaseData = buildSource();
      battler.__baseStates = [ equip ];

      // Act
      const result = battler.getAllStackablePassiveStateIds();

      // Assert
      expect(result).toEqual(new Map([ [ 5, 1 ] ]));
    });

    it('gates candidates through canIncludePassiveStateFromSource', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.canIncludePassiveStateFromSource = () => false;
      battler.__baseDatabaseData = buildSource({ passiveStateIds: [ 1 ] });

      // Act
      const result = battler.getAllStackablePassiveStateIds();

      // Assert
      expect(result).toEqual(new Map());
    });

    it('excludes a source/state pair whose contribution is zero or less', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getPassiveStackContributionFromSource = () => 0;
      battler.__baseDatabaseData = buildSource({ passiveStateIds: [ 1 ] });

      // Act
      const result = battler.getAllStackablePassiveStateIds();

      // Assert
      expect(result).toEqual(new Map());
    });
  });

  describe('refreshPassiveStates', () =>
  {
    it('commits unique ids first, then stackable ids that are not already unique, then caches sources', () =>
    {
      // Arrange- state 1 is both unique and stackable (unique wins, no duplicate stack); state 2 is
      // stackable only, contributed twice.
      const battler = buildBattler();
      const uniqueSource = buildSource({ uniquePassiveStateIds: [ 1 ] });
      const stackableSource = buildSource({ passiveStateIds: [ 1, 2, 2 ] });
      battler.__baseDatabaseData = buildSource();
      battler.__baseSkills = [];
      battler.__baseStates = [ uniqueSource, stackableSource ];
      // these represent the already-tracked passive states re-entering the pipeline via
      // allStates()- they flow through isEquipItem() checks too, so they need the same shape.
      battler.__statesById = { 1: buildSource({ id: 1 }), 2: buildSource({ id: 2 }) };

      // Act
      battler.refreshPassiveStates();

      // Assert
      expect(battler.getPassiveStateIds()).toEqual([ 1, 2, 2 ]);
      expect(battler.onBattlerDataChange).toHaveBeenCalled();
      // the stackable source itself now qualifies for the capable-sources cache.
      expect(battler.passiveCapableSources()).toContain(stackableSource);
    });

    it('withholds the data-change notification when the caller defers it', () =>
    {
      // Arrange
      const battler = buildBattler();
      const stackableSource = buildSource({ passiveStateIds: [ 1 ] });
      battler.__baseDatabaseData = buildSource();
      battler.__baseSkills = [];
      battler.__baseStates = [ stackableSource ];
      battler.__statesById = { 1: buildSource({ id: 1 }) };

      // Act
      battler.refreshPassiveStates(true);

      // Assert
      // the passives are still committed- only the trailing notification is skipped, because the
      // caller has its own follow-up coming and the note-regex cascade behind it is expensive
      // enough to be worth firing exactly once.
      expect(battler.getPassiveStateIds()).toEqual([ 1 ]);
      expect(battler.onBattlerDataChange).not.toHaveBeenCalled();
    });
  });

  describe('isPassiveState', () =>
  {
    it('is true for a tracked passive state id', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateId(7);

      // Act & Assert
      expect(battler.isPassiveState(7)).toBe(true);
    });

    it('is false for an untracked state id', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isPassiveState(999)).toBe(false);
    });
  });

  describe('allStates (extended)', () =>
  {
    it('appends passive states after the base states', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.__baseStates = [ { id: 1, name: 'Base' } ];
      battler.__statesById = { 2: { id: 2, name: 'Passive' } };
      battler.addPassiveStateId(2);

      // Act
      const result = battler.allStates();

      // Assert
      expect(result).toEqual([ { id: 1, name: 'Base' }, { id: 2, name: 'Passive' } ]);
    });
  });

  describe('allStateIds (extended)', () =>
  {
    it('appends passive state ids after the base state ids', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.__baseStateIds = [ 1 ];
      battler.addPassiveStateId(2);

      // Act
      const result = battler.allStateIds();

      // Assert
      expect(result).toEqual([ 1, 2 ]);
    });
  });

  describe('getPurgeableStates', () =>
  {
    it('excludes passive-granted states from the purgeable pool', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.__baseStates = [ { id: 1, name: 'Normal' } ];
      battler.__statesById = { 2: { id: 2, name: 'Passive' } };
      battler.addPassiveStateId(2);

      // Act
      const result = battler.getPurgeableStates();

      // Assert
      expect(result).toEqual([ { id: 1, name: 'Normal' } ]);
    });
  });

  describe('isStateAddable (extended)', () =>
  {
    it('is false for a passive state id, without consulting the base implementation', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateId(1);

      // Act & Assert
      expect(battler.isStateAddable(1)).toBe(false);
    });

    it('delegates to the base implementation for a non-passive state id', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isStateAddable(999)).toBe(true);
    });
  });

  describe('onStateAdded (extended)', () =>
  {
    it('performs the base logic and refreshes passive states', () =>
    {
      // Arrange
      const battler = buildBattler();
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.onStateAdded(5);

      // Assert
      expect(battler.__onStateAddedCalls).toEqual([ 5 ]);
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('removeState (extended)', () =>
  {
    it('skips removal entirely for a passive state id', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.addPassiveStateId(1);

      // Act
      battler.removeState(1);

      // Assert
      expect(battler.__removeStateCalls ?? []).toEqual([]);
    });

    it('delegates to the base implementation for a non-passive state id', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.removeState(999);

      // Assert
      expect(battler.__removeStateCalls).toEqual([ 999 ]);
    });
  });

  describe('onStateRemoval (extended)', () =>
  {
    it('performs the base logic and refreshes passive states', () =>
    {
      // Arrange
      const battler = buildBattler();
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      battler.onStateRemoval(5);

      // Assert
      expect(battler.__onStateRemovalCalls).toEqual([ 5 ]);
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/core/objects/game-battler.test.js
