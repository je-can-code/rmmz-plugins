//region plugins/abs/core/_component/game-action-unconditional-damage-bonus.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal skill stub with the given notetag string.
 * @param {string} note
 * @returns {object}
 */
function buildSkill(note)
{
  const skill = Object.create(globalThis.RPG_Skill.prototype);
  skill.id = 1;
  skill.note = note;
  skill.meta = {};
  skill._original = function() { return this; };
  return skill;
}

/**
 * Builds a minimal caster stub whose getAllNotes returns the given note sources.
 * @param {object[]} noteSources Objects with a .note string (skills, states, etc.).
 * @returns {object}
 */
function buildCaster(noteSources = [])
{
  return {
    getAllNotes()
    {
      return noteSources;
    },
  };
}

/**
 * Builds a minimal Game_Action stub backed by the given caster and skill.
 * @param {object} caster
 * @param {object} skill
 * @returns {object}
 */
function buildAction(caster, skill)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => caster;
  action.item = () => skill;
  return action;
}

describe('J-ABS Game_Action unconditional damage bonus (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  describe('calculateBonusDamagePct (caster notes, unconditional)', () =>
  {
    it('returns 0 when the caster has no bonusDamage tags', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusDamagePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent from a single caster note source', () =>
    {
      // Arrange- e.g. authored on a State the caster has equipped as a passive.
      const passiveNote = buildSkill('<bonusDamage:15>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusDamagePct();

      // Assert
      expect(result).toBe(15);
    });

    it('accumulates additively across multiple note sources', () =>
    {
      // Arrange
      const note1 = buildSkill('<bonusDamage:10>');
      const note2 = buildSkill('<bonusDamage:5>');
      const caster = buildCaster([ note1, note2 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusDamagePct();

      // Assert
      expect(result).toBe(15);
    });

    it('does not read bonusDamage from the executing skill, only from caster notes', () =>
    {
      // Arrange- the tag is on the skill itself, not a caster note source.
      const skill = buildSkill('<bonusDamage:15>');
      const caster = buildCaster([]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateBonusDamagePct();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('calculateThisBonusDamagePct (skill note only, unconditional)', () =>
  {
    it('returns 0 when the skill has no thisBonusDamage tag', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamagePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent from the executing skill', () =>
    {
      // Arrange
      const skill = buildSkill('<thisBonusDamage:20>');
      const caster = buildCaster([]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamagePct();

      // Assert
      expect(result).toBe(20);
    });

    it('does not read thisBonusDamage from caster notes, only from the skill', () =>
    {
      // Arrange- the tag is on a caster note source, not on the skill itself.
      const casterNote = buildSkill('<thisBonusDamage:20>');
      const caster = buildCaster([ casterNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamagePct();

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-unconditional-damage-bonus.test.js
