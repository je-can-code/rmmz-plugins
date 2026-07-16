//region plugins/abs/core/_component/game-action-target-hp-damage-bonus.test.js
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
 * Builds a minimal target stub with the given current/max hp.
 * @param {number} hp
 * @param {number} mhp
 * @returns {object}
 */
function buildTarget(hp, mhp = 100)
{
  return { hp, mhp };
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

describe('J-ABS Game_Action target-hp execute damage bonus (direct src import)', () =>
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

  describe('resolveHpPercent', () =>
  {
    it('rounds current/max hp to a whole-number percent', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));

      // Act/Assert
      expect(action.resolveHpPercent(buildTarget(33, 100))).toBe(33);
      expect(action.resolveHpPercent(buildTarget(1, 3))).toBe(33);
    });

    it('returns 0 for a zero-or-less max hp battler instead of dividing by zero', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));

      // Act/Assert
      expect(action.resolveHpPercent(buildTarget(0, 0))).toBe(0);
    });
  });

  describe('calculateBonusIfTargetHpBelowPct (caster notes)', () =>
  {
    it('returns 0 when the caster has no bonusDamageIfTargetHpBelow tags', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the target hp is above the threshold (gate not open)', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(51));

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the target hp is exactly at the threshold', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(50));

      // Assert
      expect(result).toBe(0);
    });

    it('scales the bonus by percentage points under the threshold once the gate opens', () =>
    {
      // Arrange- 20 points under the 50% threshold, at 2% per point = 40%.
      const passiveNote = buildSkill('<bonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(30));

      // Assert
      expect(result).toBe(40);
    });

    it('grows further as the target hp keeps dropping', () =>
    {
      // Arrange- 40 points under the 50% threshold, at 2% per point = 80%.
      const passiveNote = buildSkill('<bonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(80);
    });

    it('stacks additively across multiple tags whose thresholds are both open', () =>
    {
      // Arrange- at 20% hp: 30 points under 50 (x2=60) plus 5 points under 25 (x4=20) = 80.
      const passiveNote = buildSkill(
        '<bonusDamageIfTargetHpBelow:[50, 2]>\n<bonusDamageIfTargetHpBelow:[25, 4]>'
      );
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(20));

      // Assert
      expect(result).toBe(80);
    });

    it('only counts tags whose threshold the target is currently under', () =>
    {
      // Arrange- at 40% hp, the 50% threshold is open (10 points x2=20) but the 25% threshold is not.
      const passiveNote = buildSkill(
        '<bonusDamageIfTargetHpBelow:[50, 2]>\n<bonusDamageIfTargetHpBelow:[25, 4]>'
      );
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(40));

      // Assert
      expect(result).toBe(20);
    });

    it('does not read bonusDamageIfTargetHpBelow from the executing skill, only from caster notes', () =>
    {
      // Arrange- the tag is on the skill itself, not a caster note source.
      const skill = buildSkill('<bonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateBonusIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('calculateThisBonusDamageIfTargetHpBelowPct (skill note only)', () =>
  {
    it('returns 0 when the skill has no thisBonusDamageIfTargetHpBelow tag', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamageIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the target hp is above the threshold (gate not open)', () =>
    {
      // Arrange
      const skill = buildSkill('<thisBonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfTargetHpBelowPct(buildTarget(70));

      // Assert
      expect(result).toBe(0);
    });

    it('scales the bonus by percentage points under the threshold once the gate opens', () =>
    {
      // Arrange- 40 points under the 50% threshold, at 2% per point = 80%.
      const skill = buildSkill('<thisBonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([]);
      const action = buildAction(caster, skill);

      // Act
      const result = action.calculateThisBonusDamageIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(80);
    });

    it('does not read thisBonusDamageIfTargetHpBelow from caster notes, only from the skill', () =>
    {
      // Arrange- the tag is on a caster note source, not on the skill itself.
      const casterNote = buildSkill('<thisBonusDamageIfTargetHpBelow:[50, 2]>');
      const caster = buildCaster([ casterNote ]);
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.calculateThisBonusDamageIfTargetHpBelowPct(buildTarget(10));

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-target-hp-damage-bonus.test.js
