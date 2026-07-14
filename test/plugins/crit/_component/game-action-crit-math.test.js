//region plugins/crit/_component/game-action-crit-math.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';

describe('J-CriticalFactors Game_Action crit math (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.0.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    function Game_Action()
    {
    }

    // stand-in for the vanilla engine's initialize()/apply(), which crit's own file aliases below.
    Game_Action.prototype.initialize = function()
    {
      this._targetBattler = null;
    };
    Game_Action.prototype.apply = function()
    {
    };

    globalThis.Game_Action = Game_Action;
    globalThis.J.CRIT = {
      Aliased: { Game_Action: new Map() },
      RegExp: {
        ThisCritDamageChance: /<thisCritChance:\[([+\-*/ ().\w]+)]>/gi,
        ThisCritDamageMultiplier: /<thisCritMultiplier:\[([+\-*/ ().\w]+)]>/gi,
        ThisCritsAlways: /<thisCritsAlways>/gi,
        ThisCritApply: /<thisCritApply:[ ]?(\[\d+,[ ]?\d+])>/gi,
        ThisCritSelf: /<thisCritSelf:[ ]?(\[\d+,[ ]?\d+])>/gi,
        OnCritApply: /<onCritApply:[ ]?(\[\d+,[ ]?\d+])>/gi,
        OnCritSelf: /<onCritSelf:[ ]?(\[\d+,[ ]?\d+])>/gi,
      },
    };
    globalThis.J.ABS = false;

    // RPGManager.getOnChanceEffectsFromDatabaseObject(s) constructs one of these per matched tag- a
    // real J-ABS class (JABS_OnChanceEffect.js), bare-global by ship time like everything else here.
    function JABS_OnChanceEffect(skillId, chance, key, hitType = null)
    {
      this.skillId = skillId;
      this.chance = chance;
      this.key = key;
      this.hitType = hitType;
    }

    globalThis.JABS_OnChanceEffect = JABS_OnChanceEffect;

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_Action.js');
  });

  /**
   * Builds a minimal Game_Action stub exposing the real prototype methods under test.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    return Object.assign(action, overrides);
  }

  describe('setTargetBattler/targetBattler', () =>
  {
    it('starts null and reports whatever was last set', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();
      action.initialize();

      // Act & Assert
      expect(action.targetBattler()).toBe(null);

      // Act
      const target = {};
      action.setTargetBattler(target);

      // Assert
      expect(action.targetBattler()).toBe(target);
    });
  });

  describe('itemCri', () =>
  {
    it('returns 0 when the item cannot crit at all', () =>
    {
      // Arrange
      const action = buildAction({ item: () => ({ damage: { critical: false } }) });

      // Act & Assert
      expect(action.itemCri({})).toBe(0);
    });

    it('returns 9999 when isGuaranteedCrit() is true', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: '<thisCritsAlways>' }),
      });

      // Act & Assert
      expect(action.itemCri({})).toBe(9999);
    });

    it('returns 9999 when isGuaranteedCritVsTarget() is true', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({ damage: { critical: true }, note: String.empty }),
        isGuaranteedCrit: () => false,
        isGuaranteedCritVsTarget: () => true,
      });

      // Act & Assert
      expect(action.itemCri({})).toBe(9999);
    });

    it('sums subject cri, own bonus, and conditional bonuses, then subtracts target cev', () =>
    {
      // Arrange
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

      // Act & Assert
      // 0.1 + 0.05 + 0.02 + 0.03 - 0.05 = 0.15.
      expect(action.itemCri(target)).toBeCloseTo(0.15, 5);
    });

    it('normalizes a negative result up to 0', () =>
    {
      // Arrange
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

      // Act & Assert
      expect(action.itemCri(target)).toBe(0);
    });
  });

  describe('ownCriticalDamageMultiplier', () =>
  {
    it('sums thisCritMultiplier tags on the item and divides by 100', () =>
    {
      // Arrange
      const action = buildAction({ item: () => ({ note: '<thisCritMultiplier:[25]>' }) });

      // Act & Assert
      expect(action.ownCriticalDamageMultiplier()).toBeCloseTo(0.25, 5);
    });
  });

  describe('ownCriticalChanceBonus', () =>
  {
    it('sums thisCritChance tags on the item and divides by 100', () =>
    {
      // Arrange
      const action = buildAction({ item: () => ({ note: '<thisCritChance:[10]>' }) });

      // Act & Assert
      expect(action.ownCriticalChanceBonus()).toBeCloseTo(0.1, 5);
    });
  });

  describe('isGuaranteedCrit', () =>
  {
    it('is true when the item carries <thisCritsAlways>', () =>
    {
      // Arrange
      const action = buildAction({ item: () => ({ note: '<thisCritsAlways>' }) });

      // Act & Assert
      expect(action.isGuaranteedCrit()).toBe(true);
    });

    it('is false without the tag', () =>
    {
      // Arrange
      const action = buildAction({ item: () => ({ note: String.empty }) });

      // Act & Assert
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
      // Arrange
      const action = buildAction({
        item: () => ({
          thisCritsAlwaysIfStates: [ 4 ],
          thisCritsAlwaysIfStateTypes: [],
        }),
        subject: () => ({ getAllNotes: () => [] }),
        targetHasActiveStateType: () => false,
      });

      // Act & Assert
      expect(action.isGuaranteedCritVsTarget(buildTarget([ 4 ]))).toBe(true);
    });

    it('is true when the attacker\'s global critAlwaysIfStates lists a state active on the target', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({ thisCritsAlwaysIfStates: [], thisCritsAlwaysIfStateTypes: [] }),
        subject: () => ({
          getAllNotes: () => [ { critAlwaysIfStates: [ 9 ], critAlwaysIfStateTypes: [] } ],
        }),
        targetHasActiveStateType: () => false,
      });

      // Act & Assert
      expect(action.isGuaranteedCritVsTarget(buildTarget([ 9 ]))).toBe(true);
    });

    it('is false when nothing on the skill or the attacker matches the target\'s active states', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({ thisCritsAlwaysIfStates: [ 1 ], thisCritsAlwaysIfStateTypes: [] }),
        subject: () => ({ getAllNotes: () => [ { critAlwaysIfStates: [ 2 ], critAlwaysIfStateTypes: [] } ] }),
        targetHasActiveStateType: () => false,
      });

      // Act & Assert
      expect(action.isGuaranteedCritVsTarget(buildTarget([ 3 ]))).toBe(false);
    });
  });

  describe('thisCritChanceIfStateBonus', () =>
  {
    it('sums bonuses for pairs whose state id is active on the target', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({
          thisCritChanceIfStates: [ [ 4, 20 ], [ 5, 10 ] ],
          thisCritChanceIfStateTypes: [],
        }),
      });
      const target = { isStateAffected: stateId => stateId === 4, states: () => [] };

      // Act & Assert
      // only state 4's 20 bonus applies (state 5 is not active); 20 / 100 = 0.2.
      expect(action.thisCritChanceIfStateBonus(target)).toBeCloseTo(0.2, 5);
    });

    it('returns 0 when the skill has no conditional pairs at all', () =>
    {
      // Arrange
      const action = buildAction({
        item: () => ({ thisCritChanceIfStates: [], thisCritChanceIfStateTypes: [] }),
      });

      // Act & Assert
      expect(action.thisCritChanceIfStateBonus({})).toBe(0);
    });
  });

  describe('critChanceIfStateBonus', () =>
  {
    it('sums bonuses from every note source on the attacker whose state is active on the target', () =>
    {
      // Arrange
      const action = buildAction({
        subject: () => ({
          getAllNotes: () => [
            { critChanceIfStates: [ [ 1, 15 ] ], critChanceIfStateTypes: [] },
            { critChanceIfStates: [ [ 2, 25 ] ], critChanceIfStateTypes: [] },
          ],
        }),
      });
      const target = { isStateAffected: stateId => stateId === 2, states: () => [] };

      // Act & Assert
      // only state 2's 25 bonus applies; 25 / 100 = 0.25.
      expect(action.critChanceIfStateBonus(target)).toBeCloseTo(0.25, 5);
    });
  });

  describe('targetHasActiveStateType', () =>
  {
    it('is true when any active state on the target carries the type, case-insensitively', () =>
    {
      // Arrange
      const action = buildAction();
      const target = { states: () => [ { stateTypes: () => [ 'Poison' ] } ] };

      // Act & Assert
      expect(action.targetHasActiveStateType(target, 'poison')).toBe(true);
    });

    it('is false when no active state carries the type', () =>
    {
      // Arrange
      const action = buildAction();
      const target = { states: () => [ { stateTypes: () => [ 'burn' ] } ] };

      // Act & Assert
      expect(action.targetHasActiveStateType(target, 'poison')).toBe(false);
    });
  });

  describe('applyCriticalDamageMultiplier', () =>
  {
    it('sums base multiplier, cdm, and this action\'s own multiplier, then multiplies the base damage', () =>
    {
      // Arrange
      const action = buildAction({
        subject: () => ({ baseCriticalMultiplier: () => 0.5, cdm: 0.2 }),
        ownCriticalDamageMultiplier: () => 0.1,
      });

      // Act & Assert
      // multiplier = 0.5 + 0.2 + 0.1 = 0.8; 100 * 0.8 = 80.
      expect(action.applyCriticalDamageMultiplier(100)).toBeCloseTo(80, 5);
    });
  });

  describe('applyCriticalDamageReduction', () =>
  {
    it('returns the critical damage unchanged when there is no target yet', () =>
    {
      // Arrange
      const action = buildAction();

      // Act & Assert
      expect(action.applyCriticalDamageReduction(50)).toBe(50);
    });

    it('reduces critical damage by (1 - target.ctr)', () =>
    {
      // Arrange
      const action = buildAction();
      action.setTargetBattler({ ctr: 0.3 });

      // Act & Assert
      // 50 * (1 - 0.3) = 35.
      expect(action.applyCriticalDamageReduction(50)).toBeCloseTo(35, 5);
    });

    it('never reduces the reduction rate below 0 (ctr > 1 cannot flip the sign)', () =>
    {
      // Arrange
      const action = buildAction();
      action.setTargetBattler({ ctr: 2 });

      // Act & Assert
      expect(action.applyCriticalDamageReduction(50)).toBe(0);
    });
  });

  describe('applyCritical', () =>
  {
    it('adds the reduced critical bonus damage onto the base damage', () =>
    {
      // Arrange
      const action = buildAction({
        applyCriticalDamageMultiplier: baseDamage => baseDamage * 0.5,
        applyCriticalDamageReduction: criticalDamage => criticalDamage * 0.5,
      });

      // Act & Assert
      // bonus = 100 * 0.5 = 50; reduced = 50 * 0.5 = 25; total = 100 + 25 = 125.
      expect(action.applyCritical(100)).toBe(125);
    });
  });

  describe('thisCritTargetStates / thisCritSelfStates / onCritTargetStates / onCritSelfStates', () =>
  {
    it('thisCritTargetStates resolves on-chance effects from the item using ThisCritApply', () =>
    {
      // Arrange
      const item = { note: '<thisCritApply: [3, 50]>' };
      const action = buildAction({ item: () => item });

      // Act
      const effects = action.thisCritTargetStates();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(3);
    });

    it('thisCritSelfStates resolves on-chance effects from the item using ThisCritSelf', () =>
    {
      // Arrange
      const item = { note: '<thisCritSelf: [4, 25]>' };
      const action = buildAction({ item: () => item });

      // Act
      const effects = action.thisCritSelfStates();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(4);
    });

    it('onCritTargetStates resolves on-chance effects from all attacker notes using OnCritApply', () =>
    {
      // Arrange
      const action = buildAction({
        subject: () => ({ getAllNotes: () => [ { note: '<onCritApply: [5, 10]>' } ] }),
      });

      // Act
      const effects = action.onCritTargetStates();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(5);
    });

    it('onCritSelfStates resolves on-chance effects from all attacker notes using OnCritSelf', () =>
    {
      // Arrange
      const action = buildAction({
        subject: () => ({ getAllNotes: () => [ { note: '<onCritSelf: [6, 10]>' } ] }),
      });

      // Act
      const effects = action.onCritSelfStates();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(6);
    });
  });

  describe('applyOnCriticalSelfStates / applyOnCriticalTargetStates', () =>
  {
    it('rolls both per-skill and global self states against the attacker', () =>
    {
      // Arrange
      const attacker = {};
      const action = buildAction({
        subject: () => attacker,
        thisCritSelfStates: () => [ 'this-self' ],
        onCritSelfStates: () => [ 'on-self' ],
        rollAndApplyCritStates: vi.fn(),
      });

      // Act
      action.applyOnCriticalSelfStates();

      // Assert
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(1, attacker, [ 'this-self' ]);
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(2, attacker, [ 'on-self' ]);
    });

    it('rolls both per-skill and global target states against the target', () =>
    {
      // Arrange
      const target = {};
      const action = buildAction({
        thisCritTargetStates: () => [ 'this-target' ],
        onCritTargetStates: () => [ 'on-target' ],
        rollAndApplyCritStates: vi.fn(),
      });

      // Act
      action.applyOnCriticalTargetStates(target);

      // Assert
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(1, target, [ 'this-target' ]);
      expect(action.rollAndApplyCritStates).toHaveBeenNthCalledWith(2, target, [ 'on-target' ]);
    });
  });

  describe('applyOnCriticalStateEffects', () =>
  {
    it('does nothing when J.ABS is not loaded', () =>
    {
      // Arrange
      const action = buildAction({
        applyOnCriticalTargetStates: vi.fn(),
        applyOnCriticalSelfStates: vi.fn(),
      });
      const savedAbs = globalThis.J.ABS;
      globalThis.J.ABS = false;

      // Act
      action.applyOnCriticalStateEffects({});

      // Assert
      expect(action.applyOnCriticalTargetStates).not.toHaveBeenCalled();
      expect(action.applyOnCriticalSelfStates).not.toHaveBeenCalled();

      globalThis.J.ABS = savedAbs;
    });

    it('applies target then self states when J.ABS is loaded', () =>
    {
      // Arrange
      const target = {};
      const action = buildAction({
        applyOnCriticalTargetStates: vi.fn(),
        applyOnCriticalSelfStates: vi.fn(),
      });
      const savedAbs = globalThis.J.ABS;
      globalThis.J.ABS = true;

      // Act
      action.applyOnCriticalStateEffects(target);

      // Assert
      expect(action.applyOnCriticalTargetStates).toHaveBeenCalledWith(target);
      expect(action.applyOnCriticalSelfStates).toHaveBeenCalledTimes(1);

      globalThis.J.ABS = savedAbs;
    });
  });

  describe('apply', () =>
  {
    it('tracks the target and triggers on-crit state effects only when the hit was critical', () =>
    {
      // Arrange
      const action = buildAction({ applyOnCriticalStateEffects: vi.fn() });
      const criticalTarget = { result: () => ({ critical: true }) };

      // Act
      action.apply(criticalTarget);

      // Assert
      expect(action.targetBattler()).toBe(criticalTarget);
      expect(action.applyOnCriticalStateEffects).toHaveBeenCalledWith(criticalTarget);
    });

    it('does not trigger on-crit state effects for a non-critical hit', () =>
    {
      // Arrange
      const action = buildAction({ applyOnCriticalStateEffects: vi.fn() });
      const nonCriticalTarget = { result: () => ({ critical: false }) };

      // Act
      action.apply(nonCriticalTarget);

      // Assert
      expect(action.applyOnCriticalStateEffects).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/crit/_component/game-action-crit-math.test.js
