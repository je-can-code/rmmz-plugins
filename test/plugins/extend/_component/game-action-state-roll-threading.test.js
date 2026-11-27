//region plugins/extend/_component/game-action-state-roll-threading.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';
import { buildFateBattlerStub } from '../../_base/core/_component/fixtures/install-jabs-fate.js';
import JABS_OnChanceEffect from '../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js';

describe('J-SkillExtend Game_Action state roll threading (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/core/JCache.js'));

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  /**
   * Builds a duck-typed JABS_OnChanceEffect stand-in naming one state at 40%, which records what every removal roll
   * was handed and lands or misses as told.
   * @param {number} stateId The id of the state the effect names.
   * @param {boolean} [lands] What every removal roll answers; defaults to landing.
   * @returns {object}
   */
  function buildEffect(stateId, lands = true)
  {
    const calls = [];
    return {
      skillId: stateId,
      chance: 40,
      baseSkill: () => ({ note: '' }),
      shouldTrigger(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push({ rollForPositive, rollForNegative, positiveRoller });
        return lands;
      },
      __calls: calls,
    };
  }

  /**
   * Builds an action whose subject is the given caster, aimed at the caster's opponents or not, as told.
   * @param {object} caster The battler executing the action.
   * @param {boolean} isForOpponent Whether the action is aimed at the caster's opponents.
   * @returns {object}
   */
  function buildAction(caster, isForOpponent)
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    action.subject = () => caster;
    action.item = () => ({ note: '' });
    action.isForOpponent = () => isForOpponent;
    action.loseState = vi.fn();
    action.stripState = vi.fn();
    return action;
  }

  /**
   * Builds a caster carrying three lucky rolls and one curse with the skill it is using, and four curses
   * battler-wide, so a roll reading the battler-wide curse instead of the skill's shows in its hurdles.
   * @returns {object}
   */
  function buildCaster()
  {
    return buildFateBattlerStub({
      getPositiveRollsForSkill: () => 3,
      getNegativeRollsForSkill: () => 1,
      getNegativeRolls: () => 4,
      addState: vi.fn(),
    });
  }

  /**
   * Builds a target carrying two curses, whose removed states are recorded.
   * @returns {object}
   */
  function buildCursedTarget()
  {
    return buildFateBattlerStub({
      getNegativeRolls: () => 2,
      removeState: vi.fn(),
    });
  }

  describe('applyStates', () =>
  {
    it('hands each state and its authored percent to this action\'s state roll against the target', () =>
    {
      // Arrange- the effect authors its chance as a percent, which the roll takes as it is. the target is a battler
      // other than the caster, so a roll aimed at the caster instead shows.
      const caster = buildCaster();
      const target = buildFateBattlerStub({ addState: vi.fn() });
      const action = buildAction(caster, true);
      action.resolveStateProcCountAgainst = vi.fn(() => 1);

      // Act
      action.applyStates(target, [ buildEffect(3) ]);

      // Assert- no roller of its own, so the roll is left to name one.
      expect(action.resolveStateProcCountAgainst).toHaveBeenCalledWith(target, 3, 40, null);
    });

    it('hands every roll the positive roller its caller passes', () =>
    {
      // Arrange
      const caster = buildCaster();
      const target = buildFateBattlerStub({ addState: vi.fn() });
      const action = buildAction(caster, true);
      action.resolveStateProcCountAgainst = vi.fn(() => 0);
      const standIn = { isVeryLucky: () => true };

      // Act
      action.applyStates(target, [ buildEffect(3), buildEffect(4) ], standIn);

      // Assert
      expect(action.resolveStateProcCountAgainst.mock.calls).toEqual([
        [ target, 3, 40, standIn ],
        [ target, 4, 40, standIn ],
      ]);
    });

    it('adds the state once per landing, attributed to the caster and the executing skill, never a lookalike', () =>
    {
      // Arrange- two landings. the real on-chance effect names state 3, and the caster knows a skill row that shares
      // that id: the row a lookup by the effect's id would find. the target is a battler other than the caster, so
      // adding the state to the caster instead shows.
      const executingSkill = { id: 77, note: '' };
      const lookalikeSkill = { id: 3, note: '' };
      const caster = buildCaster();
      caster.skill = skillId => (skillId === 3 ? lookalikeSkill : { id: skillId, note: '' });
      const target = buildFateBattlerStub({ addState: vi.fn() });
      const action = buildAction(caster, true);
      action.item = () => executingSkill;
      action.resolveStateProcCountAgainst = () => 2;
      const effect = new JABS_OnChanceEffect(3, 40, 'onHitSelfState');

      // Act
      action.applyStates(target, [ effect ]);

      // Assert- both landings record the executing skill itself.
      const [ [ , , firstSource ], [ , , secondSource ] ] = target.addState.mock.calls;
      expect(target.addState.mock.calls).toEqual([ [ 3, caster, executingSkill ], [ 3, caster, executingSkill ] ]);
      expect(firstSource).toBe(executingSkill);
      expect(secondSource).toBe(executingSkill);
      expect(caster.addState).not.toHaveBeenCalled();
    });

    it('adds the state when no skill row shares the state\'s id at all', () =>
    {
      // Arrange- every skill lookup the caster could be asked for throws, the way an overlay lookup does for an id
      // with no row behind it.
      const executingSkill = { id: 77, note: '' };
      const caster = buildCaster();
      caster.skill = skillId =>
      {
        throw new Error(`no skill row with id ${skillId}`);
      };
      const target = buildFateBattlerStub({ addState: vi.fn() });
      const action = buildAction(caster, true);
      action.item = () => executingSkill;
      action.resolveStateProcCountAgainst = () => 1;
      const effect = new JABS_OnChanceEffect(3, 40, 'onHitSelfState');

      // Act
      action.applyStates(target, [ effect ]);

      // Assert
      expect(target.addState.mock.calls).toEqual([ [ 3, caster, executingSkill ] ]);
    });

    it('adds nothing when the roll never lands', () =>
    {
      // Arrange
      const caster = buildCaster();
      const target = buildFateBattlerStub({ addState: vi.fn() });
      const action = buildAction(caster, true);
      action.resolveStateProcCountAgainst = vi.fn(() => 0);

      // Act
      action.applyStates(target, [ buildEffect(3) ]);

      // Assert- the state was rolled for, and nothing was added.
      expect(action.resolveStateProcCountAgainst).toHaveBeenCalledTimes(1);
      expect(target.addState).not.toHaveBeenCalled();
    });
  });

  describe('rollStateRemovalAgainst', () =>
  {
    it('lets the roller chanceRollerAgainst names for the target settle the roll when none is handed over', () =>
    {
      // Arrange- the seam answers with a stand-in for this target only.
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const standIn = { isVeryLucky: () => true };
      action.chanceRollerAgainst = aimedAt => (aimedAt === target ? standIn : caster);
      const effect = buildEffect(9);

      // Act
      action.rollStateRemovalAgainst(target, effect);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 6, rollForNegative: 1, positiveRoller: standIn } ]);
    });

    it('lets a roller its caller hands over settle the roll instead', () =>
    {
      // Arrange- the seam would name the caster; the caller's own stand-in wins.
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const standIn = { isVeryLucky: () => true };
      const effect = buildEffect(9);

      // Act
      action.rollStateRemovalAgainst(target, effect, standIn);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 6, rollForNegative: 1, positiveRoller: standIn } ]);
    });
  });

  describe('applyOnHitStateEffects', () =>
  {
    it('rolls the on-hit self and lose states with the roller named for the battler that was struck', () =>
    {
      // Arrange- the seam answers with a stand-in for the struck battler only, so a roller named for the caster
      // itself shows as the caster.
      const caster = buildCaster();
      const struck = buildCursedTarget();
      const action = buildAction(caster, true);
      const standIn = { isVeryLucky: () => true };
      const selfEffect = buildEffect(3);
      const loseEffect = buildEffect(7);
      action.canApplyOnHitStateEffects = () => true;
      action.chanceRollerAgainst = aimedAt => (aimedAt === struck ? standIn : caster);
      action.onHitSelfStates = () => [ selfEffect ];
      action.onHitLoseStates = () => [ loseEffect ];
      action.applyStates = vi.fn();
      action.loseStates = vi.fn();
      action.applyOnHitApplyStates = vi.fn();
      action.applyOnHitStripStates = vi.fn();
      action.applyOnHitRemoveStates = vi.fn();

      // Act
      action.applyOnHitStateEffects(struck);

      // Assert
      expect(action.applyStates).toHaveBeenCalledWith(caster, [ selfEffect ], standIn);
      expect(action.loseStates).toHaveBeenCalledWith(caster, [ loseEffect ], standIn);
    });
  });

  describe('loseStates', () =>
  {
    it('rolls a lose-state with the caster\'s fate counted once, and loses the state when it lands', () =>
    {
      // Arrange- the caster loses its own state: its one chance plus three lucky rolls, and only its one curse with
      // this skill as a hurdle, never its battler-wide curse a second time as the target's.
      const caster = buildCaster();
      const action = buildAction(caster, true);
      const effect = buildEffect(7);

      // Act
      action.loseStates(caster, [ effect ]);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 1, positiveRoller: caster } ]);
      expect(action.loseState).toHaveBeenCalledWith(caster, 7);
    });

    it('loses nothing when the roll misses', () =>
    {
      // Arrange
      const caster = buildCaster();
      const action = buildAction(caster, true);
      const effect = buildEffect(7, false);

      // Act
      action.loseStates(caster, [ effect ]);

      // Assert- the state was rolled for, and nothing was lost.
      expect(effect.__calls).toHaveLength(1);
      expect(action.loseState).not.toHaveBeenCalled();
    });
  });

  describe('stripStates', () =>
  {
    it('gives a strip aimed at a cursed foe one more chance per curse, and strips the state when it lands', () =>
    {
      // Arrange- a strip aimed at the caster's opponents is harm: the foe's two curses join the caster's one chance
      // and three lucky rolls, and only the caster's own curse with this skill stands as a hurdle.
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const effect = buildEffect(9);

      // Act
      action.stripStates(target, [ effect ]);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 6, rollForNegative: 1, positiveRoller: caster } ]);
      expect(action.stripState).toHaveBeenCalledWith(target, 9);
    });

    it('makes a strip aimed at a cursed ally clear one more hurdle per curse', () =>
    {
      // Arrange- a strip aimed at anyone else is help: the ally's two curses join the caster's own curse as hurdles.
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, false);
      const effect = buildEffect(9);

      // Act
      action.stripStates(target, [ effect ]);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 3, positiveRoller: caster } ]);
    });

    it('strips nothing when the roll misses', () =>
    {
      // Arrange
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const effect = buildEffect(9, false);

      // Act
      action.stripStates(target, [ effect ]);

      // Assert- the state was rolled for, and nothing was stripped.
      expect(effect.__calls).toHaveLength(1);
      expect(action.stripState).not.toHaveBeenCalled();
    });
  });

  describe('removeStates', () =>
  {
    it('gives a removal aimed at a cursed foe one more chance per curse, and removes the state when it lands', () =>
    {
      // Arrange- the same harm a strip is: the foe's two curses become chances for the caster.
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const effect = buildEffect(11);

      // Act
      action.removeStates(target, [ effect ]);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 6, rollForNegative: 1, positiveRoller: caster } ]);
      expect(target.removeState).toHaveBeenCalledWith(11);
    });

    it('removes nothing when the roll misses', () =>
    {
      // Arrange
      const caster = buildCaster();
      const target = buildCursedTarget();
      const action = buildAction(caster, true);
      const effect = buildEffect(11, false);

      // Act
      action.removeStates(target, [ effect ]);

      // Assert- the state was rolled for, and nothing was removed.
      expect(effect.__calls).toHaveLength(1);
      expect(target.removeState).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/extend/_component/game-action-state-roll-threading.test.js
