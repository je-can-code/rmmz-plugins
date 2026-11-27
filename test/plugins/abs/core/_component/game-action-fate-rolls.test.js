//region plugins/abs/core/_component/game-action-fate-rolls.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a battler stand-in carrying fixed rolls. The skill-scoped curse and the battler-wide one differ on purpose,
 * so a roll that reads the wrong one shows up in the pair.
 * @param {number} luckForSkill What getPositiveRollsForSkill answers.
 * @param {number} curseForSkill What getNegativeRollsForSkill answers.
 * @param {number} curse What getNegativeRolls answers.
 * @returns {object}
 */
function buildBattler(luckForSkill, curseForSkill, curse)
{
  return {
    getPositiveRollsForSkill: () => luckForSkill,
    getNegativeRollsForSkill: () => curseForSkill,
    getNegativeRolls: () => curse,
  };
}

/**
 * Builds an action borrowing the real fateRollsAgainst off the prototype, with its subject and its aim stubbed.
 * @param {object} subject The battler performing the action.
 * @param {boolean} isForOpponent Whether the action is aimed at the subject's opponents.
 * @returns {object}
 */
function buildAction(subject, isForOpponent)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => subject;
  action.item = () => ({});
  action.isForOpponent = () => isForOpponent;
  return action;
}

describe('J-ABS Game_Action fate rolls (direct src import)', () =>
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

  describe('fateRollsAgainst', () =>
  {
    it('brings the subject\'s own luck and curse once when it aims at itself', () =>
    {
      // Arrange- aimed as harm, so counting its curse a second time as the target's would add one more chance.
      const subject = buildBattler(3, 2, 1);
      const action = buildAction(subject, true);

      // Act
      const rolls = action.fateRollsAgainst(subject);

      // Assert
      expect(rolls).toEqual([ 4, 2 ]);
    });

    it('gives harm aimed at a cursed target one more chance to land per curse it carries', () =>
    {
      // Arrange
      const action = buildAction(buildBattler(3, 2, 1), true);
      const target = buildBattler(0, 0, 5);

      // Act
      const rolls = action.fateRollsAgainst(target);

      // Assert- the subject's 3 luck and the target's 5 curses are chances; the subject's own 2 curses are hurdles.
      expect(rolls).toEqual([ 9, 2 ]);
    });

    it('makes help aimed at a cursed target clear every curse it carries', () =>
    {
      // Arrange
      const action = buildAction(buildBattler(3, 2, 1), false);
      const target = buildBattler(0, 0, 5);

      // Act
      const rolls = action.fateRollsAgainst(target);

      // Assert- the target's 5 curses join the subject's own 2 as hurdles the help has to pass.
      expect(rolls).toEqual([ 4, 7 ]);
    });

    it('treats a different battler with the very same rolls as a target, not as the subject itself', () =>
    {
      // Arrange- a lookalike of the subject, so only identity tells the two apart.
      const action = buildAction(buildBattler(3, 2, 1), true);
      const lookalike = buildBattler(3, 2, 1);

      // Act
      const rolls = action.fateRollsAgainst(lookalike);

      // Assert- the lookalike's one battler-wide curse counts, which it would not for the subject aiming at itself.
      expect(rolls).toEqual([ 5, 2 ]);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-fate-rolls.test.js
