//region plugins/abs/core/_component/game-action-state-effect-application.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import {
  buildFateBattlerStub,
  installJabsFateActionForwards,
} from '../../../_base/core/_component/fixtures/install-jabs-fate.js';

/**
 * Builds a minimal Game_Action stub backed by the real prototype.
 * @returns {object}
 */
function buildAction()
{
  return Object.create(globalThis.Game_Action.prototype);
}

/**
 * Builds an action aimed at its subject's opponents, whose subject holds 110 LUK and brings no lucky or cursed rolls.
 * @param {object} [prototype] The prototype to build the action on; defaults to the real Game_Action's.
 * @returns {object}
 */
function buildRollingAction(prototype = globalThis.Game_Action.prototype)
{
  const action = Object.create(prototype);
  const subject = buildFateBattlerStub({ luk: 110 });
  action.subject = () => subject;
  action.item = () => ({});
  action.isForOpponent = () => true;
  action.isCertainHit = () => false;
  return action;
}

/**
 * Builds a target trailing a {@link buildRollingAction} subject by 60 LUK, with the given resistances. It reads every
 * state as harm unless told otherwise, so that luck gap weighs in.
 * @param {number} stateRate What its State Rate traits answer.
 * @param {number} stateTypeResistRate What its type resistance answers.
 * @param {boolean} [isHarm] Whether it reads every state as harm; defaults to true.
 * @returns {object}
 */
function buildTarget(stateRate, stateTypeResistRate, isHarm = true)
{
  return buildFateBattlerStub({
    luk: 50,
    stateRate: () => stateRate,
    stateTypeResistRate: () => stateTypeResistRate,
    state: () => ({ isNegativeType: () => isHarm }),
  });
}

