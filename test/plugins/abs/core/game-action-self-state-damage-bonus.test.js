//region plugins/abs/core/game-action-self-state-damage-bonus.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS Game_Action self-state damage bonus (out/abs/J-ABS.js)', () =>
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
   * Builds a minimal skill stub with the given notetag string.
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
    const action = Object.create(sandbox.Game_Action.prototype);
    action.subject = () => caster;
    action.item = () => skill;
    return action;
  }

  // ─── bonusDamageIfSelfState (caster notes) ────────────────────────────────

  describe('calculateBonusIfSelfStatePct', () =>
  {
    it('returns 0 when the caster has no bonusDamageIfSelfState tags', () =>
    {
      const caster = buildCaster([ buildSkill('') ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateBonusIfSelfStatePct()).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the caster', () =>
    {
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ passiveNote ], []);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateBonusIfSelfStatePct()).toBe(0);
    });

    it('returns the configured percent when the tagged state is active on the caster', () =>
    {
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ passiveNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateBonusIfSelfStatePct()).toBe(50);
    });

    it('stacks additively across multiple tags for different states, all active', () =>
    {
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 25]>\n<bonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([ passiveNote ], [ 10, 11 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateBonusIfSelfStatePct()).toBe(100);
    });

    it('only counts tags whose state is currently active on the caster', () =>
    {
      const passiveNote = buildSkill('<bonusDamageIfSelfState:[10, 25]>\n<bonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([ passiveNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      // only state 10 is active; state 11 is not.
      expect(action.calculateBonusIfSelfStatePct()).toBe(25);
    });

    it('accumulates across multiple note sources', () =>
    {
      const note1 = buildSkill('<bonusDamageIfSelfState:[10, 30]>');
      const note2 = buildSkill('<bonusDamageIfSelfState:[10, 20]>');
      const caster = buildCaster([ note1, note2 ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateBonusIfSelfStatePct()).toBe(50);
    });
  });

  // ─── thisBonusDamageIfSelfState (skill note only) ─────────────────────────

  describe('calculateThisBonusDamageIfSelfStatePct', () =>
  {
    it('returns 0 when the skill has no thisBonusDamageIfSelfState tags', () =>
    {
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the caster', () =>
    {
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([], []);
      const action = buildAction(caster, skill);

      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(0);
    });

    it('returns the configured percent when the tagged state is active on the caster', () =>
    {
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, skill);

      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(50);
    });

    it('stacks additively across multiple tags for different states, all active', () =>
    {
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 25]>\n<thisBonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([], [ 10, 11 ]);
      const action = buildAction(caster, skill);

      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(100);
    });

    it('only counts tags whose state is currently active on the caster', () =>
    {
      const skill = buildSkill('<thisBonusDamageIfSelfState:[10, 25]>\n<thisBonusDamageIfSelfState:[11, 75]>');
      const caster = buildCaster([], [ 10 ]);
      const action = buildAction(caster, skill);

      // only state 10 is active; state 11 contributes nothing.
      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(25);
    });

    it('does not read thisBonusDamageIfSelfState from caster notes, only from the skill', () =>
    {
      // the tag is on a caster note source, not on the skill itself.
      const casterNote = buildSkill('<thisBonusDamageIfSelfState:[10, 50]>');
      const caster = buildCaster([ casterNote ], [ 10 ]);
      const action = buildAction(caster, buildSkill(''));

      expect(action.calculateThisBonusDamageIfSelfStatePct()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/game-action-self-state-damage-bonus.test.js
