//region plugins/abs/core/game-action-state-count-damage-bonus.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS Game_Action state-count damage bonus (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  /**
   * Builds a minimal skill/note-source stub with the given notetag string.
   * @param {string} note
   * @returns {object}
   */
  function buildSkill(note)
  {
    const skill = Object.create(sandbox.RPG_Skill.prototype);
    skill.id = 1;
    skill.note = note;
    skill.meta = {};
    skill._original = function() { return this; };
    return skill;
  }

  /**
   * Builds a minimal caster stub whose getAllNotes returns the given note sources.
   * @param {object[]} noteSources Objects with a .note string (skills, states, etc.).
   * @param {string} uuid The caster's uuid, used for authorship comparisons.
   * @returns {object}
   */
  function buildCaster(noteSources = [], uuid = 'caster')
  {
    return {
      getAllNotes()
      {
        return noteSources;
      },
      getUuid()
      {
        return uuid;
      },
    };
  }

  /**
   * Builds a minimal target stub whose isStateAffected checks the given active state ids.
   * @param {string} uuid The target's uuid, used to key $jabsEngine lookups.
   * @param {number[]} activeStateIds State ids currently active on this target.
   * @returns {object}
   */
  function buildTarget(uuid, activeStateIds = [])
  {
    return {
      getUuid()
      {
        return uuid;
      },
      isStateAffected(stateId)
      {
        return activeStateIds.includes(stateId);
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
    const action = Object.create(sandbox.Game_Action.prototype);
    action.subject = () => caster;
    action.item = () => skill;
    return action;
  }

  // ─── bonusDamagePerStateStack ──────────────────────────────────────────────

  describe('calculatePerStateStackPct', () =>
  {
    it('returns 0 when the caster has no bonusDamagePerStateStack tags', () =>
    {
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14 ]);

      expect(action.calculatePerStateStackPct(target)).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the target', () =>
    {
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', []);

      expect(action.calculatePerStateStackPct(target)).toBe(0);
    });

    it('multiplies the tag percent by the target state tracker stack count', () =>
    {
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14 ]);

      sandbox.$jabsEngine = {
        getJabsStateByUuidAndStateId: (uuid, stateId) =>
        {
          expect(uuid).toBe('target');
          expect(stateId).toBe(14);
          return { stackCount: 50 };
        },
      };

      // 2% per stack * 50 stacks = 100%.
      expect(action.calculatePerStateStackPct(target)).toBe(100);
    });

    it('stacks additively across multiple tags for different states', () =>
    {
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>\n<bonusDamagePerStateStack:[20, 5]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14, 20 ]);

      const stackCounts = { 14: 10, 20: 4 };
      sandbox.$jabsEngine = {
        getJabsStateByUuidAndStateId: (uuid, stateId) => ({ stackCount: stackCounts[stateId] }),
      };

      // (2% * 10) + (5% * 4) = 20 + 20 = 40.
      expect(action.calculatePerStateStackPct(target)).toBe(40);
    });
  });

  // ─── bonusDamageForMyStateCount (caster notes) ────────────────────────────

  describe('calculateBonusForMyStateCountPct', () =>
  {
    it('returns 0 when the caster has no bonusDamageForMyStateCount tags', () =>
    {
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target');

      sandbox.$jabsEngine = { getJabsStatesByUuid: () => new Map() };

      expect(action.calculateBonusForMyStateCountPct(target)).toBe(0);
    });

    it('counts only states authored by this caster, ignoring states authored by others', () =>
    {
      const passiveNote = buildSkill('<bonusDamageForMyStateCount:5>');
      const caster = buildCaster([ passiveNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 10, 11, 12 ]);

      const trackedStates = new Map([
        [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
        [ 11, { stateId: 11, source: { getUuid: () => 'someone-else' } } ],
        [ 12, { stateId: 12, source: { getUuid: () => 'caster' } } ],
      ]);

      sandbox.$jabsEngine = { getJabsStatesByUuid: () => trackedStates };

      // states 10 and 12 are authored by the caster; state 11 is not.
      expect(action.calculateBonusForMyStateCountPct(target)).toBe(10);
    });

    it('skips trackers whose state is not currently affecting the target', () =>
    {
      const passiveNote = buildSkill('<bonusDamageForMyStateCount:5>');
      const caster = buildCaster([ passiveNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      // state 10 is tracked but no longer actually affecting the target (lingering tracker).
      const target = buildTarget('target', []);

      const trackedStates = new Map([
        [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
      ]);

      sandbox.$jabsEngine = { getJabsStatesByUuid: () => trackedStates };

      expect(action.calculateBonusForMyStateCountPct(target)).toBe(0);
    });
  });

  // ─── thisBonusDamageForMyStateCount (skill note only) ─────────────────────

  describe('calculateThisBonusForMyStateCountPct', () =>
  {
    it('returns 0 when the skill has no thisBonusDamageForMyStateCount tag', () =>
    {
      const caster = buildCaster([], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target');

      sandbox.$jabsEngine = { getJabsStatesByUuid: () => new Map() };

      expect(action.calculateThisBonusForMyStateCountPct(target)).toBe(0);
    });

    it('does not read the tag from caster notes, only from the skill', () =>
    {
      const casterNote = buildSkill('<thisBonusDamageForMyStateCount:5>');
      const caster = buildCaster([ casterNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 10 ]);

      sandbox.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
        ]),
      };

      expect(action.calculateThisBonusForMyStateCountPct(target)).toBe(0);
    });

    it('multiplies the tag percent by the count of distinct states authored by the caster', () =>
    {
      const skill = buildSkill('<thisBonusDamageForMyStateCount:5>');
      const caster = buildCaster([], 'caster');
      const action = buildAction(caster, skill);
      const target = buildTarget('target', [ 10, 11 ]);

      sandbox.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
          [ 11, { stateId: 11, source: { getUuid: () => 'caster' } } ],
        ]),
      };

      // 5% * 2 authored states = 10.
      expect(action.calculateThisBonusForMyStateCountPct(target)).toBe(10);
    });
  });
});
//endregion plugins/abs/core/game-action-state-count-damage-bonus.test.js
