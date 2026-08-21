//region plugins/prof/core/objects/game-action-guard-proficiency.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Guarding and parrying earn proficiency too, but only under J-ABS - a turn-based game has no
 * per-frame guard to reward. The whole block is therefore gated behind a namespace check evaluated
 * once at module load, which is why it lives in its own file: a module registry holds one answer
 * per realm, and the companion file covers the plugin loading without J-ABS present.
 *
 * The reward is what any skill use earns, so a bonus to proficiency gain reaches defense as readily
 * as offense.
 */
describe('J-Proficiency Game_Action guard rewards with J-ABS (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the guard block is gated on this namespace being present at import time.
    globalThis.J = {
      ABS: {},
      PROF: { Aliased: { Game_Action: new Map() } },
    };

    function StubGameAction()
    {
    }

    StubGameAction.prototype.onParry = function()
    {
      this.parriedThrough = true;
    };
    StubGameAction.prototype.onGuard = function()
    {
      this.guardedThrough = true;
    };
    globalThis.Game_Action = StubGameAction;

    await import('../../../../../src/plugins/prof/core/objects/Game_Action.js');
  });

  /**
   * Builds a JABS battler stand-in whose guard skill and permission are pinned.
   * @param {object} [options] The scenario to build.
   * @returns {object}
   */
  function makeJabsBattler(options = {})
  {
    const {
      guardSkillId = 5,
      canGain = true,
      proficiencyAmount = 1
    } = options;
    const awarded = [];

    return {
      awarded,
      getGuardSkillId: () => guardSkillId,
      getBattler: () => ({
        canGainProficiency: () => canGain,
        skillProficiencyAmount: () => proficiencyAmount,
        increaseSkillProficiency: (skillId, amount) => awarded.push([ skillId, amount ]),
      }),
    };
  }

  let action;

  beforeEach(() =>
  {
    action = new globalThis.Game_Action();
  });

  //region the gate
  describe('canGainProficiencyFromGuarding', () =>
  {
    it('permits a battler with a guard skill and no restriction', () =>
    {
      // Arrange & Act
      const result = action.canGainProficiencyFromGuarding(makeJabsBattler());

      // Assert
      expect(result).toBe(true);
    });

    it('refuses a battler barred from gaining proficiency', () =>
    {
      // Arrange & Act
      const result = action.canGainProficiencyFromGuarding(makeJabsBattler({ canGain: false }));

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a battler with no guard skill equipped', () =>
    {
      // Arrange: with nothing assigned to the guard slot there is no skill to practise.
      // Act
      const result = action.canGainProficiencyFromGuarding(makeJabsBattler({ guardSkillId: 0 }));

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion the gate

  //region awarding
  describe('gainProficiencyFromGuarding', () =>
  {
    it('awards the guard skill what the battler earns from any skill use', () =>
    {
      // Arrange: a battler carrying a proficiency bonus, so a flat award and a scaled one differ.
      const jabsBattler = makeJabsBattler({ proficiencyAmount: 4 });

      // Act
      action.gainProficiencyFromGuarding(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([ [ 5, 4 ] ]);
    });

    it('awards the base rate to a battler carrying no proficiency bonus', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler({ proficiencyAmount: 1 });

      // Act
      action.gainProficiencyFromGuarding(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([ [ 5, 1 ] ]);
    });

    it('awards nothing to a battler that cannot gain proficiency', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler({ canGain: false });

      // Act
      action.gainProficiencyFromGuarding(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([]);
    });

    it('awards nothing when no guard skill is equipped', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler({ guardSkillId: 0 });

      // Act
      action.gainProficiencyFromGuarding(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([]);
    });
  });
  //endregion awarding

  //region hooks
  describe('onParry', () =>
  {
    it('still performs the original parry handling', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler();

      // Act
      action.onParry(jabsBattler);

      // Assert
      expect(action.parriedThrough).toBe(true);
    });

    it('awards proficiency for the parry', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler();

      // Act
      action.onParry(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([ [ 5, 1 ] ]);
    });
  });

  describe('onGuard', () =>
  {
    it('still performs the original guard handling', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler();

      // Act
      action.onGuard(jabsBattler);

      // Assert
      expect(action.guardedThrough).toBe(true);
    });

    it('awards proficiency for the guard', () =>
    {
      // Arrange
      const jabsBattler = makeJabsBattler();

      // Act
      action.onGuard(jabsBattler);

      // Assert
      expect(jabsBattler.awarded).toEqual([ [ 5, 1 ] ]);
    });
  });
  //endregion hooks
});
//endregion plugins/prof/core/objects/game-action-guard-proficiency.test.js