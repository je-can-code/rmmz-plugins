//region plugins/abs/core/game-action-self-state-damage-bonus.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

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
 * Builds a minimal caster stub whose getAllNotes returns the given note sources
 * and whose isStateAffected checks the given active state ids.
 * @param {object[]} noteSources Objects with a .note string (skills, states, etc.).
 * @param {number[]} activeStateIds State ids currently active on this caster.
 * @returns {object}
 */
function buildCaster(noteSources = [], activeStateIds = [])
{
  return {
    getAllNotes()
    {
      return noteSources;
    },
    isStateAffected(stateId)
    {
      return activeStateIds.includes(stateId);
    },
    allStates()
    {
      return [];
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

describe('J-ABS Game_Action self-state damage bonus (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  describe('calculateBonusIfSelfStatePct (caster notes)', () =>
  {
    it('returns 0 when the caster has no bonusDamageIfSelfState tags', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the caster', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ passiveNote ], []);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent when the tagged state is active on the caster', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ passiveNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(50);
    });

    it('stacks additively across multiple tags for different states, all active', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 25]>\n<bonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([ passiveNote ], [ 10, 11 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(100);
    });

    it('only counts tags whose state is currently active on the caster', () =>
    {
      // Arrange- only state 10 is active; state 11 is not.
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 25]>\n<bonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([ passiveNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(25);
    });

    it('accumulates across multiple note sources', () =>
    {
      // Arrange
      const note1 = buildSkill('<bonusDamageIfSelfState:[10, 30]>');
      const note2 = buildSkill('<bonusDamageIfSelfState:[10, 20]>');
      const caster = buildCaster([ note1, note2 ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfSelfStatePct();

      // Assert
      expect(result).toBe(50);
    });
  });

  describe('calculateThisBonusDamageIfSelfStatePct (skill note only)', () =>
  {
    it('returns 0 when the skill has no thisBonusDamageIfSelfState tags', () =>
    {
      // Arrange
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the caster', () =>
    {
      // Arrange
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([], []);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent when the tagged state is active on the caster', () =>
    {
      // Arrange
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(50);
    });

    it('stacks additively across multiple tags for different states, all active', () =>
    {
      // Arrange
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 25]>\n<thisBonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([], [ 10, 11 ]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(100);
    });

    it('only counts tags whose state is currently active on the caster', () =>
    {
      // Arrange- only state 10 is active; state 11 contributes nothing.
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 25]>\n<thisBonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(25);
    });

    it('does not read thisBonusDamageIfSelfState from caster notes, only from the skill', () =>
    {
      // Arrange- the tag is on a caster note source, not on the skill itself.
      const casterNote = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ casterNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamageIfSelfStatePct();

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/abs/core/game-action-self-state-damage-bonus.test.js
