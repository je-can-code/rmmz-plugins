//region plugins/crit/_component/crit-state-roll-threading.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';
import {
  buildFateBattlerStub,
  installJabsFateActionForwards,
} from '../../_base/core/_component/fixtures/install-jabs-fate.js';
import JABS_OnChanceEffect from '../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js';

/**
 * The state every on-crit tag in this suite carries.
 * @type {number}
 */
const STATE_ID = 5;

/**
 * A sibling state, resisted by nobody, that a roll reading the wrong id would land on instead.
 * @type {number}
 */
const SIBLING_STATE_ID = 6;

describe('J-CriticalFactors Game_Action on-crit state rolls (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCritHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // J-Crit's own bootstrap, for its real on-crit tag shapes.
    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    // a bare stand-in for vanilla's Game_Action, which J-Crit's own file augments below.
    function Game_Action()
    {
    }

    globalThis.Game_Action = Game_Action;

    // J-ABS's state roll and the two action entries forwarding to it; this realm never loads J-ABS's Game_Action.js.
    installJabsFateActionForwards();

    // RPGManager reads on-chance tags into J-ABS's own on-chance effect, a bare global by ship time.
    globalThis.JABS_OnChanceEffect = JABS_OnChanceEffect;

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_Action.js');
  });

  /**
   * Builds the attacker: 110 LUK, 2 lucky rolls and 1 cursed roll with the given skill in hand, and 3 battler-wide
   * curses. A roll made with any other skill reads 50 of each, so reading the wrong skill shows in the counts. It
   * resists the suite's state by half through State Rate and by a quarter through its type, which only a state it
   * gives itself meets. It records every state added to it.
   * @param {object} skill The skill the action is executing.
   * @param {object} [overrides] Members to replace on the stand-in.
   * @returns {object}
   */
  function buildAttacker(skill, overrides = {})
  {
    const added = [];

    return buildFateBattlerStub({
      luk: 110,
      stateRate: stateId => (stateId === STATE_ID ? 0.5 : 1),
      stateTypeResistRate: stateId => (stateId === STATE_ID ? 0.75 : 1),
      getNegativeRolls: () => 3,
      getPositiveRollsForSkill: rolledWith => (rolledWith === skill ? 2 : 50),
      getNegativeRollsForSkill: rolledWith => (rolledWith === skill ? 1 : 50),
      isForceCritProcs: () => false,
      getAllNotes: () => [],
      skill: skillId => ({ id: skillId, note: '' }),
      addState: (...args) => added.push(args),
      __added: added,
      ...overrides,
    });
  }

  /**
   * Builds the target: 50 LUK, so the attacker holds 60 over it, and 3 curses. It resists the suite's state by half
   * through State Rate and by a quarter through its type, and reads it as harm, so a 40% chance comes to
   * 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16. It records every state added to it.
   * @param {object} [overrides] Members to replace on the stand-in.
   * @returns {object}
   */
  function buildTarget(overrides = {})
  {
    const added = [];

    return buildFateBattlerStub({
      luk: 50,
      stateRate: stateId => (stateId === STATE_ID ? 0.5 : 1),
      stateTypeResistRate: stateId => (stateId === STATE_ID ? 0.75 : 1),
      state: () => ({ isNegativeType: () => true }),
      getNegativeRolls: () => 3,
      addState: (...args) => added.push(args),
      __added: added,
      ...overrides,
    });
  }

  /**
   * Builds an action over the real J-Crit prototype, with the J-ABS entries the realm forwards to the real roll.
   * @param {object} subject The attacker.
   * @param {object} item The skill being executed.
   * @param {boolean} [isForOpponent] Whether the action targets the attacker's opponents; defaults to true.
   * @returns {object}
   */
  function buildAction(subject, item, isForOpponent = true)
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    action.subject = () => subject;
    action.item = () => item;
    action.isForOpponent = () => isForOpponent;
    return action;
  }

  /**
   * Stubs Math.randomInt so every die lands on its lowest face, the one every chance above zero accepts.
   * @returns {object} The spy, for the test to restore.
   */
  function stubDiceToLand()
  {
    return vi.spyOn(Math, 'randomInt')
      .mockReturnValue(0);
  }

  describe('rollAndApplyCritStates', () =>
  {
    it('does not even resolve the attacker when there is nothing to roll', () =>
    {
      // Arrange- this runs on every critical hit, and the overwhelming majority of skills carry no
      // crit-state tags at all. Bailing before `subject()` is what keeps that common case free.
      let subjectReads = 0;
      const action = Object.create(globalThis.Game_Action.prototype);
      action.subject = () =>
      {
        subjectReads += 1;

        return {};
      };

      // Act
      action.rollAndApplyCritStates({ addState: () => {} }, []);

      // Assert
      expect(subjectReads).toBe(0);
    });

    it('rolls a target state\'s percent chance against the target\'s resistances and the luck gap, as harm', () =>
    {
      // Arrange- the tag's 40 reaches the roll as a percent, through the real tag reader.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);
      const item = { note: `<thisCritApply:[${STATE_ID}, 40]>` };
      const attacker = buildAttacker(item);
      const target = buildTarget();
      const action = buildAction(attacker, item, true);

      // Act
      action.applyOnCriticalTargetStates(target);

      // Assert- 16 is 40 x 0.5 x 0.75 x 1.06; the target's 3 curses are chances: 1 + 2 + 3, then the skill's 1.
      expect(procSpy).toHaveBeenCalledTimes(1);
      expect(procSpy).toHaveBeenCalledWith(attacker, 16, 6, 1);
      procSpy.mockRestore();
    });

    it('rolls a target state as help when the action does not target the attacker\'s opponents', () =>
    {
      // Arrange- everything as the harm case above, aimed at an ally instead.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);
      const item = { note: `<thisCritApply:[${STATE_ID}, 40]>` };
      const attacker = buildAttacker(item);
      const target = buildTarget();
      const action = buildAction(attacker, item, false);

      // Act
      action.applyOnCriticalTargetStates(target);

      // Assert- the target's 3 curses are hurdles instead: 1 + 2, then the skill's 1 and the target's 3.
      expect(procSpy).toHaveBeenCalledTimes(1);
      expect(procSpy).toHaveBeenCalledWith(attacker, 16, 3, 4);
      procSpy.mockRestore();
    });

    it('rolls a self state against the attacker\'s own resistances, with no luck edge and its fate counted once', () =>
    {
      // Arrange- aimed as harm, so the attacker's own 3 curses counted again as a recipient's would add chances.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);
      const item = { note: `<thisCritSelf:[${STATE_ID}, 40]>` };
      const attacker = buildAttacker(item);
      const action = buildAction(attacker, item, true);

      // Act
      action.applyOnCriticalSelfStates();

      // Assert- 15 is 40 x 0.5 x 0.75 with no luck over itself; its fate once: 1 + 2, then the skill's 1.
      expect(procSpy).toHaveBeenCalledTimes(1);
      expect(procSpy).toHaveBeenCalledWith(attacker, 15, 3, 1);
      procSpy.mockRestore();
    });

    it('adds each state once per landing of its own roll, sourced to the attacker and the skill that crit', () =>
    {
      // Arrange- the sibling effect's roll lands nothing, so nothing of it may be added. the attacker knows a skill
      // row sharing the state's id: the row a lookup by the effect's id would find, and never the right source.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(0);
      const item = { id: 77, note: '' };
      const lookalikeSkill = { id: STATE_ID, note: '' };
      const attacker = buildAttacker(item, {
        skill: skillId => (skillId === STATE_ID ? lookalikeSkill : { id: skillId, note: '' }),
      });
      const target = buildTarget();
      const action = buildAction(attacker, item, true);
      const effects = [
        new JABS_OnChanceEffect(STATE_ID, 40, 'thisCritApply'),
        new JABS_OnChanceEffect(SIBLING_STATE_ID, 40, 'thisCritApply'),
      ];

      // Act
      action.rollAndApplyCritStates(target, effects);

      // Assert- both landings record the executing skill itself.
      const [ [ , , firstSource ], [ , , secondSource ] ] = target.__added;
      expect(target.__added).toEqual([
        [ STATE_ID, attacker, item ],
        [ STATE_ID, attacker, item ],
      ]);
      expect(firstSource).toBe(item);
      expect(secondSource).toBe(item);
      procSpy.mockRestore();
    });

    it('adds a state when no skill row shares its id at all', () =>
    {
      // Arrange- every skill lookup the attacker could be asked for throws, the way an overlay lookup does for an id
      // with no row behind it.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const item = { id: 77, note: '' };
      const attacker = buildAttacker(item, {
        skill: skillId =>
        {
          throw new Error(`no skill row with id ${skillId}`);
        },
      });
      const target = buildTarget();
      const action = buildAction(attacker, item, true);
      const effects = [ new JABS_OnChanceEffect(STATE_ID, 40, 'thisCritApply') ];

      // Act
      action.rollAndApplyCritStates(target, effects);

      // Assert
      expect(target.__added).toEqual([ [ STATE_ID, attacker, item ] ]);
      procSpy.mockRestore();
    });

    it('lands a forced state on a target that resists it to 0%, where an unforced sibling attacker lands nothing', () =>
    {
      // Arrange- the real count, every die landing on its best face: only the 0% chance can stop the sibling, and
      // only <forceCritProcs> can overcome it. Neither attacker accumulates, so a landing counts once.
      const diceSpy = stubDiceToLand();
      const item = { note: '' };
      const forcedAttacker = buildAttacker(item, { isForceCritProcs: () => true });
      const unforcedAttacker = buildAttacker(item);
      const forcedTarget = buildTarget({ stateRate: () => 0 });
      const unforcedTarget = buildTarget({ stateRate: () => 0 });
      const forcedAction = buildAction(forcedAttacker, item, true);
      const unforcedAction = buildAction(unforcedAttacker, item, true);
      const forcedEffects = [ new JABS_OnChanceEffect(STATE_ID, 40, 'onCritApply') ];
      const unforcedEffects = [ new JABS_OnChanceEffect(STATE_ID, 40, 'onCritApply') ];

      // Act
      forcedAction.rollAndApplyCritStates(forcedTarget, forcedEffects);
      unforcedAction.rollAndApplyCritStates(unforcedTarget, unforcedEffects);

      // Assert
      expect(forcedTarget.__added).toHaveLength(1);
      expect(unforcedTarget.__added).toHaveLength(0);
      diceSpy.mockRestore();
    });

    it('lands a forced state once per chance the roll brings under Accumulate Mode, then again under Encore', () =>
    {
      // Arrange- the real count at a 0% chance, so only <forceCritProcs> lands anything. The attacker itself is
      // neither very lucky nor very cursed; it accumulates and repeats each landing once more under Encore.
      const item = { note: '' };
      const attacker = buildAttacker(item, {
        isForceCritProcs: () => true,
        isAccumulating: () => true,
        getEncoreRepeats: () => 1,
      });
      const target = buildTarget({
        stateRate: () => 0,
        getNegativeRolls: () => 1,
      });
      const action = buildAction(attacker, item, true);
      const effects = [ new JABS_OnChanceEffect(STATE_ID, 40, 'onCritApply') ];

      // Act
      action.rollAndApplyCritStates(target, effects);

      // Assert- 1 + the skill's 2 + the target's 1 curse = 4 chances, each landing, each repeated once: 8.
      expect(target.__added).toHaveLength(8);
    });

    it('reads <forceCritProcs> afresh per effect, so a forcing state an earlier effect lands forces the next', () =>
    {
      // Arrange- a self list, every die landing on its best face. The first state lands at its full 40% and carries
      // <forceCritProcs> onto the attacker as it does; the second is resisted to 0%, so only a fresh read lands it.
      const diceSpy = stubDiceToLand();
      const item = { note: '' };
      const addedStateIds = [];
      let isForced = false;
      const attacker = buildAttacker(item, {
        isForceCritProcs: () => isForced,
        stateRate: stateId => (stateId === STATE_ID ? 0 : 1),
        addState: stateId =>
        {
          addedStateIds.push(stateId);

          // the forcing state hands the attacker <forceCritProcs> as it lands.
          if (stateId === SIBLING_STATE_ID) isForced = true;
        },
      });
      const action = buildAction(attacker, item, true);
      const effects = [
        new JABS_OnChanceEffect(SIBLING_STATE_ID, 40, 'thisCritSelf'),
        new JABS_OnChanceEffect(STATE_ID, 40, 'thisCritSelf'),
      ];

      // Act
      action.rollAndApplyCritStates(attacker, effects);

      // Assert
      expect(addedStateIds).toEqual([ SIBLING_STATE_ID, STATE_ID ]);
      diceSpy.mockRestore();
    });
  });

  describe('critStatePositiveRoller', () =>
  {
    it('hands back the attacker itself when it carries no <forceCritProcs>', () =>
    {
      // Arrange
      const item = { note: '' };
      const attacker = buildAttacker(item);
      const action = buildAction(attacker, item, true);

      // Act
      const positiveRoller = action.critStatePositiveRoller();

      // Assert
      expect(positiveRoller).toBe(attacker);
    });

    it('hands back a stand-in that always lands and is never cursed when the attacker carries <forceCritProcs>', () =>
    {
      // Arrange- the attacker's own fate flags point the other way, so the stand-in cannot be echoing them.
      const item = { note: '' };
      const attacker = buildAttacker(item, {
        isForceCritProcs: () => true,
        isVeryLucky: () => false,
        isVeryCursed: () => true,
      });
      const action = buildAction(attacker, item, true);

      // Act
      const positiveRoller = action.critStatePositiveRoller();

      // Assert
      expect(positiveRoller).not.toBe(attacker);
      expect(positiveRoller.isVeryLucky()).toBe(true);
      expect(positiveRoller.isVeryCursed()).toBe(false);
    });

    it('reads Accumulate Mode and Encore off the real attacker through the stand-in', () =>
    {
      // Arrange- an attacker in Accumulate Mode, with three Encore repeats.
      const item = { note: '' };
      const attacker = buildAttacker(item, {
        isForceCritProcs: () => true,
        isAccumulating: () => true,
        getEncoreRepeats: () => 3,
      });
      const action = buildAction(attacker, item, true);

      // Act
      const positiveRoller = action.critStatePositiveRoller();

      // Assert
      expect(positiveRoller.isAccumulating()).toBe(true);
      expect(positiveRoller.getEncoreRepeats()).toBe(3);
    });
  });

  describe('chanceRollerAgainst', () =>
  {
    /**
     * Builds a battler struck by this action, whose result says whether the hit was critical.
     * @param {boolean} critical Whether the hit on it was critical.
     * @returns {object}
     */
    function buildStruck(critical)
    {
      return buildTarget({ result: () => ({ critical }) });
    }

    it('hands a forced critical hit\'s rolls against the battler it crit the stand-in that always lands', () =>
    {
      // Arrange
      const item = { note: '' };
      const attacker = buildAttacker(item, { isForceCritProcs: () => true });
      const action = buildAction(attacker, item, true);

      // Act
      const roller = action.chanceRollerAgainst(buildStruck(true));

      // Assert
      expect(roller).not.toBe(attacker);
      expect(roller.isVeryLucky()).toBe(true);
    });

    it('keeps the attacker as the roller when the hit on that battler was not critical', () =>
    {
      // Arrange- the attacker forces its crits, but this hit did not crit.
      const item = { note: '' };
      const attacker = buildAttacker(item, { isForceCritProcs: () => true });
      const action = buildAction(attacker, item, true);

      // Act
      const roller = action.chanceRollerAgainst(buildStruck(false));

      // Assert
      expect(roller).toBe(attacker);
    });

    it('keeps the attacker as the roller on a critical hit when it carries no <forceCritProcs>', () =>
    {
      // Arrange
      const item = { note: '' };
      const attacker = buildAttacker(item);
      const action = buildAction(attacker, item, true);

      // Act
      const roller = action.chanceRollerAgainst(buildStruck(true));

      // Assert
      expect(roller).toBe(attacker);
    });

    it('keeps the roller an earlier extension named on a critical hit when the attacker carries no <forceCritProcs>', () =>
    {
      // Arrange- the chain below J-Crit already names a stand-in of its own, which a critical hit must not replace.
      const item = { note: '' };
      const attacker = buildAttacker(item);
      const action = buildAction(attacker, item, true);
      const earlierRoller = { isVeryLucky: () => false, isVeryCursed: () => true };
      const original = J.CRIT.Aliased.Game_Action.get('chanceRollerAgainst');
      J.CRIT.Aliased.Game_Action.set('chanceRollerAgainst', () => earlierRoller);

      // Act
      const roller = action.chanceRollerAgainst(buildStruck(true));

      // Assert
      expect(roller).toBe(earlierRoller);
      J.CRIT.Aliased.Game_Action.set('chanceRollerAgainst', original);
    });

    it('keeps the attacker as the roller for a roll it aims at itself, whatever its own result still says', () =>
    {
      // Arrange- the attacker forces its crits, and its own result still says the last hit it took was critical.
      const item = { note: '' };
      const attacker = buildAttacker(item, {
        isForceCritProcs: () => true,
        result: () => ({ critical: true }),
      });
      const action = buildAction(attacker, item, true);

      // Act
      const roller = action.chanceRollerAgainst(attacker);

      // Assert
      expect(roller).toBe(attacker);
    });
  });
});
//endregion plugins/crit/_component/crit-state-roll-threading.test.js
