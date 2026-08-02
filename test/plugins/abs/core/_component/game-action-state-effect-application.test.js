//region plugins/abs/core/_component/game-action-state-effect-application.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal Game_Action stub backed by the real prototype.
 * @returns {object}
 */
function buildAction()
{
  return Object.create(globalThis.Game_Action.prototype);
}

describe('J-ABS Game_Action state-related effect application (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('itemEffectAddState (JABS override)', () =>
  {
    it('performs original logic when state effects are allowed', () =>
    {
      // Arrange
      const action = buildAction();
      action.canItemEffectAddState = () => true;
      const originalFn = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectAddState', originalFn);
      const target = {};
      const effect = {};

      // Act
      action.itemEffectAddState(target, effect);

      // Assert
      expect(originalFn).toHaveBeenCalledWith(target, effect);
    });

    it('skips original logic entirely when state effects are not allowed', () =>
    {
      // Arrange
      const action = buildAction();
      action.canItemEffectAddState = () => false;
      const originalFn = vi.fn();
      globalThis.J.ABS.Aliased.Game_Action.set('itemEffectAddState', originalFn);

      // Act
      action.itemEffectAddState({}, {});

      // Assert
      expect(originalFn).not.toHaveBeenCalled();
    });
  });

  describe('canItemEffectAddState', () =>
  {
    it('is false when the target result was parried', () =>
    {
      // Arrange
      const action = buildAction();
      const target = { result: () => ({ parried: true }) };

      // Act & Assert
      expect(action.canItemEffectAddState(target, {})).toBe(false);
    });

    it('is true when the target result exists but was not parried', () =>
    {
      // Arrange
      const action = buildAction();
      const target = { result: () => ({ parried: false }) };

      // Act & Assert
      expect(action.canItemEffectAddState(target, {})).toBe(true);
    });

    it('is true when there is no result at all', () =>
    {
      // Arrange
      const action = buildAction();
      const target = { result: () => null };

      // Act & Assert
      expect(action.canItemEffectAddState(target, {})).toBe(true);
    });
  });

  describe('itemEffectAddAttackState', () =>
  {
    it('does nothing when the attacker has no attack states', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ attackStates: () => [] });
      action.handleApplyState = vi.fn();

      // Act
      action.itemEffectAddAttackState({}, { value1: 0.5 });

      // Assert
      expect(action.handleApplyState).not.toHaveBeenCalled();
    });

    it('attempts to apply every one of the attacker\'s attack states', () =>
    {
      // Arrange
      const action = buildAction();
      action.subject = () => ({ attackStates: () => [ 10, 11 ] });
      action.handleApplyState = vi.fn();
      const target = {};

      // Act
      action.itemEffectAddAttackState(target, { value1: 0.5 });

      // Assert
      expect(action.handleApplyState).toHaveBeenCalledWith(target, 10, 0.5, true);
      expect(action.handleApplyState).toHaveBeenCalledWith(target, 11, 0.5, true);
    });
  });

  describe('itemEffectAddNormalState', () =>
  {
    it('applies the state from the effect\'s dataId/value1 without the attacker state rate', () =>
    {
      // Arrange
      const action = buildAction();
      action.handleApplyState = vi.fn();
      const target = {};

      // Act
      action.itemEffectAddNormalState(target, { value1: 0.3, dataId: 12 });

      // Assert
      expect(action.handleApplyState).toHaveBeenCalledWith(target, 12, 0.3, false);
    });
  });

  describe('itemEffectRemoveState', () =>
  {
    it('removes the state and flags success when the fated roll passes', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { getPositiveRollsForSkill: () => 0 };
      action.subject = () => subject;
      action.item = () => 'the-skill';
      action.makeSuccess = vi.fn();
      const target = { removeState: vi.fn(), getNegativeRolls: () => 0 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(true);

      // Act
      action.itemEffectRemoveState(target, { value1: 1, dataId: 5 });

      // Assert
      expect(target.removeState).toHaveBeenCalledWith(5);
      expect(action.makeSuccess).toHaveBeenCalledWith(target);
      fateSpy.mockRestore();
    });

    it('does nothing when the fated roll fails', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { getPositiveRollsForSkill: () => 0 };
      action.subject = () => subject;
      action.item = () => 'the-skill';
      action.makeSuccess = vi.fn();
      const target = { removeState: vi.fn(), getNegativeRolls: () => 0 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(false);

      // Act
      action.itemEffectRemoveState(target, { value1: 1, dataId: 5 });

      // Assert
      expect(target.removeState).not.toHaveBeenCalled();
      expect(action.makeSuccess).not.toHaveBeenCalled();
      fateSpy.mockRestore();
    });
  });

  describe('handleApplyState', () =>
  {
    it('applies the state effect once per resolved proc count', () =>
    {
      // Arrange
      const action = buildAction();
      action.resolveApplyStateProcCount = () => 3;
      action.applyStateEffect = vi.fn();
      const target = {};

      // Act
      action.handleApplyState(target, 5, 0.5, false);

      // Assert
      expect(action.applyStateEffect).toHaveBeenCalledTimes(3);
      expect(action.applyStateEffect).toHaveBeenCalledWith(target, 5);
    });

    it('does not apply the state at all when the proc count resolves to zero', () =>
    {
      // Arrange
      const action = buildAction();
      action.resolveApplyStateProcCount = () => 0;
      action.applyStateEffect = vi.fn();

      // Act
      action.handleApplyState({}, 5, 0.5, false);

      // Assert
      expect(action.applyStateEffect).not.toHaveBeenCalled();
    });
  });

  describe('calculateStateApplicationD100', () =>
  {
    function buildContext({
      attackStatesRate = 1,
      stateRate = 1,
      stateTypeResistRate = 1,
      lukEffectRate = 1,
      certainHit = false,
    } = {})
    {
      const action = buildAction();
      action.subject = () => ({ attackStatesRate: () => attackStatesRate });
      action.lukEffectRate = () => lukEffectRate;
      action.isCertainHit = () => certainHit;
      const target = {
        stateRate: () => stateRate,
        stateTypeResistRate: () => stateTypeResistRate,
      };
      return { action, target };
    }

    it('applies only the luck modifier when useAttackerStateRate is false and resistances are skipped', () =>
    {
      // Arrange- certain hit skips target resistances entirely.
      const { action, target } = buildContext({ lukEffectRate: 0.5, certainHit: true });

      // Act- baseChance 1.0 * 1.0 (no attacker rate) * 0.5 (luck) = 0.5 -> 50.
      const d100 = action.calculateStateApplicationD100(target, 5, 1.0, false);

      // Assert
      expect(d100).toBe(50);
    });

    it('folds in the attacker state rate when useAttackerStateRate is true', () =>
    {
      // Arrange
      const { action, target } = buildContext({ attackStatesRate: 0.5, certainHit: true });

      // Act- 1.0 * 0.5 (attacker rate) * 1.0 (luck) = 0.5 -> 50.
      const d100 = action.calculateStateApplicationD100(target, 5, 1.0, true);

      // Assert
      expect(d100).toBe(50);
    });

    it('folds in target resistances when the action is not a certain hit', () =>
    {
      // Arrange
      const { action, target } = buildContext({ stateRate: 0.5, stateTypeResistRate: 0.5, certainHit: false });

      // Act- 1.0 * 0.5 * 0.5 * 1.0 (luck) = 0.25 -> 25.
      const d100 = action.calculateStateApplicationD100(target, 5, 1.0, false);

      // Assert
      expect(d100).toBe(25);
    });
  });

  describe('shouldApplyState', () =>
  {
    it('returns the fated roll outcome, forwarding positive/negative rolls', () =>
    {
      // Arrange
      const action = buildAction();
      action.calculateStateApplicationD100 = () => 80;
      const subject = { getPositiveRollsForSkill: () => 1 };
      action.subject = () => subject;
      action.item = () => 'skill';
      const target = { getNegativeRolls: () => 2 };
      const fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100')
        .mockReturnValue(true);

      // Act
      const result = action.shouldApplyState(target, 5, 0.8, false);

      // Assert
      expect(result).toBe(true);
      expect(fateSpy).toHaveBeenCalledWith(subject, 80, 2, 2);
      fateSpy.mockRestore();
    });
  });

  describe('resolveApplyStateProcCount', () =>
  {
    it('delegates to RPGManager.resolveProcCount with the resolved d100 and rolls', () =>
    {
      // Arrange
      const action = buildAction();
      action.calculateStateApplicationD100 = () => 60;
      const subject = { getPositiveRollsForSkill: () => 0 };
      action.subject = () => subject;
      action.item = () => 'skill';
      const target = { getNegativeRolls: () => 0 };
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(2);

      // Act
      const result = action.resolveApplyStateProcCount(target, 5, 0.6, true);

      // Assert
      expect(result).toBe(2);
      expect(procSpy).toHaveBeenCalledWith(subject, 60, 1, 0);
      procSpy.mockRestore();
    });
  });

  describe('shouldTargetApplyResistances', () =>
  {
    it('is false for certain-hit actions', () =>
    {
      const action = buildAction();
      action.isCertainHit = () => true;
      expect(action.shouldTargetApplyResistances()).toBe(false);
    });

    it('is true for non-certain-hit actions', () =>
    {
      const action = buildAction();
      action.isCertainHit = () => false;
      expect(action.shouldTargetApplyResistances()).toBe(true);
    });
  });

  describe('applyStateEffect', () =>
  {
    it('applies the state with the subject/item as attacker/source, then flags success', () =>
    {
      // Arrange
      const action = buildAction();
      const subject = { name: 'caster' };
      action.subject = () => subject;
      action.item = () => 'the-skill';
      action.makeSuccess = vi.fn();
      const target = { addState: vi.fn() };

      // Act
      action.applyStateEffect(target, 7);

      // Assert
      expect(target.addState).toHaveBeenCalledWith(7, subject, 'the-skill');
      expect(action.makeSuccess).toHaveBeenCalledWith(target);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-state-effect-application.test.js