describe('J-ABS Game_Action state-related effect application (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_Fate.js').default} */
  let JABS_Fate;

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

    // the very module instance Game_Action.js rolls through, so a spy on it sees what Game_Action hands over.
    ({ default: JABS_Fate } = await import('../../../../../src/plugins/abs/core/managers/JABS_Fate.js'));
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
      const subject = {};
      action.subject = () => subject;
      action.item = () => 'the-skill';
      action.makeSuccess = vi.fn();
      const target = { removeState: vi.fn() };
      action.fateRollsAgainst = () => [ 1, 0 ];
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
      const subject = {};
      action.subject = () => subject;
      action.item = () => 'the-skill';
      action.makeSuccess = vi.fn();
      const target = { removeState: vi.fn() };
      action.fateRollsAgainst = () => [ 1, 0 ];
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

  describe('resolveApplyStateProcCount', () =>
  {
    /**
     * Builds an action whose subject rates only state 5 at half, and whose state roll is recorded rather than rolled.
     * @returns {object}
     */
    function buildConvertingAction()
    {
      const action = buildAction();
      action.subject = () => ({ attackStatesRate: stateId => (stateId === 5 ? 0.5 : 1) });
      action.resolveStateProcCountAgainst = vi.fn(() => 2);
      return action;
    }

    it('converts the skill effect\'s decimal chance into the percent the state roll takes', () =>
    {
      // Arrange
      const action = buildConvertingAction();
      const target = {};

      // Act
      const procCount = action.resolveApplyStateProcCount(target, 5, 0.4, false);

      // Assert- the attacker's half rate for state 5 is set aside for anything but a normal attack's states.
      expect(procCount).toBe(2);
      expect(action.resolveStateProcCountAgainst).toHaveBeenCalledWith(target, 5, 40);
    });

    it('folds the attacker\'s own rate for the state into the percent for the states a normal attack carries', () =>
    {
      // Arrange
      const action = buildConvertingAction();
      const target = {};

      // Act
      action.resolveApplyStateProcCount(target, 5, 0.4, true);

      // Assert- 40% at the attacker's half rate for state 5.
      expect(action.resolveStateProcCountAgainst).toHaveBeenCalledWith(target, 5, 20);
    });

    it('rolls a skill effect\'s 40% chance against a partial resist and a LUK gap to an exact d100', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      const target = buildTarget(0.5, 0.75);

      // Act
      const procCount = action.resolveApplyStateProcCount(target, 5, 0.4, false);

      // Assert- 40 x 0.5 x 0.75 x 1.06 = 15.9; a percent read as a decimal would round to 0, converted twice 1590.
      expect(procCount).toBe(1);
      expect(procSpy).toHaveBeenCalledWith(action.subject(), 16, 1, 0);
      procSpy.mockRestore();
    });
  });

  describe('resolveStateProcCountAgainst', () =>
  {
    it('rolls the state with this action, counting the landings by its subject', () =>
    {
      // Arrange
      const rollSpy = vi.spyOn(JABS_Fate, 'resolveActionStateProcCount')
        .mockReturnValue(2);
      const action = buildRollingAction();
      const target = {};

      // Act
      const procCount = action.resolveStateProcCountAgainst(target, 5, 40);

      // Assert
      expect(procCount).toBe(2);
      expect(rollSpy).toHaveBeenCalledWith(action, target, 5, 40, action.subject());
      rollSpy.mockRestore();
    });

    it('counts the landings by a positive roller the caller hands over', () =>
    {
      // Arrange
      const rollSpy = vi.spyOn(JABS_Fate, 'resolveActionStateProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      const target = {};
      const positiveRoller = { isVeryLucky: () => true };

      // Act
      action.resolveStateProcCountAgainst(target, 5, 40, positiveRoller);

      // Assert
      expect(rollSpy).toHaveBeenCalledWith(action, target, 5, 40, positiveRoller);
      rollSpy.mockRestore();
    });

    it('counts the landings by the roller chanceRollerAgainst names for the target when none is handed over', () =>
    {
      // Arrange- the seam answers with a stand-in for this target only, so asking about the wrong one shows as null.
      const rollSpy = vi.spyOn(JABS_Fate, 'resolveActionStateProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      const target = {};
      const standIn = { isVeryLucky: () => true };
      action.chanceRollerAgainst = aimedAt => (aimedAt === target ? standIn : null);

      // Act
      action.resolveStateProcCountAgainst(target, 5, 40);

      // Assert
      expect(rollSpy).toHaveBeenCalledWith(action, target, 5, 40, standIn);
      rollSpy.mockRestore();
    });

    it('gives harm aimed at a cursed target one more chance to land per curse it carries', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      const target = buildTarget(0.5, 0.75);
      target.getNegativeRolls = () => 3;

      // Act
      action.resolveStateProcCountAgainst(target, 5, 40);

      // Assert- the target's 3 curses join the subject's one chance.
      expect(procSpy).toHaveBeenCalledWith(action.subject(), 16, 4, 0);
      procSpy.mockRestore();
    });

    it('makes help aimed at a cursed target clear every curse it carries', () =>
    {
      // Arrange- the same cursed target, given a blessing by an action for the subject's friends.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      action.isForOpponent = () => false;
      const target = buildTarget(0.5, 0.75, false);
      target.getNegativeRolls = () => 3;

      // Act
      action.resolveStateProcCountAgainst(target, 5, 40);

      // Assert- 40 x 0.5 x 0.75 = 15 with no luck on a blessing; the target's 3 curses are hurdles to clear.
      expect(procSpy).toHaveBeenCalledWith(action.subject(), 15, 1, 3);
      procSpy.mockRestore();
    });

    it('brings the subject\'s fate once, against its own resistances, when it aims a state at itself', () =>
    {
      // Arrange- aimed as harm, so its 2 curses counted again as the target's would add chances.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      const subject = action.subject();
      subject.stateRate = () => 0.5;
      subject.getNegativeRolls = () => 2;
      subject.getNegativeRollsForSkill = () => 2;

      // Act
      action.resolveStateProcCountAgainst(subject, 5, 40);

      // Assert- 40 x 0.5 with no luck edge over itself, and its own fate once: 1 chance, then its 2 curses.
      expect(procSpy).toHaveBeenCalledWith(subject, 20, 1, 2);
      procSpy.mockRestore();
    });
  });

  describe('chanceRollerAgainst', () =>
  {
    it('names the subject as the roller for a roll aimed at any target', () =>
    {
      // Arrange
      const action = buildRollingAction();
      const target = buildTarget(1, 1);

      // Act
      const roller = action.chanceRollerAgainst(target);

      // Assert- the subject, not the target it is aimed at.
      expect(roller).toBe(action.subject());
      expect(roller).not.toBe(target);
    });
  });

  describe('a certain hit and the states it carries', () =>
  {
    it('still meets the target\'s resistances', () =>
    {
      // Arrange- no luck gap, so only the resistances shape the chance.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      action.isCertainHit = () => true;
      const target = buildTarget(0.5, 0.75);
      target.luk = 110;

      // Act
      action.resolveApplyStateProcCount(target, 5, 0.4, false);

      // Assert- 40 x 0.5 x 0.75 = 15; a certain hit setting them aside would roll the authored 40.
      expect(procSpy).toHaveBeenCalledWith(action.subject(), 15, 1, 0);
      procSpy.mockRestore();
    });

    it('still meets the luck between the two battlers', () =>
    {
      // Arrange- no resistances, so only the subject's 60 LUK over the target shapes the chance.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const action = buildRollingAction();
      action.isCertainHit = () => true;
      const target = buildTarget(1, 1);

      // Act
      action.resolveApplyStateProcCount(target, 5, 0.4, false);

      // Assert- 40 x 1.06 = 42.4; a certain hit setting the luck aside would roll the authored 40.
      expect(procSpy).toHaveBeenCalledWith(action.subject(), 42, 1, 0);
      procSpy.mockRestore();
    });
  });

  describe('the shared fixture\'s Game_Action forwards', () =>
  {
    /**
     * Installs the fixture's forwards onto a Game_Action of their own, apart from the real one this realm loaded.
     * @returns {object} The prototype carrying the forwards.
     */
    function buildForwardedPrototype()
    {
      const sandbox = { Game_Action: function FixtureAction() {} };
      installJabsFateActionForwards(sandbox);
      return sandbox.Game_Action.prototype;
    }

    it('answer fateRollsAgainst exactly as J-ABS\'s own Game_Action does', () =>
    {
      // Arrange- one subject, item and aim shared by both actions, against a cursed target.
      const real = buildRollingAction();
      const forwarded = Object.create(buildForwardedPrototype());
      forwarded.subject = real.subject;
      forwarded.item = real.item;
      forwarded.isForOpponent = real.isForOpponent;
      const target = buildFateBattlerStub({ getNegativeRolls: () => 3 });

      // Act
      const forwardedRolls = forwarded.fateRollsAgainst(target);

      // Assert
      expect(forwardedRolls).toEqual(real.fateRollsAgainst(target));
      expect(forwardedRolls).toEqual([ 4, 0 ]);
    });

    it('answer chanceRollerAgainst exactly as J-ABS\'s own Game_Action does', () =>
    {
      // Arrange- one subject shared by both actions.
      const real = buildRollingAction();
      const forwarded = Object.create(buildForwardedPrototype());
      forwarded.subject = real.subject;
      const target = buildTarget(1, 1);

      // Act
      const forwardedRoller = forwarded.chanceRollerAgainst(target);

      // Assert
      expect(forwardedRoller).toBe(real.chanceRollerAgainst(target));
      expect(forwardedRoller).toBe(real.subject());
    });

    it('answer resolveStateProcCountAgainst exactly as J-ABS\'s own Game_Action does', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const real = buildRollingAction();
      const forwarded = Object.create(buildForwardedPrototype());
      forwarded.subject = real.subject;
      forwarded.item = real.item;
      forwarded.isForOpponent = real.isForOpponent;
      const target = buildTarget(0.5, 0.75);

      // Act
      forwarded.resolveStateProcCountAgainst(target, 5, 40);
      real.resolveStateProcCountAgainst(target, 5, 40);

      // Assert
      const [ forwardedCall, realCall ] = procSpy.mock.calls;
      expect(forwardedCall).toEqual(realCall);
      expect(forwardedCall).toEqual([ real.subject(), 16, 1, 0 ]);
      procSpy.mockRestore();
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
