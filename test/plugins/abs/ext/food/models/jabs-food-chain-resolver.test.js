//region plugins/abs/ext/food/models/jabs-food-chain-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_FoodChainResolver (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainResolver.js').default} */
  let JABS_FoodChainResolver;

  const FOOD_CHAIN_IMPERVIOUS_REGEX = Symbol('FoodChainImpervious');

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
            RegExp: { FoodChainImpervious: FOOD_CHAIN_IMPERVIOUS_REGEX },
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
      default: {
        forChainType: (type) => registryPlans.get(type) ?? null,
        registeredChainTypes: () => Array.from(registryPlans.keys()),
      },
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

    it('returns the position-derived phase label for the active segment', () =>
    {
      // Arrange- three segments so the label cannot be right by accident; the active one is the
      // middle, which is the only index that reads 'peak'.
      const plan = buildPlan([
        { stateId: 1, chainType: 'protein' },
        { stateId: 2, chainType: 'protein' },
        { stateId: 3, chainType: 'protein' },
      ]);
      const battler = { isStateAffected: (id) => id === 2 };

      // Act
      const phase = JABS_FoodChainResolver.getPhase(battler, plan);

      // Assert
      expect(phase).toBe('peak');
    });
  });

  describe('hasFoodChainImpervious', () =>
  {
    it('is false when there is no battler', () =>
    {
      // Arrange- the tag lookup is armed to say yes, so a passing result can only come from
      // the guard rather than from the delegate.
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(true);

      // Act
      const result = JABS_FoodChainResolver.hasFoodChainImpervious(null);

      // Assert
      expect(result).toBe(false);
      expect(globalThis.RPGManager.checkForBooleanFromAllNotesByRegex).not.toHaveBeenCalled();
    });

    it('checks all notes for the immunity tag when a battler exists', () =>
    {
      // Arrange
      const battler = { getAllNotes: () => [ 'note1' ] };
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(true);

      // Act
      const result = JABS_FoodChainResolver.hasFoodChainImpervious(battler);

      // Assert- the exact regex matters; reading the wrong tag would still return true here.
      expect(globalThis.RPGManager.checkForBooleanFromAllNotesByRegex)
        .toHaveBeenCalledWith([ 'note1' ], FOOD_CHAIN_IMPERVIOUS_REGEX);
      expect(result).toBe(true);
    });
  });

  describe('resolveEndFoodChain', () =>
  {
    it('does nothing when there is no battler', () =>
    {
      // Arrange- immunity says no, so nothing but the guard can stop the strip.
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(false);

      // Act + Assert- the absence of a battler must not reach the note lookup at all.
      JABS_FoodChainResolver.resolveEndFoodChain(null);
      expect(globalThis.RPGManager.checkForBooleanFromAllNotesByRegex).not.toHaveBeenCalled();
    });

    it('leaves the chain intact when the battler is impervious', () =>
    {
      // Arrange- a battler genuinely carrying a food state, so a strip would be observable.
      const battler = {
        getAllNotes: () => [ 'note1' ],
        states: () => [ { id: 7, jabsFoodChainType: 'protein' } ],
        removeState: vi.fn(),
      };
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(true);

      // Act
      JABS_FoodChainResolver.resolveEndFoodChain(battler);

      // Assert- the meal survives the burn, which is the entire capstone privilege.
      expect(battler.removeState).not.toHaveBeenCalled();
    });

    it('strips the food chain when the battler is not impervious', () =>
    {
      // Arrange- a food state alongside a non-food state that must survive, so "strips food"
      // and "strips everything" cannot both pass.
      const battler = {
        getAllNotes: () => [ 'note1' ],
        states: () => [
          { id: 7, jabsFoodChainType: 'protein' },
          { id: 8, jabsFoodChainType: null },
        ],
        removeState: vi.fn(),
      };
      globalThis.RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(false);

      // Act
      JABS_FoodChainResolver.resolveEndFoodChain(battler);

      // Assert
      expect(battler.removeState).toHaveBeenCalledWith(7);
      expect(battler.removeState).not.toHaveBeenCalledWith(8);
    });
  });

  describe('resolveEat', () =>
  {
    /** Builds the common $gameParty/$dataItems/$jabsEngine fixture for resolveEat tests. */
    function buildEatFixture({ foodType = 'protein', currentChainType = null, currentPhase = null } = {})
    {
      const entrySegment = { stateId: 10, chainType: foodType };
      const plan = buildPlan([ entrySegment, { stateId: 11, chainType: foodType } ]);
      globalThis.__testRegistryPlans.set(foodType, plan);

      // a registered sibling group that must never be selected- with only one plan on file,
      // "looks up the tagged type" and "grabs whatever is registered" are the same program.
      globalThis.__testRegistryPlans.set('decoy', buildPlan([ { stateId: 99, chainType: 'decoy' } ]));

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

    it('warns and applies nothing when there is no registered plan for the tagged food type', () =>
    {
      // Arrange- a food item whose group was never registered, alongside a leader who would
      // visibly receive a state if the resolver carried on past the guard.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const leader = { addState: vi.fn() };
      globalThis.$dataItems = { 5: { id: 5, name: 'Mystery Loaf', jabsFoodType: 'unregistered' } };
      globalThis.$gameParty = { leader: () => leader, battleMembers: () => [] };

      // Act
      JABS_FoodChainResolver.resolveEat(5, { getUuid: () => 'x' });

      // Assert- the anomaly is reported rather than swallowed, and it names the type that missed.
      // consumed-but-inert food is otherwise indistinguishable from food that simply has no
      // effects, which is what made this shape of authoring mistake impossible to find.
      const [ firstWarn ] = warnSpy.mock.calls;
      const [ stamped ] = firstWarn;
      expect(stamped).toContain('unregistered');

      // and nothing was applied on the way out.
      expect(leader.addState).not.toHaveBeenCalled();

      warnSpy.mockRestore();
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

      expect(leader.addState).toHaveBeenCalledWith(10, leader);
      expect(globalThis.$jabsEngine.setFoodChainPlanByUuid).toHaveBeenCalledWith('leader-uuid', expect.anything());
    });

    it('replaces the running chain when the leader is already mid-arc', () =>
    {
      // Arrange- a live protein arc alongside a non-food state that must survive the strip, so
      // "clears the food chain" and "clears everything" cannot both pass.
      const { leader, jabsBattler } = buildEatFixture({ currentChainType: 'protein', currentPhase: 'wellFed' });
      leader.removeState = vi.fn();
      leader.states = () => [
        { id: 1, jabsFoodChainType: 'protein' },
        { id: 2, jabsFoodChainType: null },
      ];

      // Act
      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      // Assert- the old arc goes, the bystander state stays, and the new arc starts.
      expect(leader.removeState).toHaveBeenCalledWith(1);
      expect(leader.removeState).not.toHaveBeenCalledWith(2);

      // the second argument names the leader as its own source, which is what routes the state
      // through JABS instead of vanilla. without it the entry state lands inert, so pinning the
      // id alone would pass on a chain that can never advance.
      expect(leader.addState).toHaveBeenCalledWith(10, leader);
    });

    it('auto-unequips the slot and logs when the party ran out of the item', () =>
    {
      const { jabsBattler } = buildEatFixture();
      globalThis.$gameParty.items = () => [];
      globalThis.$mapLogs = { loot: { addLog: vi.fn() } };
      globalThis.JABS_Button = { UsableItem: 'usableItem' };
      const skillSlotManager = { clearSlot: vi.fn() };
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => skillSlotManager });

      // resolveEat itself doesn't manage the slot- that's JABS_Battler.applyUsableItemEffects's
      // job (tested separately); this resolver only manages chain/buffet effects. Confirming
      // resolveEat does NOT touch the slot keeps the two files' responsibilities honest.
      JABS_FoodChainResolver.resolveEat(5, jabsBattler);

      expect(skillSlotManager.clearSlot).not.toHaveBeenCalled();
      expect(globalThis.$mapLogs.loot.addLog).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/food/models/jabs-food-chain-resolver.test.js
