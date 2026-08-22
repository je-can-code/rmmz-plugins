//region plugins/abs/core/_component/game-action-state-multipliers-and-history-bonus.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/** Builds a minimal skill stub with the given notetag string. */
function buildSkill(note)
{
  const skill = Object.create(globalThis.RPG_Skill.prototype);
  skill.id = 1;
  skill.note = note;
  skill.meta = {};
  skill._original = function() { return this; };
  return skill;
}

/** Builds a minimal caster stub whose getAllNotes returns the given note sources. */
function buildCaster(overrides = {})
{
  return {
    getAllNotes: () => [],
    getUuid: () => 'caster-uuid',
    isStateAffected: () => false,
    ...overrides,
  };
}

/** Builds a minimal target stub. */
function buildTarget(overrides = {})
{
  return {
    states: () => [],
    isStateAffected: () => false,
    getUuid: () => 'target-uuid',
    ...overrides,
  };
}

/** Builds a minimal Game_Action stub backed by the given caster and skill. */
function buildAction(caster, skill)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => caster;
  action.item = () => skill;
  return action;
}

describe('J-ABS Game_Action state multipliers + skill history bonus (direct src import)', () =>
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
    globalThis.$jabsEngine = {
      querySkillExecutionLog: vi.fn(() => 0),
      getJabsStateByUuidAndStateId: vi.fn(() => null),
      getJabsStatesByUuid: vi.fn(() => new Map()),
    };
  });

  describe('parseSkillHistoryBracket', () =>
  {
    it('parses a well-formed bracket into its window/pct/countMode parts', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      const result = action.parseSkillHistoryBracket('[3, 8, streak]');
      expect(result).toEqual({ window: 3, pct: 8, countMode: 'streak' });
    });

    it('lowercases the count mode', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      const result = action.parseSkillHistoryBracket('[3, 8, STREAK]');
      expect(result.countMode).toBe('streak');
    });

    it('returns null when the bracket has the wrong number of parts', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.parseSkillHistoryBracket('[3, 8]')).toBeNull();
    });
  });

  describe('parseGeneralSkillHistoryBracket', () =>
  {
    it('parses a well-formed bracket into its typeId/window/pct/countMode parts', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      const result = action.parseGeneralSkillHistoryBracket('[7, 5, 5, streak]');
      expect(result).toEqual({ typeId: 7, window: 5, pct: 5, countMode: 'streak' });
    });

    it('returns null when the bracket has the wrong number of parts', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.parseGeneralSkillHistoryBracket('[7, 5, 5]')).toBeNull();
    });
  });

  describe('calculateThisSkillHistoryBonusPct', () =>
  {
    it('returns 0 when the skill has no thisSkillHistoryBonus tag', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.calculateThisSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('returns 0 when the tag is malformed (2-part bracket never matches the 3-part outer regex)', () =>
    {
      const action = buildAction(buildCaster(), buildSkill('<thisSkillHistoryBonus:[3, 8]>'));
      expect(action.calculateThisSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('returns 0 when the parser itself reports the bracket as malformed', () =>
    {
      // Arrange: the outer regex's own 3-part shape means parseSkillHistoryBracket can never
      // actually return null through this caller in practice- isolate the caller's own
      // defensive branch by stubbing the parser directly, since it's a real documented
      // contract (not a nullIfEmpty-guaranteed non-null return) that may matter to future callers.
      const action = buildAction(buildCaster(), buildSkill('<thisSkillHistoryBonus:[3, 8, streak]>'));
      action.parseSkillHistoryBracket = () => null;

      // Act & Assert
      expect(action.calculateThisSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('queries the log scoped to this skill id and multiplies by the returned count', () =>
    {
      globalThis.$jabsEngine.querySkillExecutionLog.mockReturnValue(3);
      const skill = buildSkill('<thisSkillHistoryBonus:[3, 8, streak]>');
      const action = buildAction(buildCaster(), skill);

      const result = action.calculateThisSkillHistoryBonusPct('the-uuid');

      expect(globalThis.$jabsEngine.querySkillExecutionLog).toHaveBeenCalledWith('the-uuid', skill.id, 0, 3, 'streak');
      expect(result).toBe(24);
    });
  });

  describe('calculateGeneralSkillHistoryBonusPct', () =>
  {
    it('returns 0 when there are no skillHistoryBonus tags anywhere', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('') ] });
      const action = buildAction(caster, buildSkill(''));
      expect(action.calculateGeneralSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('skips a malformed bracket (3-part bracket never matches the 4-part outer regex)', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<skillHistoryBonus:[7, 5, 5]>') ] });
      const action = buildAction(caster, buildSkill(''));
      expect(action.calculateGeneralSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('skips a tag when the parser itself reports the bracket as malformed', () =>
    {
      // Arrange: same reachability note as the this-skill variant above- isolate the caller's
      // own defensive branch by stubbing the parser directly.
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<skillHistoryBonus:[7, 5, 5, streak]>') ] });
      const action = buildAction(caster, buildSkill(''));
      action.parseGeneralSkillHistoryBracket = () => null;

      // Act & Assert
      expect(action.calculateGeneralSkillHistoryBonusPct('uuid')).toBe(0);
    });

    it('sums contributions from multiple note sources', () =>
    {
      globalThis.$jabsEngine.querySkillExecutionLog.mockReturnValue(2);
      const noteA = buildSkill('<skillHistoryBonus:[7, 5, 5, streak]>');
      const noteB = buildSkill('<skillHistoryBonus:[9, 5, 3, streak]>');
      const caster = buildCaster({ getAllNotes: () => [ noteA, noteB ] });
      const action = buildAction(caster, buildSkill(''));

      const result = action.calculateGeneralSkillHistoryBonusPct('the-uuid');

      // each tag contributes pct(5 or 3) * count(2) = 10 + 6 = 16.
      expect(result).toBe(16);
      expect(globalThis.$jabsEngine.querySkillExecutionLog).toHaveBeenCalledWith('the-uuid', 0, 7, 5, 'streak');
      expect(globalThis.$jabsEngine.querySkillExecutionLog).toHaveBeenCalledWith('the-uuid', 0, 9, 5, 'streak');
    });
  });

  describe('applySkillHistoryBonus', () =>
  {
    it('returns the base damage unchanged when it is non-positive', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.applySkillHistoryBonus(0)).toBe(0);
      expect(action.applySkillHistoryBonus(-5)).toBe(-5);
    });

    it('leaves a heal (negative damage) alone even when a history bonus is live', () =>
    {
      // Arrange- an untagged caster makes the combined-percent gate downstream do the same job as
      // the non-positive gate, so the case above passes with the sign check deleted. Arming a real
      // 10% bonus first means only the sign check can be what leaves this at -100.
      globalThis.$jabsEngine.querySkillExecutionLog.mockReturnValue(1);
      const skill = buildSkill('<thisSkillHistoryBonus:[3, 10, streak]>');
      const action = buildAction(buildCaster(), skill);

      // Act
      const result = action.applySkillHistoryBonus(-100);

      // Assert- heals are negative damage in this engine, so scaling one by a damage bonus would
      // silently make the caster's own healing stronger the more they spammed the skill.
      expect(result).toBe(-100);
    });

    it('returns the base damage unchanged when the caster has no uuid', () =>
    {
      // Arrange- same backstop problem: with no tag anywhere the combined percent is zero and the
      // damage comes back unchanged regardless of the uuid gate. The tag is armed so that skipping
      // the gate would query the log with a null uuid and scale the result to 110.
      globalThis.$jabsEngine.querySkillExecutionLog.mockReturnValue(1);
      const caster = buildCaster({ getUuid: () => null });
      const action = buildAction(caster, buildSkill('<thisSkillHistoryBonus:[3, 10, streak]>'));

      // Act & Assert
      expect(action.applySkillHistoryBonus(100)).toBe(100);
      expect(globalThis.$jabsEngine.querySkillExecutionLog).not.toHaveBeenCalled();
    });

    it('returns the base damage unchanged when neither source contributes a bonus', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.applySkillHistoryBonus(100)).toBe(100);

      // the fractional case is the one that proves the zero-percent gate is doing work- percent
      // guard reduction runs upstream of this call and hands over un-rounded damage, so falling
      // through to the multiplier instead of returning early would quietly round 112.5 down to 112.
      expect(action.applySkillHistoryBonus(112.5)).toBe(112.5);
    });

    it('scales and rounds the base damage by the combined bonus percent', () =>
    {
      globalThis.$jabsEngine.querySkillExecutionLog.mockReturnValue(1);
      const skill = buildSkill('<thisSkillHistoryBonus:[3, 10, streak]>');
      const action = buildAction(buildCaster(), skill);

      // combined pct = 10 (this) + 0 (general, no caster tags) = 10%.
      const result = action.applySkillHistoryBonus(100);

      expect(result).toBe(110);
    });
  });

  describe('calculatePerStateTypePct', () =>
  {
    function buildState(types)
    {
      return { types: () => types };
    }

    it('returns 0 when the caster has no bonusDamagePerStateType tags', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('') ] });
      const action = buildAction(caster, buildSkill(''));
      expect(action.calculatePerStateTypePct(buildTarget())).toBe(0);
    });

    it('multiplies each tag\'s percent by the count of matching-type states on the target', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<bonusDamagePerStateType:[poison, 5]>') ] });
      const target = buildTarget({
        states: () => [ buildState([ 'poison' ]), buildState([ 'poison', 'burn' ]), buildState([ 'burn' ]) ],
      });
      const action = buildAction(caster, buildSkill(''));

      const result = action.calculatePerStateTypePct(target);

      // 2 states carry the "poison" type (case-insensitively), each contributing 5%.
      expect(result).toBe(10);
    });

    it('matches state types case-insensitively', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<bonusDamagePerStateType:[Poison, 5]>') ] });
      const target = buildTarget({ states: () => [ buildState([ 'POISON' ]) ] });
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculatePerStateTypePct(target)).toBe(5);
    });

    it('sums contributions across multiple tags', () =>
    {
      const caster = buildCaster({
        getAllNotes: () => [ buildSkill('<bonusDamagePerStateType:[poison, 5]>\n<bonusDamagePerStateType:[burn, 3]>') ],
      });
      const target = buildTarget({ states: () => [ buildState([ 'poison' ]), buildState([ 'burn' ]) ] });
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculatePerStateTypePct(target)).toBe(8);
    });
  });

  describe('applyStateDamageMultipliers', () =>
  {
    it('returns the base damage unchanged when it is non-positive', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.applyStateDamageMultipliers(0, buildTarget())).toBe(0);
      expect(action.applyStateDamageMultipliers(-10, buildTarget())).toBe(-10);
    });

    it('leaves a heal (negative damage) alone even when a state bonus is live', () =>
    {
      // Arrange- with an untagged caster the combined-percent gate further down returns the damage
      // unchanged all by itself, so the case above never actually constrained the sign check. A
      // real 15% bonus removes that backstop: only the sign check can still return -100 here.
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<bonusDamage:15>') ] });
      const action = buildAction(caster, buildSkill(''));

      // Act
      const result = action.applyStateDamageMultipliers(-100, buildTarget());

      // Assert- heals travel as negative damage, so amplifying one would turn an offensive
      // exploitation bonus into a healing buff.
      expect(result).toBe(-100);
    });

    it('returns the base damage unchanged when no source contributes a bonus', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('') ] });
      const action = buildAction(caster, buildSkill(''));

      expect(action.applyStateDamageMultipliers(100, buildTarget())).toBe(100);
    });

    it('scales and rounds the base damage by the combined percent from every contributing source', () =>
    {
      const caster = buildCaster({ getAllNotes: () => [ buildSkill('<bonusDamage:15>') ] });
      const action = buildAction(caster, buildSkill(''));

      const result = action.applyStateDamageMultipliers(100, buildTarget());

      expect(result).toBe(115);
    });

    it('sums contributions from multiple independent bonus tag types', () =>
    {
      const caster = buildCaster({
        getAllNotes: () => [ buildSkill('<bonusDamage:10>\n<bonusDamageIfSelfState:[3, 5]>') ],
        isStateAffected: stateId => stateId === 3,
      });
      const action = buildAction(caster, buildSkill(''));

      // 10% flat + 5% self-state = 15%.
      const result = action.applyStateDamageMultipliers(200, buildTarget());

      expect(result).toBe(230);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-state-multipliers-and-history-bonus.test.js
