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
      const ai = new JABS_AI();
      const user = buildBattler({ hasComboReady: () => false });

      expect(ai.shouldFollowWithCombo(user)).toEqual(false);
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
          if (this._item.id === 1) return isCrit ? 50 : 10;
          return isCrit ? 20 : 5;
        };
      });

      expect(ai.determineStrongestSkill([ 2, 1 ], user, buildBattler())).toEqual(1);
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
      const ai = new JABS_AI();

      expect(ai.filterElementallyIneffectiveSkills([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
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

  describe('findMostElementallyEffectiveSkill()', () =>
  {
    it('returns the list unfiltered when it has one or fewer entries', () =>
    {
      const ai = new JABS_AI();

      expect(ai.findMostElementallyEffectiveSkill([ 1 ], buildBattler(), buildBattler())).toEqual([ 1 ]);
    });

    it('narrows to the single most elementally effective skill', () =>
    {
      const ai = new JABS_AI();
      GameActionMock.mockImplementation(function(battler)
      {
        this.battler = battler;
        this._skillId = null;
        this.setSkill = (id) => { this._skillId = id; };
        this.calcElementRate = () => (this._skillId === 2 ? 2 : 1);
      });

      expect(ai.findMostElementallyEffectiveSkill([ 1, 2, 3 ], buildBattler(), buildBattler())).toEqual([ 2 ]);
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
  });

  describe('decideHealing()', () =>
  {
    it('returns 0 when there are no healing-type skills', () =>
    {
      const ai = new JABS_AI();

      expect(ai.decideHealing(buildBattler(), [ 1 ])).toEqual(0);
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

      expect(ai.decideHealing(user, [ 1 ])).toEqual(0);
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
    it('returns null when no skill cleanses the given state', () =>
    {
      const ai = new JABS_AI();
      const healer = buildBattler({ getSkill: () => ({ effects: [] }) });

      expect(ai.determineBestSkillForStateCleansing([ 1 ], 5, healer)).toBeNull();
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

    it('returns null when every effect matches only half the predicate', () =>
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
      expect(bestSkill).toBeNull();
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
