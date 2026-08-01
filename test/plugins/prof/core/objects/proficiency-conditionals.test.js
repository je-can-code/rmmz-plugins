//region plugins/prof/core/objects/proficiency-conditionals.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initializeProficiencies,
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
} from '../../_component/fixtures/install-prof-host-globals.js';

/**
 * Conditionals are the reward layer: reach enough proficiency in the right skills and something
 * unlocks. They are evaluated only against the ones still locked, so the bookkeeping around what
 * has already fired matters as much as the requirements themselves - unlocking twice would hand
 * out a reward the player already has, and re-evaluating everything every hit would be wasteful.
 *
 * The base battler answers all of this neutrally, so enemies and other battler types can be asked
 * the same questions without every caller first working out what it is holding.
 */
describe('J-Proficiency conditionals and battler defaults (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/objects/Game_Action.js');
    await import('../../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJProf();
    await import('../../../../../src/plugins/prof/core/_metadata/initialization.js');

    globalThis.$dataActors = [];
    initializeProficiencies();

    await import('../../../../../src/plugins/prof/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/prof/core/objects/Game_Enemy.js');

    ({ default: globalThis.SkillProficiency } = await import('../../../../../src/plugins/prof/core/__models/SkillProficiency.js'));
  });

  let actor;

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataSkills = [ null, { id: 1, name: 'Slash' } ];

    actor = new globalThis.Game_Actor();
    actor.initMembers();
  });

  //region battler defaults
  describe('battler defaults', () =>
  {
    it('reports no proficiencies on a plain battler', () =>
    {
      // Arrange: the neutral answer lets callers ask any battler without checking its type.
      const battler = new globalThis.Game_Battler();

      // Act & Assert
      expect(battler.skillProficiencies()).toEqual([]);
    });

    it('reports no proficiency for any specific skill on a plain battler', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler();

      // Act & Assert
      expect(battler.skillProficiencyBySkillId(1)).toBe(null);
    });

    it('reports no bonus proficiency gain on a plain battler', () =>
    {
      // Arrange: only actors accrue the bonus, but everything can be asked for it.
      const battler = new globalThis.Game_Battler();

      // Act & Assert
      expect(battler.prof).toBe(0);
    });
  });
  //endregion battler defaults

  //region the proficiency model
  describe('SkillProficiency', () =>
  {
    it('resolves the underlying skill row it tracks', () =>
    {
      // Arrange
      const proficiency = new globalThis.SkillProficiency(1, 0);

      // Act
      const skill = proficiency.skill();

      // Assert
      expect(skill.name).toBe('Slash');
    });

    it('improves by the given amount', () =>
    {
      // Arrange
      const proficiency = new globalThis.SkillProficiency(1, 10);

      // Act
      proficiency.improve(5);

      // Assert
      expect(proficiency.proficiency).toBe(15);
    });

    it('never falls below nothing, however large the penalty', () =>
    {
      // Arrange: proficiency can be reduced by effects, but a negative standing would read as
      // worse than never having used the skill at all.
      const proficiency = new globalThis.SkillProficiency(1, 10);

      // Act
      proficiency.improve(-50);

      // Assert
      expect(proficiency.proficiency).toBe(0);
    });
  });
  //endregion the proficiency model

  //region conditionals
  describe('conditional bookkeeping', () =>
  {
    /**
     * Registers a conditional requiring a single skill at a given proficiency.
     * @param {string} key The conditional key.
     * @param {number} skillId The skill it requires.
     * @returns {object}
     */
    function addConditional(key, skillId)
    {
      const conditional = {
        key,
        requirements: [ { skillId, proficiency: 10 } ],
      };
      actor.proficiencyConditionals()
        .push(conditional);

      return conditional;
    }

    it('finds the conditionals that depend on a given skill', () =>
    {
      // Arrange: used to decide which conditionals are worth re-checking after a skill is used.
      addConditional('alpha', 1);
      addConditional('beta', 2);

      // Act
      const found = actor.proficiencyConditionalBySkillId(1);

      // Assert
      expect(found.map(conditional => conditional.key)).toEqual([ 'alpha' ]);
    });

    it('finds nothing for a skill no conditional depends on', () =>
    {
      // Arrange
      addConditional('alpha', 1);

      // Act
      const found = actor.proficiencyConditionalBySkillId(99);

      // Assert
      expect(found).toEqual([]);
    });

    it('reports a conditional as locked until it is unlocked', () =>
    {
      // Arrange & Act & Assert
      expect(actor.isConditionalUnlocked('alpha')).toBe(false);
    });

    it('reports a conditional as unlocked once it has been', () =>
    {
      // Arrange
      addConditional('alpha', 1);

      // Act
      actor.unlockConditional('alpha');

      // Assert
      expect(actor.isConditionalUnlocked('alpha')).toBe(true);
    });

    it('lists only the conditionals still locked', () =>
    {
      // Arrange
      addConditional('alpha', 1);
      addConditional('beta', 2);
      actor.unlockConditional('alpha');

      // Act
      const lockedKeys = actor.lockedConditionals()
        .map(conditional => conditional.key);

      // Assert
      expect(lockedKeys).toContain('beta');
      expect(lockedKeys).not.toContain('alpha');
    });

    it('refuses to unlock a conditional twice', () =>
    {
      // Arrange: unlocking again would hand out a reward the player already received.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      addConditional('alpha', 1);
      actor.unlockConditional('alpha');

      // Act
      actor.unlockConditional('alpha');

      // Assert
      expect(actor.unlockedConditionals()
        .filter(key => key === 'alpha').length).toBe(1);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
    });

    it('reports the duplicate unlock rather than swallowing it', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      addConditional('alpha', 1);
      actor.unlockConditional('alpha');

      // Act
      actor.unlockConditional('alpha');

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });

    it('evaluates nothing when every conditional is already unlocked', () =>
    {
      // Arrange: the common late-game case, where re-checking would be pure waste.
      addConditional('alpha', 1);
      actor.lockedConditionals()
        .forEach(conditional => actor.unlockConditional(conditional.key));

      // Act
      const act = () => actor.evaluateProficiencyConditionals();

      // Assert
      expect(act).not.toThrow();
    });
  });
  //endregion conditionals

  //region bonus gains
  describe('updateBonusSkillProficiencyGains', () =>
  {
    it('seeds the bonus when a save predates the field entirely', () =>
    {
      // Arrange: saves made before the bonus existed restore without it, and leaving it absent
      // would turn every later proficiency award into NaN.
      actor.setBonusSkillProficiencyGains(undefined);

      // Act
      actor.updateBonusSkillProficiencyGains();

      // Assert
      expect(actor.bonusSkillProficiencyGains()).toBe(0);
    });

    it('recomputes the bonus from the actor\'s notes', () =>
    {
      // Arrange
      actor.setBonusSkillProficiencyGains(0);

      // Act
      actor.updateBonusSkillProficiencyGains();

      // Assert
      expect(typeof actor.bonusSkillProficiencyGains()).toBe('number');
    });
  });

  describe('prof', () =>
  {
    it('reports the accrued bonus when SDP is not installed', () =>
    {
      // Arrange: J-SDP is optional, so its absence must leave the bonus untouched rather than
      // poisoning it.
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = undefined;
      actor.setBonusSkillProficiencyGains(4);

      // Act
      const bonus = actor.prof;

      // Assert
      expect(bonus).toBe(4);

      // restore the bare-global namespace rather than leaking it into later tests in this file.
      globalThis.J.SDP = previousSdp;
    });

    it('adds the panel contribution when SDP is installed', () =>
    {
      // Arrange
      const previousSdp = globalThis.J.SDP;
      globalThis.J.SDP = {};
      actor.setBonusSkillProficiencyGains(4);
      actor.getSdpBonusForParameterKey = () => 3;

      // Act
      const bonus = actor.prof;

      // Assert
      expect(bonus).toBe(7);

      // restore the bare-global namespace.
      globalThis.J.SDP = previousSdp;
    });
  });
  //endregion bonus gains

  //region actor proficiency lookup
  describe('tryGetSkillProficiencyBySkillId', () =>
  {
    it('returns the existing record for a skill already practised', () =>
    {
      // Arrange
      actor.addSkillProficiency(1, 12);

      // Act
      const proficiency = actor.tryGetSkillProficiencyBySkillId(1);

      // Assert
      expect(proficiency.proficiency).toBe(12);
    });

    it('creates a record on demand for a skill acquired outside of learning it', () =>
    {
      // Arrange: skills can arrive through traits or equipment rather than learnSkill, so the
      // first use of one has to be able to mint its record rather than finding nothing.
      // Act
      const proficiency = actor.tryGetSkillProficiencyBySkillId(77);

      // Assert
      expect(proficiency.proficiency).toBe(0);
    });

    it('keeps the created record for later lookups', () =>
    {
      // Arrange
      actor.tryGetSkillProficiencyBySkillId(77);

      // Act
      const proficiency = actor.skillProficiencyBySkillId(77);

      // Assert
      expect(proficiency).toBeTruthy();
    });
  });
  //endregion actor proficiency lookup
});
//endregion plugins/prof/core/objects/proficiency-conditionals.test.js