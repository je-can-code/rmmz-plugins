//region plugins/crit/game-action-crit-math.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-CriticalFactors Game_Action crit math (out/crit/J-CriticalFactors.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCriticalFactorsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  /**
   * Builds a minimal Game_Action stub exposing the real prototype methods under test.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    const action = Object.create(sandbox.Game_Action.prototype);
    return Object.assign(action, overrides);
  }

  describe('setTargetBattler/targetBattler', () =>
  {
    it('starts null and reports whatever was last set', () =>
    {
      // unlike the other cases in this suite, this one exercises the aliased initialize() itself
      // (which seeds _targetBattler to null). The companion stub's bare `function Game_Action() {}`
      // constructor doesn't call initialize() on its own the way the real engine class does, so
      // it has to be invoked explicitly here.
      const action = new sandbox.Game_Action();
      action.initialize();

      expect(action.targetBattler()).toBe(null);

      const target = {};
      action.setTargetBattler(target);

      expect(action.targetBattler()).toBe(target);
    });
  });

  describe('itemCri', () =>
  {
    it('returns 0 when the item cannot crit at all', () =>
    {
      const action = buildAction({
        item: () => ({ damage: { critical: false } }),
      });

      expect(action.itemCri({})).toBe(0);
    });

    it('returns 9999 when isGuaranteedCrit() is true', () =>
    {
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: '<thisCritsAlways>' }),
      });

      expect(action.itemCri({})).toBe(9999);
    });

    it('returns 9999 when isGuaranteedCritVsTarget() is true', () =>
    {
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: String.empty }),
        isGuaranteedCrit: () => false,
        isGuaranteedCritVsTarget: () => true,
      });

      expect(action.itemCri({})).toBe(9999);
    });

    it('sums subject cri, own bonus, and conditional bonuses, then subtracts target cev', () =>
    {
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: String.empty }),
        isGuaranteedCrit: () => false,
        isGuaranteedCritVsTarget: () => false,
        subject: () => ({ cri: 0.1 }),
        ownCriticalChanceBonus: () => 0.05,
        thisCritChanceIfStateBonus: () => 0.02,
        critChanceIfStateBonus: () => 0.03,
      });
      const target = { cev: 0.05 };

      // 0.1 + 0.05 + 0.02 + 0.03 - 0.05 = 0.15.
      expect(action.itemCri(target)).toBeCloseTo(0.15, 5);
    });

    it('normalizes a negative result up to 0', () =>
    {
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: String.empty }),
        isGuaranteedCrit: () => false,
        isGuaranteedCritVsTarget: () => false,
        subject: () => ({ cri: 0 }),
        ownCriticalChanceBonus: () => 0,
        thisCritChanceIfStateBonus: () => 0,
        critChanceIfStateBonus: () => 0,
      });
      const target = { cev: 0.5 };

      expect(action.itemCri(target)).toBe(0);
    });
  });

  describe('ownCriticalDamageMultiplier / ownCriticalChanceBonus', () =>
  {
    it('sums thisCritMultiplier tags on the item and divides by 100', () =>
    {
      const action = buildAction({
        item: () => ({ note: '<thisCritMultiplier:[25]>' }),
      });

      expect(action.ownCriticalDamageMultiplier()).toBeCloseTo(0.25, 5);
    });

    it('sums thisCritChance tags on the item and divides by 100', () =>
    {
      const action = buildAction({
        item: () => ({ note: '<thisCritChance:[10]>' }),
      });

      expect(action.ownCriticalChanceBonus()).toBeCloseTo(0.1, 5);
    });
  });

  describe('isGuaranteedCrit', () =>
  {
    it('is true when the item carries <thisCritsAlways>', () =>
    {
      const action = buildAction({ item: () => ({ note: '<thisCritsAlways>' }) });

      expect(action.isGuaranteedCrit()).toBe(true);
    });

    it('is false without the tag', () =>
    {
      const action = buildAction({ item: () => ({ note: String.empty }) });

      expect(action.isGuaranteedCrit()).toBe(false);
    });
  });

  describe('isGuaranteedCritVsTarget', () =>
  {
    /**
     * Builds a target stub whose isStateAffected() only reports true for the given ids.
     * @param {number[]} activeStateIds
     * @returns {object}
     */
    function buildTarget(activeStateIds)
    {
      return {
        isStateAffected: stateId => activeStateIds.includes(stateId),
        states: () => [],
      };
    }

    it('is true when the skill\'s thisCritsAlwaysIfStates lists a state active on the target', () =>
    {
      const action = buildAction({
        item: () => ({
          thisCritsAlwaysIfStates: [ 4 ],
          thisCritsAlwaysIfStateTypes: [],
        }),
        subject: () => ({ getAllNotes: () => [] }),
        targetHasActiveStateType: () => false,
      });

      expect(action.isGuaranteedCritVsTarget(buildTarget([ 4 ]))).toBe(true);
    });

    it('is true when the attacker\'s global critAlwaysIfStates lists a state active on the target', () =>
    {
      const action = buildAction({
        item: () => ({ thisCritsAlwaysIfStates: [], thisCritsAlwaysIfStateTypes: [] }),
        subject: () => ({
          getAllNotes: () => [ { critAlwaysIfStates: [ 9 ], critAlwaysIfStateTypes: [] } ],
        }),
        targetHasActiveStateType: () => false,
      });

      expect(action.isGuaranteedCritVsTarget(buildTarget([ 9 ]))).toBe(true);
    });

    it('is false when nothing on the skill or the attacker matches the target\'s active states', () =>
    {
      const action = buildAction({
        item: () => ({ thisCritsAlwaysIfStates: [ 1 ], thisCritsAlwaysIfStateTypes: [] }),
        subject: () => ({ getAllNotes: () => [ { critAlwaysIfStates: [ 2 ], critAlwaysIfStateTypes: [] } ] }),
        targetHasActiveStateType: () => false,
      });

      expect(action.isGuaranteedCritVsTarget(buildTarget([ 3 ]))).toBe(false);
    });
  });

  describe('thisCritChanceIfStateBonus', () =>
  {
    it('sums bonuses for pairs whose state id is active on the target', () =>
    {
      const action = buildAction({
        item: () => ({
          thisCritChanceIfStates: [ [ 4, 20 ], [ 5, 10 ] ],
          thisCritChanceIfStateTypes: [],
        }),
      });
      const target = { isStateAffected: stateId => stateId === 4, states: () => [] };

      // only state 4's 20 bonus applies (state 5 is not active); 20 / 100 = 0.2.
      expect(action.thisCritChanceIfStateBonus(target)).toBeCloseTo(0.2, 5);
    });

    it('returns 0 when the skill has no conditional pairs at all', () =>
    {
      const action = buildAction({
        item: () => ({ thisCritChanceIfStates: [], thisCritChanceIfStateTypes: [] }),
      });

      expect(action.thisCritChanceIfStateBonus({})).toBe(0);
    });
  });

  describe('critChanceIfStateBonus', () =>
  {
    it('sums bonuses from every note source on the attacker whose state is active on the target', () =>
    {
      const action = buildAction({
        subject: () => ({
          getAllNotes: () => [
            { critChanceIfStates: [ [ 1, 15 ] ], critChanceIfStateTypes: [] },
            { critChanceIfStates: [ [ 2, 25 ] ], critChanceIfStateTypes: [] },
          ],
        }),
      });
      const target = { isStateAffected: stateId => stateId === 2, states: () => [] };

      // only state 2's 25 bonus applies; 25 / 100 = 0.25.
      expect(action.critChanceIfStateBonus(target)).toBeCloseTo(0.25, 5);
    });
  });

  describe('targetHasActiveStateType', () =>
  {
    it('is true when any active state on the target carries the type, case-insensitively', () =>
    {
      const action = buildAction();
      const target = { states: () => [ { stateTypes: () => [ 'Poison' ] } ] };

      expect(action.targetHasActiveStateType(target, 'poison')).toBe(true);
    });

    it('is false when no active state carries the type', () =>
    {
      const action = buildAction();
      const target = { states: () => [ { stateTypes: () => [ 'burn' ] } ] };

      expect(action.targetHasActiveStateType(target, 'poison')).toBe(false);
    });
  });

  describe('applyCriticalDamageMultiplier', () =>
  {
    it('sums base multiplier, cdm, and this action\'s own multiplier, then multiplies the base damage', () =>
    {
      const action = buildAction({
        subject: () => ({ baseCriticalMultiplier: () => 0.5, cdm: 0.2 }),
        ownCriticalDamageMultiplier: () => 0.1,
      });

      // multiplier = 0.5 + 0.2 + 0.1 = 0.8; 100 * 0.8 = 80.
      expect(action.applyCriticalDamageMultiplier(100)).toBeCloseTo(80, 5);
    });
  });

  describe('applyCriticalDamageReduction', () =>
  {
    it('returns the critical damage unchanged when there is no target yet', () =>
    {
      const action = buildAction();

      expect(action.applyCriticalDamageReduction(50)).toBe(50);
    });

    it('reduces critical damage by (1 - target.ctr)', () =>
    {
      const action = buildAction();
      action.setTargetBattler({ ctr: 0.3 });

      // 50 * (1 - 0.3) = 35.
      expect(action.applyCriticalDamageReduction(50)).toBeCloseTo(35, 5);
    });

    it('never reduces the reduction rate below 0 (ctr > 1 cannot flip the sign)', () =>
    {
      const action = buildAction();
      action.setTargetBattler({ ctr: 2 });

      expect(action.applyCriticalDamageReduction(50)).toBe(0);
    });
  });

  describe('applyCritical', () =>
  {
    it('adds the reduced critical bonus damage onto the base damage', () =>
    {
      const action = buildAction({
        applyCriticalDamageMultiplier: baseDamage => baseDamage * 0.5,
        applyCriticalDamageReduction: criticalDamage => criticalDamage * 0.5,
      });

      // bonus = 100 * 0.5 = 50; reduced = 50 * 0.5 = 25; total = 100 + 25 = 125.
      expect(action.applyCritical(100)).toBe(125);
    });
  });

  describe('thisCritTargetStates / thisCritSelfStates / onCritTargetStates / onCritSelfStates', () =>
  {
    it('thisCritTargetStates resolves on-chance effects from the item using ThisCritApply', () =>
    {
      const item = { note: '<thisCritApply: [3, 50]>' };
      const action = buildAction({ item: () => item });

      const effects = action.thisCritTargetStates();

      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(3);
    });

    it('thisCritSelfStates resolves on-chance effects from the item using ThisCritSelf', () =>
    {
      const item = { note: '<thisCritSelf: [4, 25]>' };
      const action = buildAction({ item: () => item });

      const effects = action.thisCritSelfStates();

      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(4);
    });

    it('onCritTargetStates resolves on-chance effects from all attacker notes using OnCritApply', () =>
    {
      const action = buildAction({
        subject: () => ({ getAllNotes: () => [ { note: '<onCritApply: [5, 10]>' } ] }),
      });

      const effects = action.onCritTargetStates();

      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(5);
    });

    it('onCritSelfStates resolves on-chance effects from all attacker notes using OnCritSelf', () =>
    {
      const action = buildAction({
        subject: () => ({ getAllNotes: () => [ { note: '<onCritSelf: [6, 10]>' } ] }),
      });

      const effects = action.onCritSelfStates();

      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(6);
    });
  });

  describe('applyOnCriticalSelfStates / applyOnCriticalTargetStates', () =>
  {
    it('rolls both per-skill and global self states against the attacker', () =>
    {
      const attacker = {};
      const action = buildAction({
        subject: () => attacker,
        thisCritSelfStates: () => [ 'this-self' ],
        onCritSelfStates: () => [ 'on-self' ],
        rollAndApplyCritStates: vi.fn(),
      });

      action.applyOnCriticalSelfStates();

      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(1, attacker, [ 'this-self' ]);
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(2, attacker, [ 'on-self' ]);
    });

    it('rolls both per-skill and global target states against the target', () =>
    {
      const target = {};
      const action = buildAction({
        thisCritTargetStates: () => [ 'this-target' ],
        onCritTargetStates: () => [ 'on-target' ],
        rollAndApplyCritStates: vi.fn(),
      });

      action.applyOnCriticalTargetStates(target);

      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(1, target, [ 'this-target' ]);
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(2, target, [ 'on-target' ]);
    });
  });

  describe('applyOnCriticalStateEffects', () =>
  {
    it('does nothing when J.ABS is not loaded', () =>
    {
      const action = buildAction({
        applyOnCriticalTargetStates: vi.fn(),
        applyOnCriticalSelfStates: vi.fn(),
      });

      const savedAbs = sandbox.J.ABS;
      delete sandbox.J.ABS;

      action.applyOnCriticalStateEffects({});

      expect(action.applyOnCriticalTargetStates).not.toHaveBeenCalled();
      expect(action.applyOnCriticalSelfStates).not.toHaveBeenCalled();

      sandbox.J.ABS = savedAbs;
    });

    it('applies target then self states when J.ABS is loaded', () =>
    {
      const target = {};
      const action = buildAction({
        applyOnCriticalTargetStates: vi.fn(),
        applyOnCriticalSelfStates: vi.fn(),
      });

      const savedAbs = sandbox.J.ABS;
      sandbox.J.ABS = true;

      action.applyOnCriticalStateEffects(target);

      expect(action.applyOnCriticalTargetStates).toHaveBeenCalledWith(target);
      expect(action.applyOnCriticalSelfStates).toHaveBeenCalledTimes(1);

      sandbox.J.ABS = savedAbs;
    });
  });

  describe('apply', () =>
  {
    it('tracks the target and triggers on-crit state effects only when the hit was critical', () =>
    {
      const action = buildAction({
        applyOnCriticalStateEffects: vi.fn(),
      });
      const criticalTarget = { result: () => ({ critical: true }) };

      action.apply(criticalTarget);

      expect(action.targetBattler()).toBe(criticalTarget);
      expect(action.applyOnCriticalStateEffects).toHaveBeenCalledWith(criticalTarget);
    });

    it('does not trigger on-crit state effects for a non-critical hit', () =>
    {
      const action = buildAction({
        applyOnCriticalStateEffects: vi.fn(),
      });
      const nonCriticalTarget = { result: () => ({ critical: false }) };

      action.apply(nonCriticalTarget);

      expect(action.applyOnCriticalStateEffects).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/crit/game-action-crit-math.test.js
