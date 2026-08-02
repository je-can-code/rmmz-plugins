//region plugins/abs/core/_component/game-action-debuff-and-state-damage-bonus.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal skill/note-source stub with the given notetag string.
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
 * @param {object[]} noteSources
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

describe('J-ABS Game_Action debuff-count and state-flag damage bonuses (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => undefined;
  });

  describe('calculatePerDebuffBonusPct', () =>
  {
    it('is 0 when the caster has no perDebuffBuff tags at all', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [] };

      // Act & Assert
      expect(action.calculatePerDebuffBonusPct(target)).toBe(0);
    });

    it('multiplies the summed per-debuff rate by the target\'s active negative-state count', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<perDebuffBuff:5>') ]);
      const action = buildAction(caster, buildSkill(''));
      const negativeState = { isNegativeType: () => true };
      const positiveState = { isNegativeType: () => false };
      const target = { states: () => [ negativeState, negativeState, positiveState ] };

      // Act & Assert- 5 * 2 negative states = 10.
      expect(action.calculatePerDebuffBonusPct(target)).toBe(10);
    });

    it('is 0 when the caster has the tag but the target has no negative states', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<perDebuffBuff:5>') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [ { isNegativeType: () => false } ] };

      // Act & Assert
      expect(action.calculatePerDebuffBonusPct(target)).toBe(0);
    });
  });

  describe('calculateBonusIfStatePct', () =>
  {
    it('is 0 when the caster has no bonusDamageIfState tags at all', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { isStateAffected: () => true };

      // Act & Assert
      expect(action.calculateBonusIfStatePct(target)).toBe(0);
    });

    it('sums the percent from every tag whose state is currently active on the target', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfState:[10, 25]>\n<bonusDamageIfState:[11, 50]>') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { isStateAffected: stateId => stateId === 10 };

      // Act & Assert- only state 10 is active, contributing 25.
      expect(action.calculateBonusIfStatePct(target)).toBe(25);
    });

    it('contributes 0 when tags exist but none of their states are active on the target', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfState:[10, 25]>') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { isStateAffected: () => false };

      // Act & Assert
      expect(action.calculateBonusIfStatePct(target)).toBe(0);
    });
  });

  describe('calculateThisBonusDamageIfStatePct', () =>
  {
    it('is 0 when the executing skill has no thisBonusDamageIfState tags', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => true };

      // Act & Assert
      expect(action.calculateThisBonusDamageIfStatePct(target)).toBe(0);
    });

    it('sums the percent from every tag on the executing skill whose state is active', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('<thisBonusDamageIfState:[14, 100]>\n<thisBonusDamageIfState:[15, 50]>');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: stateId => stateId === 14 || stateId === 15 };

      // Act & Assert
      expect(action.calculateThisBonusDamageIfStatePct(target)).toBe(150);
    });

    it('ignores the caster\'s own notes- only this specific skill\'s note is read', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<thisBonusDamageIfState:[14, 100]>') ]);
      const skill = buildSkill('');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => true };

      // Act & Assert
      expect(action.calculateThisBonusDamageIfStatePct(target)).toBe(0);
    });

    it('contributes 0 when the tag exists but its state is not active on the target', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('<thisBonusDamageIfState:[14, 100]>');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => false };

      // Act & Assert
      expect(action.calculateThisBonusDamageIfStatePct(target)).toBe(0);
    });
  });

  describe('targetHasActiveStateType', () =>
  {
    it('is true when an active state carries a case-insensitively matching type', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [ { types: () => [ 'Poison' ] } ] };

      // Act & Assert
      expect(action.targetHasActiveStateType(target, 'poison')).toBe(true);
    });

    it('is false when no active state carries the given type', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [ { types: () => [ 'burn' ] } ] };

      // Act & Assert
      expect(action.targetHasActiveStateType(target, 'poison')).toBe(false);
    });

    it('is false with no active states at all', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [] };

      // Act & Assert
      expect(action.targetHasActiveStateType(target, 'poison')).toBe(false);
    });
  });

  describe('calculateBonusIfStateTypePct', () =>
  {
    it('is 0 when the caster has no bonusDamageIfStateType tags at all', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [] };

      // Act & Assert
      expect(action.calculateBonusIfStateTypePct(target)).toBe(0);
    });

    it('sums the percent from every tag whose type is present on the target', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfStateType:[poison, 25]>') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [ { types: () => [ 'poison' ] } ] };

      // Act & Assert
      expect(action.calculateBonusIfStateTypePct(target)).toBe(25);
    });

    it('contributes 0 when tags exist but the target has none of their types active', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfStateType:[poison, 25]>') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = { states: () => [] };

      // Act & Assert
      expect(action.calculateBonusIfStateTypePct(target)).toBe(0);
    });
  });

  describe('calculateThisBonusDamagePerStateStackPct', () =>
  {
    it('is 0 when the executing skill has no thisBonusDamagePerStateStack tags', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const action = buildAction(caster, buildSkill(''));
      const target = { isStateAffected: () => true, getUuid: () => 'target-uuid' };

      // Act & Assert
      expect(action.calculateThisBonusDamagePerStateStackPct(target)).toBe(0);
    });

    it('skips a tagged state that is not currently affecting the target', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('<thisBonusDamagePerStateStack:[10, 5]>');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => false, getUuid: () => 'target-uuid' };

      // Act & Assert
      expect(action.calculateThisBonusDamagePerStateStackPct(target)).toBe(0);
    });

    it('skips a state that is flagged affected but has no live tracked entry', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('<thisBonusDamagePerStateStack:[10, 5]>');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => true, getUuid: () => 'target-uuid' };
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => undefined;

      // Act & Assert
      expect(action.calculateThisBonusDamagePerStateStackPct(target)).toBe(0);
    });

    it('multiplies the tag\'s rate by the state\'s current stack count', () =>
    {
      // Arrange
      const caster = buildCaster([]);
      const skill = buildSkill('<thisBonusDamagePerStateStack:[10, 5]>');
      const action = buildAction(caster, skill);
      const target = { isStateAffected: () => true, getUuid: () => 'target-uuid' };
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 3 });

      // Act & Assert- 5 * 3 = 15.
      expect(action.calculateThisBonusDamagePerStateStackPct(target)).toBe(15);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-debuff-and-state-damage-bonus.test.js
