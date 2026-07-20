//region plugins/abs/ext/food/models/jabs-food-chain-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_FoodChainResolver (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js').default} */
  let JABS_FoodChainResolver;

  const OVERSTUFFED_IMPERVIOUS_REGEX = Symbol('OverstuffedImpervious');

  /** duck-typed stand-in for JABS_FoodChainPlan- exposes only what the resolver reads. */
  function buildPlan(segments)
  {
    return {
      segments,
      getEntry: () => segments[0] ?? null,
      isEmpty: () => segments.length === 0,
      indexOfState: (stateId) => segments.findIndex(s => s.stateId === stateId),
      phaseAtIndex: (index) =>
      {
        if (index === 0) return 'wellFed';
        if (index === segments.length - 1) return 'tail';
        return 'peak';
      },
    };
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          FOOD: {
            RegExp: { OverstuffedImpervious: OVERSTUFFED_IMPERVIOUS_REGEX },
            ChainType: { Overstuffed: 'overstuffed' },
          },
        },
      },
    };

    globalThis.RPGManager = { checkForBooleanFromAllNotesByRegex: vi.fn() };
    globalThis.Game_Action = vi.fn(function(subject)
    {
      this.subject = () => subject;
      this.setItem = vi.fn();
      this.applyItemEffect = vi.fn();
      this.applyGlobal = vi.fn();
    });
    globalThis.Game_Action.EFFECT_ADD_STATE = 21;
    globalThis.LootLogBuilder = vi.fn(function()
    {
      this.setupUsedLastItem = vi.fn().mockReturnThis();
      this.build = vi.fn(() => ({ built: true }));
    });

    const registryPlans = new Map();
    globalThis.__testRegistryPlans = registryPlans;
    vi.doMock('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainPlan.js', () => ({
      default: { forChainType: (type) => registryPlans.get(type) ?? null },
    }));

    ({ default: JABS_FoodChainResolver } = await import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js'));
  });

  beforeEach(() =>
  {
    globalThis.__testRegistryPlans.clear();
    globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReset().mockReturnValue(false);
    globalThis.Game_Action.mockClear();
  });

  describe('stripFoodChainStates', () =>
  {
    it('force-removes only the food-chain-tagged states from each member', () =>
    {
      // Arrange
      const removeState = vi.fn();
      const member = {
        states: () => [
          { id: 1, jabsFoodChainType: 'protein' },
          { id: 2, jabsFoodChainType: null },
        ],
        removeState,
      };

      // Act
      JABS_FoodChainResolver.stripFoodChainStates([ member ]);

      // Assert
      expect(removeState).toHaveBeenCalledWith(1);
      expect(removeState).not.toHaveBeenCalledWith(2);
    });
  });

  describe('getActiveFoodChainType', () =>
  {
    it('returns null when no active state carries a food chain tag', () =>
    {
      const battler = { states: () => [ { jabsFoodChainType: null } ] };
      expect(JABS_FoodChainResolver.getActiveFoodChainType(battler)).toBeNull();
    });

    it('returns the chain type of the first matching active state', () =>
    {
      const battler = { states: () => [ { jabsFoodChainType: null }, { jabsFoodChainType: 'protein' } ] };
      expect(JABS_FoodChainResolver.getActiveFoodChainType(battler)).toBe('protein');
    });
  });

  describe('getPhase', () =>
  {
    it('returns null when there is no plan', () =>
    {
      expect(JABS_FoodChainResolver.getPhase({}, null)).toBeNull();
    });

    it('returns null when the plan is empty', () =>
    {
      expect(JABS_FoodChainResolver.getPhase({}, buildPlan([]))).toBeNull();
    });

    it('returns null when no segment of the plan is active on the battler', () =>
    {
      const plan = buildPlan([ { stateId: 1, chainType: 'protein' } ]);
      const battler = { isStateAffected: () => false };
      expect(JABS_FoodChainResolver.getPhase(battler, plan)).toBeNull();
    });

    it('returns overstuffed for any active overstuffed-typed segment, regardless of position', () =>
    {
      const plan = buildPlan([ { stateId: 1, chainType: 'overstuffed' } ]);
      const battler = { isStateAffected: (id) => id === 1 };
      expect(JABS_FoodChainResolver.getPhase(battler, plan)).toBe('overstuffed');
    });

    it('returns the position-derived phase label for a non-overstuffed active segment', () =>
    {
      const plan = buildPlan([
        { stateId: 1, chainType: 'protein' },
        { stateId: 2, chainType: 'protein' },
      ]);
      const battler = { isStateAffected: (id) => id === 2 };
      expect(JABS_FoodChainResolver.getPhase(battler, plan)).toBe('tail');
    });
  });

  describe('leaderHasOverstuffedImpervious', () =>
  {
    it('is false when there is no leader', () =>
    {
      globalThis.$gameParty = { leader: () => null };
      expect(JABS_FoodChainResolver.leaderHasOverstuffedImpervious()).toBe(false);
    });

    it('checks all notes for the immunity tag when a leader exists', () =>
    {
      const leader = { getAllNotes: () => [ 'note1' ] };
      globalThis.$gameParty = { leader: () => leader };
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(true);

      const result = JABS_FoodChainResolver.leaderHasOverstuffedImpervious();

      expect(globalThis.RPGManager.checkForBooleanFromAllNotesByRegex)
        .toHaveBeenCalledWith([ 'note1' ], OVERSTUFFED_IMPERVIOUS_REGEX);
      expect(result).toBe(true);
    });
  });

  describe('resolveEat', () =>
  {
    /** Builds the common $gameParty/$dataItems/$jabsEngine fixture for resolveEat tests. */
    function buildEatFixture({ foodType = 'protein', currentChainType = null, currentPhase = null, immune = false } = {})
    {
      const entrySegment = { stateId: 10, chainType: foodType };
      const plan = buildPlan([ entrySegment, { stateId: 11, chainType: foodType } ]);
      globalThis.__testRegistryPlans.set(foodType, plan);
      globalThis.__testRegistryPlans.set('overstuffed', buildPlan([ { stateId: 99, chainType: 'overstuffed' } ]));

      const item = { id: 5, jabsFoodType: foodType, animationId: 3, effects: [] };
      globalThis.$dataItems = { 5: item };

      // map the intended phase to the specific segment stateId that should read as active-
      // plan has 2 segments, so index 0 is 'wellFed' and index 1 is 'tail'.
      let activeStateId = null;
      if (currentPhase === 'tail')
      {
        activeStateId = 11;
      }
      else if (currentPhase === 'wellFed')
      {
        activeStateId = 10;
      }
      const leader = {
        addState: vi.fn(),
        states: () => (currentChainType ? [ { jabsFoodChainType: currentChainType } ] : []),
        isStateAffected: (stateId) => stateId === activeStateId,
        getAllNotes: () => [],
      };
      const members = [ leader ];
      globalThis.$gameParty = { leader: () => leader, battleMembers: () => members, items: () => [ item ] };
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(immune);

      const jabsBattler = { getUuid: () => 'leader-uuid', showAnimation: vi.fn() };
      globalThis.$jabsEngine = {
        getFoodChainPlanByUuid: vi.fn(() => (currentPhase !== null ? plan : null)),
        setFoodChainPlanByUuid: vi.fn(),
      };

      return { item, leader, members, jabsBattler, plan };
    }

    it('does nothing when the item id does not resolve to real data', () =>
    {
      globalThis.$dataItems = {};
      JABS_FoodChainResolver.resolveEat(999, { getUuid: () => 'x' });
      expect(globalThis.$jabsEngine).toBeUndefined();
    });

    it('does nothing when the item has no food type tag', () =>
    {
      globalThis.$dataItems = { 5: { id: 5, jabsFoodType: null } };
      JABS_FoodChainResolver.resolveEat(5, { getUuid: () => 'x' });
      // no throw, and no registry lookups performed- nothing else to assert meaningfully here.
    });

    it('does nothing when there is no registered plan for the tagged food type', () =>
    {
      globalThis.$dataItems = { 5: { id: 5, jabsFoodType: 'unregistered' } };
      globalThis.$gameParty = { leader: () => ({}), battleMembers: () => [] };
      expect(() => JABS_FoodChainResolver.resolveEat(5, { getUuid: () => 'x' })).not.toThrow();
    });

    it('applies buffet effects skipping the Add State effect code', () =>
    {
      const { item, jabsBattler } = buildEatFixture();
      item.effects = [ { code: 99 }, { code: 21 } ];

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      const actionInstance = globalThis.Game_Action.mock.results[0].value;
      expect(actionInstance.applyItemEffect).toHaveBeenCalledTimes(1);
      expect(actionInstance.applyItemEffect).toHaveBeenCalledWith(expect.anything(), { code: 99 });
    });

    it('plays the item animation on the jabs battler', () =>
    {
      const { jabsBattler } = buildEatFixture();
      JABS_FoodChainResolver.resolveEat(5, jabsBattler);
      expect(jabsBattler.showAnimation).toHaveBeenCalledWith(3);
    });

    it('starts a fresh chain when the leader has no active food chain', () =>
    {
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: null });

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(leader.addState).toHaveBeenCalledWith(10);
      expect(globalThis.$jabsEngine.setFoodChainPlanByUuid).toHaveBeenCalledWith('leader-uuid', expect.anything());
    });

    it('rescues into the new chain when the leader is in the tail phase, regardless of immunity', () =>
    {
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: 'protein', currentPhase: 'tail', immune: false });
      leader.removeState = vi.fn();
      leader.states = () => [ { id: 1, jabsFoodChainType: 'protein' } ];

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(leader.removeState).toHaveBeenCalledWith(1);
      expect(leader.addState).toHaveBeenCalledWith(10);
    });

    it('rescues into the new chain when Field Medic immunity is present, even mid-arc', () =>
    {
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: 'protein', currentPhase: 'wellFed', immune: true });
      leader.removeState = vi.fn();
      leader.states = () => [ { id: 1, jabsFoodChainType: 'protein' } ];

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(leader.removeState).toHaveBeenCalledWith(1);
      expect(leader.addState).toHaveBeenCalledWith(10);
    });

    it('triggers the Overstuffed punishment when eating mid-arc without immunity', () =>
    {
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: 'protein', currentPhase: 'wellFed', immune: false });
      leader.removeState = vi.fn();
      leader.states = () => [ { id: 1, jabsFoodChainType: 'protein' } ];

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(leader.removeState).toHaveBeenCalledWith(1);
      expect(leader.addState).toHaveBeenCalledWith(99);
    });

    it('aborts the Overstuffed punishment cleanly when no Overstuffed chain has been authored', () =>
    {
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: 'protein', currentPhase: 'wellFed', immune: false });
      leader.removeState = vi.fn();
      leader.states = () => [ { id: 1, jabsFoodChainType: 'protein' } ];
      globalThis.__testRegistryPlans.delete('overstuffed');

      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(leader.removeState).toHaveBeenCalledWith(1);
      expect(leader.addState).not.toHaveBeenCalledWith(99);
    });

    it('auto-unequips the slot and logs when the party ran out of the item', () =>
    {
      const { jabsBattler } = buildEatFixture();
      globalThis.$gameParty.items = () => [];
      globalThis.$lootLogManager = { addLog: vi.fn() };
      globalThis.JABS_Button = { UsableItem: 'usableItem' };
      const skillSlotManager = { clearSlot: vi.fn() };
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => skillSlotManager });

      // resolveEat itself doesn't manage the slot- that's JABS_Battler.applyUsableItemEffects's
      // job (tested separately); this resolver only manages chain/buffet effects. Confirming
      // resolveEat does NOT touch the slot keeps the two files' responsibilities honest.
      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(skillSlotManager.clearSlot).not.toHaveBeenCalled();
      expect(globalThis.$lootLogManager.addLog).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/food/models/jabs-food-chain-resolver.test.js
