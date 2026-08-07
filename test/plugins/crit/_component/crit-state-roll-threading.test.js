//region plugins/crit/_component/crit-state-roll-threading.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-CriticalFactors Game_Action.rollAndApplyCritStates roll threading (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    function Game_Action()
    {
    }

    globalThis.Game_Action = Game_Action;
    globalThis.J = { CRIT: { Aliased: { Game_Action: new Map() } } };

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/crit/core/objects/Game_Action.js');
  });

  /**
   * Builds a duck-typed JABS_OnChanceEffect stand-in that records the roll arguments it was
   * called with and always reports success.
   * @returns {object}
   */
  function buildEffect()
  {
    const calls = [];
    return {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative)
      {
        calls.push({ rollForPositive, rollForNegative });
        return 1;
      },
      __calls: calls,
    };
  }

  /**
   * Builds a minimal Game_Action stub exposing rollAndApplyCritStates.
   * @param {object} attacker
   * @returns {object}
   */
  function buildAction(attacker)
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    action.subject = () => attacker;
    return action;
  }

  it('applies to a separate recipient: attacker positive (+1 baseline), recipient negative', () =>
  {
    // Arrange
    const effect = buildEffect();
    const attacker = { getPositiveRollsForSkill: () => 2, isForceCritProcs: () => false };
    const recipient = { addState: () => {}, getNegativeRolls: () => 4 };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(recipient, [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 4 } ]);
  });

  it('collapses to self-both when the recipient is the attacker (self-targeting crit states)', () =>
  {
    // Arrange
    const effect = buildEffect();
    const attacker = {
      getPositiveRollsForSkill: () => 2,
      getNegativeRolls: () => 5,
      addState: () => {},
      isForceCritProcs: () => false,
    };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(attacker, [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 5 } ]);
  });

  it('wraps the positive-roller with a forced-success stand-in when <forceCritProcs> is set', () =>
  {
    // Arrange
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = {
      getPositiveRollsForSkill: () => 0,
      isForceCritProcs: () => true,
      isAccumulating: () => 'attacker-accumulating',
      getEncoreRepeats: () => 'attacker-encore',
    };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(recipient, [ effect ]);

    // Assert
    const [ positiveRoller ] = calls;
    expect(positiveRoller.isVeryLucky()).toBe(true);
  });

  it('the forced-success stand-in reports isVeryCursed as false', () =>
  {
    // Arrange
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = {
      getPositiveRollsForSkill: () => 0,
      isForceCritProcs: () => true,
      isAccumulating: () => 'attacker-accumulating',
      getEncoreRepeats: () => 'attacker-encore',
    };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(recipient, [ effect ]);

    // Assert
    const [ positiveRoller ] = calls;
    expect(positiveRoller.isVeryCursed()).toBe(false);
  });

  it('the forced-success stand-in still forwards the real attacker\'s isAccumulating/getEncoreRepeats', () =>
  {
    // Arrange
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = {
      getPositiveRollsForSkill: () => 0,
      isForceCritProcs: () => true,
      isAccumulating: () => 'attacker-accumulating',
      getEncoreRepeats: () => 'attacker-encore',
    };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(recipient, [ effect ]);

    // Assert
    const [ positiveRoller ] = calls;
    expect(positiveRoller.isAccumulating()).toBe('attacker-accumulating');
    expect(positiveRoller.getEncoreRepeats()).toBe('attacker-encore');
  });

  it('passes the real attacker through untouched when <forceCritProcs> is not set', () =>
  {
    // Arrange
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = { getPositiveRollsForSkill: () => 0, isForceCritProcs: () => false };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    // Act
    action.rollAndApplyCritStates(recipient, [ effect ]);

    // Assert
    expect(calls[0]).toBe(attacker);
  });

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
});
//endregion plugins/crit/_component/crit-state-roll-threading.test.js
