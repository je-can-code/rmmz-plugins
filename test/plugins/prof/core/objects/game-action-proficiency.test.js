//region plugins/prof/core/objects/game-action-proficiency.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
  skillData,
} from '../../_component/fixtures/install-prof-host-globals.js';

/**
 * Proficiency is earned by using a skill, so the gate in front of it decides how the whole system
 * paces. Every condition is a separate design decision - it must be a skill rather than an item,
 * it must actually connect, and both the attacker and the target have to permit it - and any one
 * of them failing silently would either stall progression or let a player grind proficiency off a
 * dummy that was never meant to teach anything.
 */
describe('J-Proficiency Game_Action gates (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJProf();
    await import('../../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Enemy.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Action.js');
  });

  /**
   * Builds an action wielding a skill, with the caster and hit outcome pinned.
   * @param {object} [options] The scenario to build.
   * @returns {Game_Action}
   */
  function makeAction(options = {})
  {
    const {
      isSkill = true,
      casterCanGain = true,
      skill = skillData({ id: 10, name: 'Strike', note: '', damage: { elementId: 0 } }),
      caster = null,
    } = options;

    const subject = caster ?? {
      canGainProficiency: () => casterCanGain,
      skillProficiencyAmount: () => 1,
      increaseSkillProficiency: () => {},
      skillProficiencyBySkillId: () => null,
    };

    const action = new globalThis.Game_Action();
    action.isSkill = () => isSkill;
    action.item = () => skill;
    action.subject = () => subject;

    return action;
  }

  /**
   * Builds a target whose hit result and permission are pinned.
   * @param {boolean} [isHit] Whether the action connected.
   * @param {boolean} [canGive] Whether the target grants proficiency.
   * @returns {object}
   */
  function makeTarget(isHit = true, canGive = true)
  {
    return {
      result: () => ({ isHit: () => isHit }),
      canGiveProficiency: () => canGive,
    };
  }

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  //region the gate
  describe('canIncreaseProficiency', () =>
  {
    it('permits a connecting skill between willing participants', () =>
    {
      // Arrange & Act
      const result = makeAction().canIncreaseProficiency(makeTarget());

      // Assert
      expect(result).toBe(true);
    });

    it('refuses an item, which teaches nothing about a skill', () =>
    {
      // Arrange & Act
      const result = makeAction({ isSkill: false }).canIncreaseProficiency(makeTarget());

      // Assert
      expect(result).toBe(false);
    });

    it('refuses an attack that missed', () =>
    {
      // Arrange: swinging and missing is not practice.
      // Act
      const result = makeAction().canIncreaseProficiency(makeTarget(false));

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a target that grants no proficiency', () =>
    {
      // Arrange: training dummies and scripted encounters can opt out of teaching.
      // Act
      const result = makeAction().canIncreaseProficiency(makeTarget(true, false));

      // Assert
      expect(result).toBe(false);
    });

    it('refuses an attacker barred from gaining proficiency', () =>
    {
      // Arrange
      // Act
      const result = makeAction({ casterCanGain: false }).canIncreaseProficiency(makeTarget());

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion the gate

  //region awarding
  describe('increaseProficiency', () =>
  {
    it('awards the caster\'s own proficiency amount for the skill used', () =>
    {
      // Arrange: the amount is a caster trait, so a character with bonuses learns faster.
      const awarded = [];
      const caster = {
        canGainProficiency: () => true,
        skillProficiencyAmount: () => 3,
        increaseSkillProficiency: (skillId, amount) => awarded.push([ skillId, amount ]),
        skillProficiencyBySkillId: () => null,
      };

      // Act
      makeAction({ caster }).increaseProficiency();

      // Assert
      expect(awarded).toEqual([ [ 10, 3 ] ]);
    });

    it('awards nothing when there is no caster to credit', () =>
    {
      // Arrange: an action whose subject has gone away mid-resolution should report rather
      // than throw, since the hit itself has already landed.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const action = makeAction();
      action.subject = () => null;

      // Act
      const act = () => action.increaseProficiency();

      // Assert
      expect(act).not.toThrow();

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
    });

    it('reports the invalid award rather than failing silently', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const action = makeAction();
      action.item = () => null;

      // Act
      action.increaseProficiency();

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });
  });

  describe('skillProficiency', () =>
  {
    it('reports the caster\'s standing with the skill being used', () =>
    {
      // Arrange
      const caster = {
        canGainProficiency: () => true,
        skillProficiencyAmount: () => 1,
        increaseSkillProficiency: () => {},
        skillProficiencyBySkillId: () => ({ proficiency: 42 }),
      };

      // Act
      const proficiency = makeAction({ caster }).skillProficiency();

      // Assert
      expect(proficiency).toBe(42);
    });

    it('reports nothing for a skill the caster has never used', () =>
    {
      // Arrange
      // Act
      const proficiency = makeAction().skillProficiency();

      // Assert
      expect(proficiency).toBe(0);
    });

    it('reports nothing for an item, which carries no proficiency', () =>
    {
      // Arrange & Act
      const proficiency = makeAction({ isSkill: false }).skillProficiency();

      // Assert
      expect(proficiency).toBe(0);
    });

    it('reports nothing when there is no caster to ask', () =>
    {
      // Arrange
      const action = makeAction();
      action.subject = () => null;

      // Act
      const proficiency = action.skillProficiency();

      // Assert
      expect(proficiency).toBe(0);
    });
  });
  //endregion awarding

  //region the J-ABS gate
  describe('the guard and parry block without J-ABS', () =>
  {
    it('installs nothing, because a turn-based game has no per-frame guard to reward', () =>
    {
      // Arrange- this realm booted with no ABS namespace, and the gate around the guard block is
      // evaluated once at import time, so its effect is visible only in what got installed. The
      // helper is defined solely inside that block, and the parry alias is recorded solely by it;
      // `apply` is aliased outside the gate and is expected on the map regardless.
      // Act & Assert
      expect(globalThis.J.ABS).toBeUndefined();
      expect(globalThis.Game_Action.prototype.gainProficiencyFromGuarding).toBeUndefined();
      expect(globalThis.J.PROF.Aliased.Game_Action.has('onParry')).toBe(false);
      expect(globalThis.J.PROF.Aliased.Game_Action.has('onGuard')).toBe(false);
      expect(globalThis.J.PROF.Aliased.Game_Action.has('apply')).toBe(true);
    });
  });
  //endregion the J-ABS gate
});
//endregion plugins/prof/core/objects/game-action-proficiency.test.js