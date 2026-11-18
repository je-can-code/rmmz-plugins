//region plugins/abs/core/models/jabs-ai.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_AI.js is a genuine ES `class` (the base class JABS_EnemyAI/JABS_AllyAI extend). Its
 * sibling imports (JABS_EnemyAI, JABS_Battler, JABS_BattleMemory, JABS_AiManager) are all
 * referenced for JSDoc typing only- never as values at runtime- so they get trivial empty stubs
 * per the unit-tier convention. `Game_Action` and `Math.randomInt` are bare globals this file
 * reads, stubbed directly.
 */
describe('JABS_AI (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_AI.js').default} */
  let JABS_AI;
  let GameActionMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattleMemory.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: class {} }));

    ({ default: JABS_AI } = await import('../../../../../src/plugins/abs/core/models/JABS_AI.js'));
  });

  beforeEach(() =>
  {
    globalThis.Math.randomInt = vi.fn(() => 0);
    globalThis.$jabsEngine = { getJabsStateByUuidAndStateId: vi.fn(() => null) };

    // Game_Action is a real, stateful test double- constructed fresh per call, behavior driven
    // entirely by the item/skill object passed to setItemObject/setSkill.
    GameActionMock = vi.fn(function(battler)
    {
      this.battler = battler;
      this._item = null;
      this.setItemObject = vi.fn((item) => { this._item = item; });
      this.setSkill = vi.fn((skillId) => { this._item = { skillId }; });
      this.isForAliveFriend = vi.fn(() => this._item?.isForAliveFriend ?? false);
      this.isForFriend = vi.fn(() => this._item?.isForFriend ?? true);
      this.isForOpponent = vi.fn(() => this._item?.isForOpponent ?? true);
      this.isRecover = vi.fn(() => this._item?.isRecover ?? false);
      this.isHpEffect = vi.fn(() => this._item?.isHpEffect ?? false);
      this.isForUser = vi.fn(() => this._item?.isForUser ?? false);
      this.isForOne = vi.fn(() => this._item?.isForOne ?? false);
      this.isForAll = vi.fn(() => this._item?.isForAll ?? false);
      this.isForDeadFriend = vi.fn(() => this._item?.isForDeadFriend ?? false);
      this.makeDamageValue = vi.fn(() => this._item?.healAmount ?? 0);
      this.calcElementRate = vi.fn(() => this._item?.elementRate ?? 1);
    });
    globalThis.Game_Action = GameActionMock;
  });

  /**
   * Builds a fake battler test double with sane defaults.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      hasComboReady: () => false,
      getLastUsedSlot: () => 'combat-1',
      getComboNextActionId: () => 0,
      canExecuteSkill: () => true,
      isAiComboHumanizationTimingReady: () => true,
      getSkill: () => ({ effects: [] }),
      getBattler: () => ({}),
      getAllNearbyAllies: () => [],
      getEnemyBasicAttack: () => 999,
      setAllyTarget: vi.fn(),
      getUuid: () => 'battler-uuid',
      ...overrides,
    };
  }

  describe('decideAction()', () =>
  {
    it('returns an empty stub', () =>
    {
      const ai = new JABS_AI();

      expect(ai.decideAction(buildBattler(), buildBattler(), [])).toEqual([]);
    });
  });

  describe('shouldFollowWithCombo()', () =>
  {
    it('returns false when no combo is ready', () =>
    {
      // Arrange: every later gate is deliberately left open. with the battler's default of nothing
      // queued in the slot, the "nothing queued" guard below answered false for this case too, so
      // this one could have been deleted without a single assertion noticing.
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => false,
        getComboNextActionId: () => 5,
        canExecuteSkill: () => true,
        isAiComboHumanizationTimingReady: () => true,
      });

      // Act
      const shouldCombo = ai.shouldFollowWithCombo(user);

      // Assert
      expect(shouldCombo).toEqual(false);
    });

    it('returns false when nothing is queued for the slot', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => true, getComboNextActionId: () => 0 });

      expect(ai.shouldFollowWithCombo(user)).toEqual(false);
    });

    it('returns false when the battler cannot execute the combo skill', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => true, getComboNextActionId: () => 5, canExecuteSkill: () => false });

      expect(ai.shouldFollowWithCombo(user)).toEqual(false);
    });

    it('returns false when humanized combo timing is not ready', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true, getComboNextActionId: () => 5, canExecuteSkill: () => true,
        isAiComboHumanizationTimingReady: () => false,
      });

      expect(ai.shouldFollowWithCombo(user)).toEqual(false);
    });

    it('returns true when every gate passes', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => true, getComboNextActionId: () => 5 });

      expect(ai.shouldFollowWithCombo(user)).toEqual(true);
    });
  });

  describe('canFollowWithCombo()', () =>
  {
    it('returns false when no combo is ready', () =>
    {
      // Arrange: every later gate is left open, so only this guard can answer.
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => false, getComboNextActionId: () => 5 });

      // Act
      const canFollow = ai.canFollowWithCombo(user);

      // Assert
      expect(canFollow).toEqual(false);
    });

    it('returns false when nothing is queued for the last used slot', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => true, getComboNextActionId: () => 0 });

      // Act
      const canFollow = ai.canFollowWithCombo(user);

      // Assert
      expect(canFollow).toEqual(false);
    });

    it('returns false when the battler cannot execute the queued skill', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true,
        getComboNextActionId: () => 5,
        canExecuteSkill: () => false,
      });

      // Act
      const canFollow = ai.canFollowWithCombo(user);

      // Assert
      expect(canFollow).toEqual(false);
    });

    it('returns true with a performable follow-up even while pacing is still running', () =>
    {
      // Arrange: pacing is not this question's business.
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true,
        getComboNextActionId: () => 5,
        isAiComboHumanizationTimingReady: () => false,
      });

      // Act
      const canFollow = ai.canFollowWithCombo(user);

      // Assert
      expect(canFollow).toEqual(true);
    });

    it('reads the queued skill from the slot the battler last used', () =>
    {
      // Arrange: the skill is only queued on one slot, and it is not the last one used.
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true,
        getLastUsedSlot: () => 'combat-2',
        getComboNextActionId: slot => (slot === 'combat-1' ? 5 : 0),
      });

      // Act
      const canFollow = ai.canFollowWithCombo(user);

      // Assert
      expect(canFollow).toEqual(false);
    });
  });

  describe('shouldHoldForCombo()', () =>
  {
    it('does not hold when there is no performable follow-up to wait for', () =>
    {
      // Arrange: pacing is deliberately still running, so only the missing follow-up can answer.
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => false, isAiComboHumanizationTimingReady: () => false });

      // Act
      const shouldHold = ai.shouldHoldForCombo(user);

      // Assert
      expect(shouldHold).toEqual(false);
    });

    it('holds while a performable follow-up is still pacing', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true,
        getComboNextActionId: () => 5,
        isAiComboHumanizationTimingReady: () => false,
      });

      // Act
      const shouldHold = ai.shouldHoldForCombo(user);

      // Assert
      expect(shouldHold).toEqual(true);
    });

    it('stops holding the moment the pacing has elapsed', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler({
        hasComboReady: () => true,
        getComboNextActionId: () => 5,
        isAiComboHumanizationTimingReady: () => true,
      });

      // Act
      const shouldHold = ai.shouldHoldForCombo(user);

      // Assert
      expect(shouldHold).toEqual(false);
    });
  });

  describe('followWithCombo()', () =>
  {
    it('returns the combo skill id from the last used slot', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ getComboNextActionId: () => 7 });

      expect(ai.followWithCombo(user)).toEqual(7);
    });
  });

  describe('isSkillIdValid()', () =>
  {
    it('returns false for a falsy skill id', () =>
    {
      const ai = new JABS_AI();

      expect(ai.isSkillIdValid(0)).toEqual(false);
    });

    it('returns false for an array of skill ids', () =>
    {
      const ai = new JABS_AI();

      expect(ai.isSkillIdValid([ 1, 2 ])).toEqual(false);
    });

    it('returns true for a single truthy skill id', () =>
    {
      const ai = new JABS_AI();

      expect(ai.isSkillIdValid(5)).toEqual(true);
    });
  });

  describe('filterUncastableSkills()', () =>
  {
    it('returns empty when there are no skills to filter', () =>
    {
      const ai = new JABS_AI();

      expect(ai.filterUncastableSkills(buildBattler(), [])).toEqual([]);
    });

    it('filters to only skills the user can currently execute', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ canExecuteSkill: (id) => id === 1 });

      expect(ai.filterUncastableSkills(user, [ 1, 2 ])).toEqual([ 1 ]);
    });
  });

  describe('determineStrongestSkill()', () =>
  {
    it('picks the skill with the higher crit damage over base damage', () =>
    {
      // Arrange: skill 1 must win purely on its crit, so its base damage is the *weaker* of the
      // two. Previously it led on both numbers, which meant the base-damage fallback below would
      // have crowned it anyway and the crit comparison could have been deleted untouched.
      const ai = new JABS_AI();
      const user = buildBattler({
        getSkill: (id) => ({ id, healAmount: id === 1 ? 10 : 5, elementRate: 1 }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.makeDamageValue = (_target, isCrit) =>
        {
          if (this._item.id === 1) return isCrit ? 50 : 5;
          return isCrit ? 20 : 15;
        };
      });

      // Act
      const strongestSkillId = ai.determineStrongestSkill([ 2, 1 ], user, buildBattler());

      // Assert
      expect(strongestSkillId).toEqual(1);
    });

    it('falls back to base damage comparison when crit does not exceed the running best', () =>
    {
      // skill 1 (processed first) wins the crit-damage comparison (10 > running-best 0), setting
      // highestDamage=5/biggestCritDamage=10. Skill 2's crit (8) does NOT beat that, so it must
      // fall through to the base-damage-only branch- and its base (15) beats skill 1's base (5).
      const ai = new JABS_AI();
      const user = buildBattler({
        getSkill: (id) => ({ id }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.makeDamageValue = (_target, isCrit) =>
        {
          if (this._item.id === 1) return isCrit ? 10 : 5;
          return isCrit ? 8 : 15;
        };
      });

      expect(ai.determineStrongestSkill([ 1, 2 ], user, buildBattler())).toEqual(2);
    });

    it('returns 0 when no skill improves on the running best', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ getSkill: (id) => ({ id }) });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.makeDamageValue = () => 0;
      });

      expect(ai.determineStrongestSkill([ 1, 2 ], user, buildBattler())).toEqual(0);
    });
  });

  describe('decideFromNoneToManySkills()', () =>
  {
    it('returns the value as-is when it is already a single integer', () =>
    {
      const ai = new JABS_AI();

      expect(ai.decideFromNoneToManySkills(buildBattler(), 5)).toEqual(5);
    });

    it('picks a random entry from a non-empty array', () =>
    {
      const ai = new JABS_AI();
      globalThis.Math.randomInt.mockReturnValue(1);

      expect(ai.decideFromNoneToManySkills(buildBattler(), [ 10, 20 ])).toEqual(20);
    });

    it('falls back to the basic attack for an empty array', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideFromNoneToManySkills(user, [])).toEqual(77);
    });

    it('falls back to the basic attack for null', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ getEnemyBasicAttack: () => 77 });

      expect(ai.decideFromNoneToManySkills(user, null)).toEqual(77);
    });
  });

  describe('filterElementallyIneffectiveSkills()', () =>
  {
    it('returns the list unfiltered when it has one or fewer entries', () =>
    {
      // Arrange: the lone skill is elementally *useless* against this target on purpose. The
      // filter would drop it, and leaving a battler with nothing to cast is worse than casting
      // something resisted- so the count guard is what keeps a choice on the table. A skill with
      // a neutral rate survives the filter too, which is why the earlier fixture proved nothing.
      const ai = new JABS_AI();
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.calcElementRate = () => 0.5;
      });

      // Act
      const remaining = ai.filterElementallyIneffectiveSkills([ 1 ], buildBattler(), buildBattler());

      // Assert
      expect(remaining).toEqual([ 1 ]);
    });

    it('filters out skills with an elemental rate below 1', () =>
    {
      const ai = new JABS_AI();
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._skillId = null;
        this.setSkill = (id) => { this._skillId = id; };
        this.calcElementRate = () => (this._skillId === 1 ? 1.5 : 0.5);
      });

      expect(ai.filterElementallyIneffectiveSkills([ 1, 2 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
    });
  });

  describe('findMostElementallyEffectiveSkills()', () =>
  {
    it('keeps every skill tied at the best rate, in order, and drops the rest', () =>
    {
      // Arrange: two skills share the best rate, with a neutral skill before them and a resisted one between, so
      // keeping only the first best, keeping everything, or keeping everything at least neutral all answer wrongly.
      const ai = new JABS_AI();
      const ratesBySkill = { 1: 1, 2: 3, 3: 0.5, 4: 3 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._skillId = null;
        this.setSkill = (id) => { this._skillId = id; };
        this.calcElementRate = () => ratesBySkill[this._skillId];
      });

      // Act
      const best = ai.findMostElementallyEffectiveSkills([ 1, 2, 3, 4 ], buildBattler(), buildBattler());

      // Assert
      expect(best).toEqual([ 2, 4 ]);
    });
  });

  describe('elementRateAgainst()', () =>
  {
    it('casts the skill from the user at the target and hands back the engine rate', () =>
    {
      // Arrange: the user and the target carry different battlers, and only the right skill cast the right way
      // round reads the weakness; anything else reads neutral.
      const ai = new JABS_AI();
      const userBattler = { side: 'user' };
      const targetBattler = { side: 'target' };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._skillId = null;
        this.setSkill = (id) => { this._skillId = id; };
        this.calcElementRate = against =>
        {
          const isRightWayRound = this.battler === userBattler && against === targetBattler;
          return isRightWayRound && this._skillId === 12 ? 2.5 : 1;
        };
      });
      const user = buildBattler({ getBattler: () => userBattler });
      const target = buildBattler({ getBattler: () => targetBattler });

      // Act
      const rate = ai.elementRateAgainst(12, user, target);

      // Assert
      expect(rate).toBe(2.5);
    });
  });

  describe('filterForExecutorSkills()', () =>
  {
    it('judges effectiveness by element, handing back exactly what that judgment picks', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler();
      const target = buildBattler();
      const elementalSpy = vi.spyOn(ai, 'findMostElementallyEffectiveSkills').mockReturnValue([ 7 ]);

      // Act
      const result = ai.filterForExecutorSkills([ 1, 7 ], user, target);

      // Assert
      expect(result).toEqual([ 7 ]);
      expect(elementalSpy).toHaveBeenCalledWith([ 1, 7 ], user, target);
    });
  });

  describe('filterFollowUpOnlySkills()', () =>
  {
    it('drops the skills saved for a follow-up and keeps the rest', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildBattler({ getSkill: skillId => ({ jabsAiFollowUpOnly: skillId === 1 }) });

      // Act
      const result = ai.filterFollowUpOnlySkills(user, [ 1, 2 ]);

      // Assert
      expect(result).toEqual([ 2 ]);
    });
  });

  describe('decideFollowUp()', () =>
  {
    /**
     * Builds a user whose skills follow up on the given state ids: skill 1 on 12, skill 2 on 9, skill 3 on nothing.
     * @returns {object}
     */
    function buildFollowUpUser()
    {
      const followUpStateIdsBySkill = {
        1: [ 12 ],
        2: [ 9 ],
        3: [],
      };
      return buildBattler({ getSkill: skillId => ({ jabsAiFollowUpStateIds: followUpStateIdsBySkill[skillId] }) });
    }

    it('finds the skill that follows up on a state the target carries', () =>
    {
      // Arrange- the target carries 4 and 9; only skill 2 names either of them.
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 4 }, { id: 9 } ] }) });

      // Act
      const result = ai.decideFollowUp(buildFollowUpUser(), target, [ 1, 2, 3 ]);

      // Assert
      expect(result).toBe(2);
    });

    it('finds nothing when no skill follows up on what the target carries', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 7 } ] }) });

      // Act
      const result = ai.decideFollowUp(buildFollowUpUser(), target, [ 1, 2, 3 ]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('decideInterrupt()', () =>
  {
    /**
     * Builds a user whose skills carry the given interrupt magnifiers, by skill id.
     * @param {Object<number, number>} magnifiersBySkill The magnifier each skill id carries.
     * @returns {object}
     */
    function buildInterruptUser(magnifiersBySkill)
    {
      return buildBattler({ getSkill: skillId => ({ jabsInterruptMagnifier: magnifiersBySkill[skillId] }) });
    }

    it('spends nothing on a cast that cannot be cut', () =>
    {
      // Arrange- a strong interrupt is on hand, so the target's rule is the only reason none is chosen.
      const ai = new JABS_AI();
      const user = buildInterruptUser({ 1: 200 });
      const target = buildBattler({ isInterruptible: () => false });

      // Act
      const result = ai.decideInterrupt(user, target, [ 1 ]);

      // Assert
      expect(result).toBe(0);
    });

    it('picks the largest magnifier, the first of a tie', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildInterruptUser({
        1: 0,
        2: 150,
        3: 200,
        4: 200,
      });
      const target = buildBattler({ isInterruptible: () => true });

      // Act
      const result = ai.decideInterrupt(user, target, [ 1, 2, 3, 4 ]);

      // Assert
      expect(result).toBe(3);
    });

    it('finds nothing when no skill can interrupt', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildInterruptUser({
        1: 0,
        2: 0,
      });
      const target = buildBattler({ isInterruptible: () => true });

      // Act
      const result = ai.decideInterrupt(user, target, [ 1, 2 ]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('decideStrip()', () =>
  {
    /**
     * Builds a user whose skill 1 removes state 4, skill 2 removes state 60 and skill 4 removes state 50, all at a full
     * rate, and whose skill 3 purges every buff it lands on.
     * @returns {object}
     */
    function buildStripUser()
    {
      const removedStateBySkill = {
        1: 4,
        2: 60,
        4: 50,
      };
      const purgeBySkill = { 3: [ 'positive', false, 99 ] };
      return buildBattler({
        getSkill: skillId => ({
          effects: [ { code: 22, dataId: removedStateBySkill[skillId], value1: 1 } ],
          jabsPurgeStatesParams: purgeBySkill[skillId] ?? null,
        }),
      });
    }

    it('reaches for a skill that purges buffs before naming any one of them', () =>
    {
      // Arrange- skill 2 could strip state 60 by name, but the purger takes everything, so it wins.
      const ai = new JABS_AI();
      const target = buildBattler({
        getBattler: () => ({
          states: () => [
            { id: 50, isNegativeType: () => false },
            { id: 60, isNegativeType: () => false },
          ],
        }),
      });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 1, 2, 3 ]);

      // Assert
      expect(result).toBe(3);
    });

    it('offers nothing to strip off a target with no buffs, purger or not', () =>
    {
      // Arrange- the purger is on hand, so only the missing buffs keep it from being chosen.
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 4, isNegativeType: () => true } ] }) });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 3, 1 ]);

      // Assert
      expect(result).toBe(0);
    });

    it('strips the first positive state a skill can remove', () =>
    {
      // Arrange- 4 is negative and removable, 50 is positive with no remover, 60 is positive and removable.
      const ai = new JABS_AI();
      const target = buildBattler({
        getBattler: () => ({
          states: () => [
            { id: 4, isNegativeType: () => true },
            { id: 50, isNegativeType: () => false },
            { id: 60, isNegativeType: () => false },
          ],
        }),
      });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 1, 2 ]);

      // Assert
      expect(result).toBe(2);
    });

    it('strips nothing when no skill on hand removes the buff the target carries', () =>
    {
      // Arrange- state 50 is a buff, but skill 1 only removes state 4 and no purger is on hand.
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 50, isNegativeType: () => false } ] }) });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 1 ]);

      // Assert
      expect(result).toBe(0);
    });

    it('strips nothing off a target carrying only what hurts it', () =>
    {
      // Arrange- skill 1 could remove state 4, but 4 is negative, so it is left alone.
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 4, isNegativeType: () => true } ] }) });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 1, 2 ]);

      // Assert
      expect(result).toBe(0);
    });

    it('passes over a purge aimed at its own side, which would land on its allies instead', () =>
    {
      // Arrange- skill 3 purges every buff and would come first, but it is aimed at the user's own side.
      const ai = new JABS_AI();
      const target = buildBattler({ getBattler: () => ({ states: () => [ { id: 60, isNegativeType: () => false } ] }) });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = skillId => { this.skillId = skillId; };
        this.isForOpponent = () => this.skillId !== 3;
      });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 3, 2 ]);

      // Assert
      expect(result).toBe(2);
    });

    it('passes over a remover aimed at its own side to the next buff one aimed at the target can strip', () =>
    {
      // Arrange- state 50 comes first, but only skill 4 removes it, and skill 4 is aimed at the user's own side.
      const ai = new JABS_AI();
      const target = buildBattler({
        getBattler: () => ({
          states: () => [
            { id: 50, isNegativeType: () => false },
            { id: 60, isNegativeType: () => false },
          ],
        }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = skillId => { this.skillId = skillId; };
        this.isForOpponent = () => this.skillId !== 4;
      });

      // Act
      const result = ai.decideStrip(buildStripUser(), target, [ 4, 2 ]);

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('findBuffPurger()', () =>
  {
    /**
     * Builds a user whose skills carry the given `<purgeStates>` parameters, by skill id; a missing entry has no tag.
     * @param {Object<number, Array>} purgeBySkill The purge parameters each skill id carries.
     * @returns {object}
     */
    function buildPurgeUser(purgeBySkill)
    {
      return buildBattler({ getSkill: skillId => ({ jabsPurgeStatesParams: purgeBySkill[skillId] ?? null }) });
    }

    it('finds the skill purging positive states, past one with no tag and one purging only negatives', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildPurgeUser({
        2: [ 'negative', false, 5 ],
        3: [ 'positive', false, 99 ],
      });

      // Act
      const result = ai.findBuffPurger(user, [ 1, 2, 3 ]);

      // Assert
      expect(result).toBe(3);
    });

    it('finds the skill purging every state', () =>
    {
      // Arrange
      const ai = new JABS_AI();
      const user = buildPurgeUser({
        1: [ 'negative' ],
        2: [ 'all' ],
      });

      // Act
      const result = ai.findBuffPurger(user, [ 1, 2 ]);

      // Assert
      expect(result).toBe(2);
    });

    it('finds nothing when no purge takes buffs off', () =>
    {
      // Arrange- a purge left at its default polarity strips only negatives.
      const ai = new JABS_AI();
      const user = buildPurgeUser({
        2: [ 'negative', false, 2 ],
        3: [],
      });

      // Act
      const result = ai.findBuffPurger(user, [ 1, 2, 3 ]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('decideCleansing()', () =>
  {
    it('returns 0 when there are no nearby allies', () =>
    {
      const ai = new JABS_AI();

      expect(ai.decideCleansing(buildBattler(), [])).toEqual(0);
    });

    it('returns 0 when the nearby ally has no active states', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ states: () => [] }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });

      expect(ai.decideCleansing(user, [])).toEqual(0);
    });

    it('returns 0 when no negative, cleansable state is found', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ states: () => [ { id: 1, isNegativeType: () => false } ] }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });

      expect(ai.decideCleansing(user, [])).toEqual(0);
    });

    it('returns the best cleansing skill id when a negative, cleansable state is found', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ states: () => [ { id: 5, isNegativeType: () => true } ] }) };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 22, dataId: 5, value1: 0.5 } ] }),
      });

      expect(ai.decideCleansing(user, [ 9 ])).toEqual(9);
    });

    it('never cleanses a positive state off an ally, even one a skill could remove', () =>
    {
      // Arrange- skill 9 removes state 5, so only the state's polarity keeps it from being chosen.
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ states: () => [ { id: 5, isNegativeType: () => false } ] }) };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 22, dataId: 5, value1: 0.5 } ] }),
      });

      // Act
      const result = ai.decideCleansing(user, [ 9 ]);

      // Assert
      expect(result).toEqual(0);
    });

    it('passes over a negative state nothing can remove to one it can', () =>
    {
      // Arrange- state 2 comes first and has no remover; state 5 behind it does.
      const ai = new JABS_AI();
      const ally = {
        getBattler: () => ({
          states: () => [
            { id: 2, isNegativeType: () => true },
            { id: 5, isNegativeType: () => true },
          ],
        }),
      };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 22, dataId: 5, value1: 0.5 } ] }),
      });

      // Act
      const result = ai.decideCleansing(user, [ 9 ]);

      // Assert
      expect(result).toEqual(9);
    });

    it('passes over a remover aimed at the opposition, which would land on the target instead', () =>
    {
      // Arrange- skill 8 removes state 5 more reliably than skill 9, but it is aimed at the opposition.
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ states: () => [ { id: 5, isNegativeType: () => true } ] }) };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: skillId => ({ effects: [ { code: 22, dataId: 5, value1: skillId === 8 ? 1 : 0.5 } ] }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = skillId => { this.skillId = skillId; };
        this.isForFriend = () => this.skillId !== 8;
      });

      // Act
      const result = ai.decideCleansing(user, [ 8, 9 ]);

      // Assert
      expect(result).toEqual(9);
    });
  });

  describe('decideHealing()', () =>
  {
    it('returns 0 when there are no healing-type skills', () =>
    {
      // Arrange: a badly wounded ally stands right there, so "returned 0" cannot be explained by
      // nobody needing help. The early return is also what keeps the healer from re-aiming at that
      // ally: retargeting on a turn it has no cure for would drag its attacks off the enemy.
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });

      // Act
      const chosenSkillId = ai.decideHealing(user, [ 1 ]);

      // Assert
      expect(chosenSkillId).toEqual(0);
      expect(user.setAllyTarget).not.toHaveBeenCalled();
    });

    it('ignores a restorative skill that is not aimed at a living friend', () =>
    {
      // Arrange: a self-buffing regen or an undead-scorching heal both restore hp without being
      // aimable at a wounded ally. Every fixture here had all three predicates agreeing, so the
      // filter could have degraded to any one of them unnoticed.
      const ai = new JABS_AI();
      const spy = vi.spyOn(ai, 'bestFitHealingOneSkill').mockReturnValue(42);
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForAliveFriend = () => false;
        this.isRecover = () => true;
        this.isHpEffect = () => true;
      });

      // Act
      const chosenSkillId = ai.decideHealing(user, [ 1 ]);

      // Assert
      expect(chosenSkillId).toEqual(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('ignores a friend-targeting hp skill that does not restore anything', () =>
    {
      // Arrange: an hp-effect skill aimed at a living friend is not necessarily a heal- a sacrifice
      // or hp-cost skill fits that shape exactly, and casting one on the lowest ally would finish
      // them off.
      const ai = new JABS_AI();
      const spy = vi.spyOn(ai, 'bestFitHealingOneSkill').mockReturnValue(42);
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForAliveFriend = () => true;
        this.isRecover = () => false;
        this.isHpEffect = () => true;
      });

      // Act
      const chosenSkillId = ai.decideHealing(user, [ 1 ]);

      // Assert
      expect(chosenSkillId).toEqual(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('returns 0 when no ally is below the low-hp threshold', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForAliveFriend = () => true;
        this.isRecover = () => true;
        this.isHpEffect = () => true;
      });

      // Act
      const chosenSkillId = ai.decideHealing(user, [ 1 ]);

      // Assert: nobody needs a heal, so nobody is aimed at. An aim left behind here would pull the
      // healer's next attack off the enemy and walk it toward a healthy ally.
      expect(chosenSkillId).toEqual(0);
      expect(user.setAllyTarget).not.toHaveBeenCalled();
    });

    it('delegates to bestFitHealingOneSkill when exactly one ally is low', () =>
    {
      const ai = new JABS_AI();
      const spy = vi.spyOn(ai, 'bestFitHealingOneSkill').mockReturnValue(42);
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ ally ] });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForAliveFriend = () => true;
        this.isRecover = () => true;
        this.isHpEffect = () => true;
      });

      expect(ai.decideHealing(user, [ 1 ])).toEqual(42);
      expect(spy).toHaveBeenCalled();
      expect(user.setAllyTarget).toHaveBeenCalledWith(ally);
    });

    it('delegates to bestFitHealingAllSkill when multiple allies are low', () =>
    {
      const ai = new JABS_AI();
      const spy = vi.spyOn(ai, 'bestFitHealingAllSkill').mockReturnValue(43);
      const allyA = { getBattler: () => ({ currentHpPercent: () => 0.1 }) };
      const allyB = { getBattler: () => ({ currentHpPercent: () => 0.2 }) };
      const user = buildBattler({ getAllNearbyAllies: () => [ allyA, allyB ] });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForAliveFriend = () => true;
        this.isRecover = () => true;
        this.isHpEffect = () => true;
      });

      expect(ai.decideHealing(user, [ 1 ])).toEqual(43);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('decideBuffing()', () =>
  {
    it('returns 0 when no skill has state-adding effects', () =>
    {
      const ai = new JABS_AI();
      const user = buildBattler({ getSkill: () => ({ effects: [] }) });

      expect(ai.decideBuffing(user, [ 1 ])).toEqual(0);
    });

    it('returns 0 when every nearby ally already has the tracked, non-expiring state', () =>
    {
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue({ isAboutToExpire: () => false });
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 21, dataId: 3 } ] }),
      });

      expect(ai.decideBuffing(user, [ 1 ])).toEqual(0);

      // nobody needed a buff, so no ally should have been designated as the recipient of one.
      expect(user.setAllyTarget).not.toHaveBeenCalled();
    });

    it('ignores effects that are not state-adding, however buff-like they look', () =>
    {
      // Arrange: every fixture in this block used effect code 21 exclusively, so the filter could
      // have been dropped entirely and gone unnoticed. A skill that only heals and only removes
      // state is not a buff, and treating it as one would have the AI open a fight by casting a
      // cure on an ally who has nothing to cure.
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue(null);
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({
          effects: [
            {
              code: 11, dataId: 3,
            },
            {
              code: 22, dataId: 3,
            },
          ],
        }),
      });

      // Act
      const chosenSkillId = ai.decideBuffing(user, [ 1 ]);

      // Assert
      expect(chosenSkillId).toEqual(0);
      expect(user.setAllyTarget).not.toHaveBeenCalled();
    });

    it('never reads a skill aimed at the opposition as a buff, whatever state effects it carries', () =>
    {
      // Arrange: the real shape of the list. Every enemy's basic attack is pushed last and carries a
      // state-adding effect of its own, its normal attack line, so it has to lose to the buff beside
      // it rather than overwrite it and send the battler after an ally with an attack.
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue(null);
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: skillId => ({ effects: [ { code: 21, dataId: skillId === 7 ? 0 : 3 } ] }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = skillId => { this.skillId = skillId; };
        this.isForFriend = () => this.skillId !== 7;
      });

      // Act
      const chosenSkillId = ai.decideBuffing(user, [ 5, 7 ]);

      // Assert
      expect(chosenSkillId).toEqual(5);
    });

    it('returns 0 and aims at nobody when only an attack is ready', () =>
    {
      // Arrange: the buff is on cooldown, which leaves the attack alone in the list.
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue(null);
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 21, dataId: 0 } ] }),
      });
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setSkill = () => {};
        this.isForFriend = () => false;
      });

      // Act
      const chosenSkillId = ai.decideBuffing(user, [ 7 ]);

      // Assert
      expect(chosenSkillId).toEqual(0);
      expect(user.setAllyTarget).not.toHaveBeenCalled();
    });

    it('picks a skill and sets the ally target when a buff is needed', () =>
    {
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue(null);
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 21, dataId: 3 } ] }),
      });

      expect(ai.decideBuffing(user, [ 5 ])).toEqual(5);
      expect(user.setAllyTarget).toHaveBeenCalledWith(ally);
    });

    it('stops scanning further state-adding effects on a skill once one is already satisfied', () =>
    {
      // this skill has two state-adding effects; the ally is missing the first tracked state, so
      // `ready` flips true during that effect's pass- the `if (ready) return` guard must then
      // short-circuit the second effect's pass before it can overwrite bestSkillId/chosenAlly.
      const ai = new JABS_AI();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockReturnValue(null);
      const ally = { getUuid: () => 'ally-uuid' };
      const user = buildBattler({
        getAllNearbyAllies: () => [ ally ],
        getSkill: () => ({ effects: [ { code: 21, dataId: 3 }, { code: 21, dataId: 4 } ] }),
      });

      expect(ai.decideBuffing(user, [ 5 ])).toEqual(5);
      expect(user.setAllyTarget).toHaveBeenCalledWith(ally);
    });

    it('keeps the ally chosen by the first satisfied effect rather than a later one', () =>
    {
      // Arrange: the two effects disagree about who needs help. State 3 is missing on the first
      // ally only; state 4 is missing on the second only. The short-circuit means the first
      // effect's pick stands, so the buff is aimed at the first ally. The existing short-circuit
      // case above cannot show this - both of its effects nominate the same ally, so letting the
      // second pass run produces an identical answer and the guard could be deleted untouched.
      const ai = new JABS_AI();
      const firstAlly = { getUuid: () => 'first-ally' };
      const secondAlly = { getUuid: () => 'second-ally' };
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId.mockImplementation((uuid, stateId) =>
      {
        const alreadyHasIt = (stateId === 3)
          ? uuid === 'second-ally'
          : uuid === 'first-ally';

        return alreadyHasIt
          ? { isAboutToExpire: () => false }
          : null;
      });
      const user = buildBattler({
        getAllNearbyAllies: () => [ firstAlly, secondAlly ],
        getSkill: () => ({
          effects: [
            {
              code: 21, dataId: 3,
            },
            {
              code: 21, dataId: 4,
            },
          ],
        }),
      });

      // Act
      const chosenSkillId = ai.decideBuffing(user, [ 5 ]);

      // Assert
      expect(chosenSkillId).toEqual(5);
      expect(user.setAllyTarget).toHaveBeenCalledWith(firstAlly);
    });
  });

  describe('determineLowestHpAlly()', () =>
  {
    it('returns null with no nearby allies', () =>
    {
      const ai = new JABS_AI();

      expect(ai.determineLowestHpAlly(buildBattler())).toBeNull();
    });

    it('returns the single ally when only one is present', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.5 }) };
      const healer = buildBattler({ getAllNearbyAllies: () => [ ally ] });

      expect(ai.determineLowestHpAlly(healer)).toEqual(ally);
    });

    it('returns the ally with the lowest hp percent among several', () =>
    {
      const ai = new JABS_AI();
      const higher = { getBattler: () => ({ currentHpPercent: () => 0.8 }) };
      const lower = { getBattler: () => ({ currentHpPercent: () => 0.2 }) };
      const healer = buildBattler({ getAllNearbyAllies: () => [ higher, lower ] });

      expect(ai.determineLowestHpAlly(healer)).toEqual(lower);
    });

    it('keeps the wounded ally when a healthier one is evaluated after it', () =>
    {
      // Arrange: the order is the whole point. Both the "nobody picked yet" seed and the
      // comparison below assign into the same slot, so a scan that had degraded into "whoever
      // came last" agrees with the correct answer on any list that happens to end on its lowest
      // member - which is exactly how the list above is ordered.
      const ai = new JABS_AI();
      const lower = { getBattler: () => ({ currentHpPercent: () => 0.2 }) };
      const higher = { getBattler: () => ({ currentHpPercent: () => 0.8 }) };
      const healer = buildBattler({ getAllNearbyAllies: () => [ lower, higher ] });

      // Act
      const lowestAlly = ai.determineLowestHpAlly(healer);

      // Assert
      expect(lowestAlly).toEqual(lower);
    });
  });

  describe('countLowHpAllies()', () =>
  {
    it('counts allies below the default 0.6 threshold', () =>
    {
      const ai = new JABS_AI();
      const low = { getBattler: () => ({ currentHpPercent: () => 0.5 }) };
      const high = { getBattler: () => ({ currentHpPercent: () => 0.9 }) };
      const healer = buildBattler({ getAllNearbyAllies: () => [ low, high ] });

      expect(ai.countLowHpAllies(healer)).toEqual(1);
    });

    it('counts allies below an explicit threshold', () =>
    {
      const ai = new JABS_AI();
      const ally = { getBattler: () => ({ currentHpPercent: () => 0.85 }) };
      const healer = buildBattler({ getAllNearbyAllies: () => [ ally ] });

      expect(ai.countLowHpAllies(healer, 0.9)).toEqual(1);
    });
  });

  describe('bestFitHealingOneSkill()', () =>
  {
    it('skips self-only skills when the healer is not the lowest ally', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: () => ({}) };
      const lowestAllyBattler = { hp: 10, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setItemObject = () => {};
        this.isForUser = () => true;
      });

      expect(ai.bestFitHealingOneSkill([ 1 ], healerBattler, lowestAllyBattler)).toEqual(0);
    });

    it('considers a self-only skill when the healer is itself the lowest ally', () =>
    {
      // Arrange: the healer and the wounded ally are the same battler here, which is the only
      // situation in which a self-only heal is the right call. Every other fixture used two
      // distinct battlers, so the identity half of that guard could have been dropped and the
      // healer would have refused to ever heal itself.
      const ai = new JABS_AI();
      const selfBattler = { hp: 50, mhp: 100, skill: (id) => ({ id }) };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.isForUser = () => true;
        this.isForOne = () => true;
        this.isForAll = () => false;
        this.isForDeadFriend = () => false;
        this.makeDamageValue = () => -50;
      });

      // Act
      const bestSkillId = ai.bestFitHealingOneSkill([ 3 ], selfBattler, selfBattler);

      // Assert
      expect(bestSkillId).toEqual(3);
    });

    it('skips skills that target neither one, all, nor dead friends', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: () => ({}) };
      const lowestAllyBattler = { hp: 10, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setItemObject = () => {};
        this.isForUser = () => false;
        this.isForOne = () => false;
        this.isForAll = () => false;
        this.isForDeadFriend = () => false;
      });

      expect(ai.bestFitHealingOneSkill([ 1 ], healerBattler, lowestAllyBattler)).toEqual(0);
    });

    it('picks the skill whose heal amount lands closest to full hp', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: (id) => ({ id }) };
      const lowestAllyBattler = { hp: 50, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.isForUser = () => false;
        this.isForOne = () => true;
        this.isForAll = () => false;
        this.isForDeadFriend = () => false;
        this.makeDamageValue = () => (this._item.id === 1 ? -30 : -60);
      });

      // skill 2 heals exactly to full (60), skill 1 overheals by 20.
      expect(ai.bestFitHealingOneSkill([ 1, 2 ], healerBattler, lowestAllyBattler)).toEqual(2);
    });

    it('does not overwrite the running best with a worse-fit skill evaluated later', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: (id) => ({ id }) };
      const lowestAllyBattler = { hp: 50, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.isForUser = () => false;
        this.isForOne = () => true;
        this.isForAll = () => false;
        this.isForDeadFriend = () => false;
        // skill 2 (processed second) heals exactly to full; skill 3 (processed third) way overheals.
        this.makeDamageValue = () =>
        {
          if (this._item.id === 2) return -50;
          return -90;
        };
      });

      expect(ai.bestFitHealingOneSkill([ 2, 3 ], healerBattler, lowestAllyBattler)).toEqual(2);
    });
  });

  describe('bestFitHealingAllSkill()', () =>
  {
    it('falls back to single-target selection when no multi-target skill exists', () =>
    {
      const ai = new JABS_AI();
      const spy = vi.spyOn(ai, 'bestFitHealingOneSkill').mockReturnValue(11);
      const healerBattler = { skill: () => ({}) };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setItemObject = () => {};
        this.isForAll = () => false;
      });

      expect(ai.bestFitHealingAllSkill([ 1 ], healerBattler, {})).toEqual(11);
      expect(spy).toHaveBeenCalled();
    });

    it('returns the sole multi-target skill directly when only one exists', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: () => ({}) };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this.setItemObject = () => {};
        this.isForAll = () => true;
      });

      expect(ai.bestFitHealingAllSkill([ 7 ], healerBattler, {})).toEqual(7);
    });

    it('picks the closest-fit skill among multiple multi-target skills', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: (id) => ({ id }) };
      const lowestAllyBattler = { hp: 50, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.isForAll = () => true;
        this.makeDamageValue = () => (this._item.id === 1 ? -30 : -50);
      });

      expect(ai.bestFitHealingAllSkill([ 1, 2 ], healerBattler, lowestAllyBattler)).toEqual(2);
    });

    it('does not overwrite the running best with a worse-fit skill evaluated later', () =>
    {
      const ai = new JABS_AI();
      const healerBattler = { skill: (id) => ({ id }) };
      const lowestAllyBattler = { hp: 50, mhp: 100 };
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._item = null;
        this.setItemObject = (item) => { this._item = item; };
        this.isForAll = () => true;
        this.makeDamageValue = () => (this._item.id === 1 ? -50 : -90);
      });

      expect(ai.bestFitHealingAllSkill([ 1, 2 ], healerBattler, lowestAllyBattler)).toEqual(1);
    });
  });

  describe('determineBestSkillForStateCleansing()', () =>
  {
    it('returns 0 when no skill cleanses the given state', () =>
    {
      const ai = new JABS_AI();
      const healer = buildBattler({ getSkill: () => ({ effects: [] }) });

      expect(ai.determineBestSkillForStateCleansing([ 1 ], 5, healer)).toBe(0);
    });

    it('picks the skill with the highest cleanse rate for the state', () =>
    {
      const ai = new JABS_AI();
      const healer = buildBattler({
        getSkill: (id) => ({
          effects: [ { code: 22, dataId: 5, value1: id === 1 ? 0.3 : 0.8 } ],
        }),
      });

      expect(ai.determineBestSkillForStateCleansing([ 1, 2 ], 5, healer)).toEqual(2);
    });

    it('does not overwrite the running best with a lower cleanse rate evaluated later', () =>
    {
      const ai = new JABS_AI();
      const healer = buildBattler({
        getSkill: (id) => ({
          effects: [ { code: 22, dataId: 5, value1: id === 1 ? 0.8 : 0.3 } ],
        }),
      });

      expect(ai.determineBestSkillForStateCleansing([ 1, 2 ], 5, healer)).toEqual(1);
    });

    it('ignores effects that match only the code or only the state being cleansed', () =>
    {
      // Arrange: the two decoys carry a far higher rate than the real cleanse, and each shares
      // exactly one half of the predicate - a remove-state effect aimed at a different state, and
      // a different effect code aimed at this one. Either would be picked by a filter that had
      // degraded to matching on one half, and the resulting skill would cleanse nothing. Every
      // fixture in this block held only exact matches, so nothing could tell those apart.
      const ai = new JABS_AI();
      const healer = buildBattler({
        getSkill: () => ({
          effects: [
            {
              code: 22, dataId: 9, value1: 0.99,
            },
            {
              code: 21, dataId: 5, value1: 0.99,
            },
            {
              code: 22, dataId: 5, value1: 0.4,
            },
          ],
        }),
      });

      // Act
      const bestSkill = ai.determineBestSkillForStateCleansing([ 1 ], 5, healer);

      // Assert
      expect(bestSkill).toEqual(1);
    });

    it('returns 0 when every effect matches only half the predicate', () =>
    {
      // Arrange: nothing here removes state 5, so there is no cleansing skill to nominate.
      const ai = new JABS_AI();
      const healer = buildBattler({
        getSkill: () => ({
          effects: [
            {
              code: 22, dataId: 9, value1: 0.99,
            },
            {
              code: 21, dataId: 5, value1: 0.99,
            },
          ],
        }),
      });

      // Act
      const bestSkill = ai.determineBestSkillForStateCleansing([ 1 ], 5, healer);

      // Assert
      expect(bestSkill).toBe(0);
    });
  });

  describe('battle memory', () =>
  {
    it('applyMemory adds a new memory when none exists yet', () =>
    {
      const ai = new JABS_AI();

      ai.applyMemory({ battlerId: 1, skillId: 2, effectiveness: 1, damageApplied: 10 });

      expect(ai.getMemories()).toHaveLength(1);
    });

    it('applyMemory updates an existing memory in place', () =>
    {
      const ai = new JABS_AI();
      ai.applyMemory({ battlerId: 1, skillId: 2, effectiveness: 1, damageApplied: 10 });

      ai.applyMemory({ battlerId: 1, skillId: 2, effectiveness: 2, damageApplied: 20 });

      expect(ai.getMemories()).toHaveLength(1);
      expect(ai.getMemory(1, 2).damageApplied).toEqual(20);
    });

    it('getMemory returns undefined for an unknown battler/skill pair', () =>
    {
      const ai = new JABS_AI();

      expect(ai.getMemory(99, 99)).toBeUndefined();
    });

    it('getMemory matches the battler and the skill together, not either one alone', () =>
    {
      // Arrange: the two near misses are stored ahead of the real match on purpose. Each shares
      // exactly one half of the key, so a lookup that had quietly degraded into matching on the
      // battler alone would return the 20, and one matching on the skill alone would return the
      // 30. With a single memory on file - which is all this suite held - "matches this pair" and
      // "matches anything" are the same program and no assertion can separate them.
      const ai = new JABS_AI();
      ai.applyMemory({
        battlerId: 7, skillId: 2, effectiveness: 1, damageApplied: 30,
      });
      ai.applyMemory({
        battlerId: 1, skillId: 3, effectiveness: 1, damageApplied: 20,
      });
      ai.applyMemory({
        battlerId: 1, skillId: 2, effectiveness: 1, damageApplied: 10,
      });

      // Act
      const found = ai.getMemory(1, 2);

      // Assert
      expect(found.damageApplied).toEqual(10);
    });

    it('getMemory refuses a pair that only half matches something on file', () =>
    {
      // Arrange: battler 1 is known and skill 2 is known, but never together - remembering that
      // combination would be an invention.
      const ai = new JABS_AI();
      ai.applyMemory({
        battlerId: 1, skillId: 3, effectiveness: 1, damageApplied: 20,
      });
      ai.applyMemory({
        battlerId: 7, skillId: 2, effectiveness: 1, damageApplied: 30,
      });

      // Act
      const found = ai.getMemory(1, 2);

      // Assert
      expect(found).toBeUndefined();
    });

    it('filterMemoriesByEffectiveness keeps only remembered-effective skills', () =>
    {
      const ai = new JABS_AI();
      const memories = [
        { skillId: 1, wasEffective: () => true },
        { skillId: 2, wasEffective: () => false },
      ];

      expect(ai.filterMemoriesByEffectiveness([ 1, 2, 3 ], memories)).toEqual([ 1 ]);
    });
  });
});
//endregion plugins/abs/core/models/jabs-ai.test.js
