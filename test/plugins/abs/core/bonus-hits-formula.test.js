//region plugins/abs/core/bonus-hits-formula.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula tags parse and eval for real.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(sandbox, note)
{
  const row = Object.create(sandbox.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_State prototype. The battler-scoped bonus-hits getters (jabsBonusHitsScopeGlobal/
 * Basic/Skill) live on RPG_Traited, which RPG_State inherits and RPG_Skill does not- these
 * tags are meant for actor/class/equipment/state/enemy notes, never skill notes.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildStateRow(sandbox, note)
{
  const row = Object.create(sandbox.RPG_State.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a plain duck-typed "battler" carrying only what the formula eval context touches:
 * whatever stat fields a formula references, plus getLevel() (RPGManager's eval cache-buster
 * calls this unconditionally on any non-null context).
 * @param {object} fields Stat fields to expose to formulas via `a.<field>`.
 * @returns {object}
 */
function buildEvalContextBattler(fields = {})
{
  return {
    getLevel: () => 1,
    ...fields,
  };
}

describe('J-ABS formula-based bonus hits (out/abs/J-ABS.js)', () =>
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

  describe('Game_Battler.getBonusHitsFromSources', () =>
  {
    /**
     * Builds a plain duck-typed battler carrying only getBonusHitsFromSources, borrowed
     * directly from the real prototype so no full Game_Battler construction is needed.
     * @param {object} fields Stat fields exposed to formulas via `a.<field>`.
     * @returns {object}
     */
    function buildBattler(fields = {})
    {
      return {
        ...buildEvalContextBattler(fields),
        getBonusHitsFromSources: sandbox.Game_Battler.prototype.getBonusHitsFromSources,
      };
    }

    it('sums flat integer tags across all three scopes', () =>
    {
      const battler = buildBattler();
      const sources = [
        buildStateRow(sandbox, '<bonus-hits-global:1>\n<bonus-hits-basic:2>\n<bonus-hits-skill:3>'),
      ];

      const totals = battler.getBonusHitsFromSources(sources);

      expect(totals).toEqual({ global: 1, basic: 2, skill: 3 });
    });

    it('evaluates formula tags with "a" bound to the battler', () =>
    {
      const battler = buildBattler({ mhp: 250 });
      const sources = [
        buildStateRow(sandbox, '<bonus-hits-global:[a.mhp / 100]>'),
      ];

      const totals = battler.getBonusHitsFromSources(sources);

      expect(totals.global).toBeCloseTo(2.5);
    });

    it('sums flat and formula contributions together for the same scope', () =>
    {
      const battler = buildBattler({ mhp: 100 });
      const sources = [
        buildStateRow(sandbox, '<bonus-hits-global:2>\n<bonus-hits-global:[a.mhp / 100]>'),
      ];

      const totals = battler.getBonusHitsFromSources(sources);

      expect(totals.global).toBeCloseTo(3);
    });

    it('sums contributions across multiple sources', () =>
    {
      const battler = buildBattler({ mhp: 100 });
      const sources = [
        buildStateRow(sandbox, '<bonus-hits-basic:1>'),
        buildStateRow(sandbox, '<bonus-hits-basic:[a.mhp / 50]>'),
      ];

      const totals = battler.getBonusHitsFromSources(sources);

      expect(totals.basic).toBeCloseTo(3);
    });

    it('contributes 0 for scopes with no matching tags', () =>
    {
      const battler = buildBattler();
      const sources = [ buildStateRow(sandbox, '<bonus-hits-global:5>') ];

      const totals = battler.getBonusHitsFromSources(sources);

      expect(totals.basic).toBe(0);
      expect(totals.skill).toBe(0);
    });
  });

  describe('JABS_Action.makeHitsPerConnectionBonus', () =>
  {
    /**
     * Builds a plain duck-typed "JABS_Action" carrying only what makeHitsPerConnectionBonus
     * touches, borrowed directly from the real prototype.
     * @param {object} options
     * @param {string} options.skillNote The executing skill's note (for the skill-note tags).
     * @param {boolean} options.isBasicAttack Whether the caster's isSkillIdBasicAttack should report true.
     * @param {number} options.hitsGlobal Pre-summed battler-side global bonus hits.
     * @param {number} options.hitsBasic Pre-summed battler-side basic-scope bonus hits.
     * @param {number} options.hitsSkill Pre-summed battler-side skill-scope bonus hits.
     * @param {object} options.evalFields Stat fields exposed to the skill-note formula via `a.<field>`.
     * @returns {object}
     */
    function buildAction(sandboxRef, {
      skillNote,
      isBasicAttack = false,
      hitsGlobal = 0,
      hitsBasic = 0,
      hitsSkill = 0,
      evalFields = {},
    })
    {
      const skillRow = buildSkillRow(sandboxRef, skillNote);
      const gameBattler = {
        ...buildEvalContextBattler(evalFields),
        getBonusHitsGlobal: () => hitsGlobal,
        getBonusHitsBasic: () => hitsBasic,
        getBonusHitsSkill: () => hitsSkill,
      };
      const casterJabsBattler = {
        getBattler: () => gameBattler,
        isSkillIdBasicAttack: () => isBasicAttack,
      };

      return {
        _baseSkill: skillRow,
        getBaseSkill: () => skillRow,
        getCaster: () => casterJabsBattler,
        makeHitsPerConnectionBonus: sandboxRef.JABS_Action.prototype.makeHitsPerConnectionBonus,
      };
    }

    it('sums the flat skill-note tag with battler-side totals', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '<bonus-hits:2>',
        hitsGlobal: 1,
        hitsSkill: 3,
        isBasicAttack: false,
      });

      expect(action.makeHitsPerConnectionBonus()).toBe(6);
    });

    it('evaluates the skill-note formula tag with "a" bound to the caster', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '<bonus-hits:[a.luk / 10]>',
        evalFields: { luk: 47 },
      });

      // floor(4.7) = 4.
      expect(action.makeHitsPerConnectionBonus()).toBe(4);
    });

    it('floors the combined total once at the end, not each contribution separately', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '<bonus-hits:[a.luk / 10]>\n<bonus-hits:1>',
        hitsGlobal: 0.9,
        evalFields: { luk: 15 },
      });

      // 0.9 (global) + 1 (flat note) + 1.5 (formula note) = 3.4, floored once to 3.
      expect(action.makeHitsPerConnectionBonus()).toBe(3);
    });

    it('picks the basic-scope battler total for basic attacks, not the skill-scope total', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '',
        hitsBasic: 5,
        hitsSkill: 99,
        isBasicAttack: true,
      });

      expect(action.makeHitsPerConnectionBonus()).toBe(5);
    });

    it('picks the skill-scope battler total for non-basic skills, not the basic-scope total', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '',
        hitsBasic: 99,
        hitsSkill: 5,
        isBasicAttack: false,
      });

      expect(action.makeHitsPerConnectionBonus()).toBe(5);
    });

    it('clamps a negative combined total to 0', () =>
    {
      const action = buildAction(sandbox, {
        skillNote: '<bonus-hits:[a.luk - 100]>',
        evalFields: { luk: 10 },
      });

      expect(action.makeHitsPerConnectionBonus()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/bonus-hits-formula.test.js
