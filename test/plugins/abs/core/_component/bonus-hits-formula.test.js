//region plugins/abs/core/_component/bonus-hits-formula.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula tags parse and eval for real.
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
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
 * @param {string} note
 * @returns {object}
 */
function buildStateRow(note)
{
  const row = Object.create(globalThis.RPG_State.prototype);
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

describe('J-ABS formula-based bonus hits (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    // RPG_TraitItem.js patches this bare global's prototype- must be the same module instance RPG_State
    // (imported above) extends, so the jabsBonusHitsScope* getters land on RPG_State's real prototype chain.
    ({ default: globalThis.RPG_Traited } = await import('../../../../../src/plugins/_base/database/base/RPG_Traited.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.RPG_Skill.prototype with jabsBonusHitsFromSkillNote/jabsPierceCount getters.
    await import('../../../../../src/plugins/abs/core/database/RPG_Skill.js');

    // patches globalThis.RPG_Traited.prototype with jabsBonusHitsScopeGlobal/Basic/Skill getters.
    await import('../../../../../src/plugins/abs/core/database/RPG_TraitItem.js');

    // the file under test for makeHitsPerConnectionBonus- a real class, not a prototype patch.
    ({ default: globalThis.JABS_Action } = await import('../../../../../src/plugins/abs/core/models/JABS_Action.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
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
        getBonusHitsFromSources: globalThis.Game_Battler.prototype.getBonusHitsFromSources,
      };
    }

    it('sums flat integer tags across all three scopes', () =>
    {
      // Arrange
      const battler = buildBattler();
      const sources = [
        buildStateRow('<bonus-hits-global:1>\n<bonus-hits-basic:2>\n<bonus-hits-skill:3>'),
      ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals).toEqual({ global: 1, basic: 2, skill: 3 });
    });

    it('evaluates formula tags with "a" bound to the battler', () =>
    {
      // Arrange
      const battler = buildBattler({ mhp: 250 });
      const sources = [ buildStateRow('<bonus-hits-global:[a.mhp / 100]>') ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals.global).toBeCloseTo(2.5);
    });

    it('sums flat and formula contributions together for the same scope', () =>
    {
      // Arrange
      const battler = buildBattler({ mhp: 100 });
      const sources = [ buildStateRow('<bonus-hits-global:2>\n<bonus-hits-global:[a.mhp / 100]>') ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals.global).toBeCloseTo(3);
    });

    it('sums contributions across multiple sources', () =>
    {
      // Arrange
      const battler = buildBattler({ mhp: 100 });
      const sources = [
        buildStateRow('<bonus-hits-basic:1>'),
        buildStateRow('<bonus-hits-basic:[a.mhp / 50]>'),
      ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals.basic).toBeCloseTo(3);
    });

    it('contributes 0 for scopes with no matching tags', () =>
    {
      // Arrange
      const battler = buildBattler();
      const sources = [ buildStateRow('<bonus-hits-global:5>') ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals.basic).toBe(0);
      expect(totals.skill).toBe(0);
    });

    it('skips a falsy entry in the sources collection without throwing', () =>
    {
      // Arrange
      const battler = buildBattler();
      const sources = [ null, buildStateRow('<bonus-hits-global:5>') ];

      // Act
      const totals = battler.getBonusHitsFromSources(sources);

      // Assert
      expect(totals.global).toBe(5);
    });
  });

  describe('JABS_Action.makeHitsPerConnectionBonus', () =>
  {
    /**
     * Builds a plain duck-typed "JABS_Action" carrying only what makeHitsPerConnectionBonus
     * touches, borrowed directly from the real prototype.
     * @param {object} options
     * @param {string} options.skillNote The executing skill's note (for the skill-note tags).
     * @param {boolean} [options.isBasicAttack] Whether the caster's isSkillIdBasicAttack should report true.
     * @param {number} [options.hitsGlobal] Pre-summed battler-side global bonus hits.
     * @param {number} [options.hitsBasic] Pre-summed battler-side basic-scope bonus hits.
     * @param {number} [options.hitsSkill] Pre-summed battler-side skill-scope bonus hits.
     * @param {object} [options.evalFields] Stat fields exposed to the skill-note formula via `a.<field>`.
     * @returns {object}
     */
    function buildAction({
      skillNote,
      isBasicAttack = false,
      hitsGlobal = 0,
      hitsBasic = 0,
      hitsSkill = 0,
      evalFields = {},
    })
    {
      const skillRow = buildSkillRow(skillNote);
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
        baseSkill: () => skillRow,
        getCaster: () => casterJabsBattler,
        makeHitsPerConnectionBonus: globalThis.JABS_Action.prototype.makeHitsPerConnectionBonus,
      };
    }

    it('sums the flat skill-note tag with battler-side totals', () =>
    {
      // Arrange
      const action = buildAction({
        skillNote: '<bonus-hits:2>',
        hitsGlobal: 1,
        hitsSkill: 3,
        isBasicAttack: false,
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(6);
    });

    it('evaluates the skill-note formula tag with "a" bound to the caster', () =>
    {
      // Arrange- floor(4.7) = 4.
      const action = buildAction({
        skillNote: '<bonus-hits:[a.luk / 10]>',
        evalFields: { luk: 47 },
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(4);
    });

    it('floors the combined total once at the end, not each contribution separately', () =>
    {
      // Arrange- 0.9 (global) + 1 (flat note) + 1.5 (formula note) = 3.4, floored once to 3.
      const action = buildAction({
        skillNote: '<bonus-hits:[a.luk / 10]>\n<bonus-hits:1>',
        hitsGlobal: 0.9,
        evalFields: { luk: 15 },
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(3);
    });

    it('picks the basic-scope battler total for basic attacks, not the skill-scope total', () =>
    {
      // Arrange
      const action = buildAction({
        skillNote: '',
        hitsBasic: 5,
        hitsSkill: 99,
        isBasicAttack: true,
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(5);
    });

    it('picks the skill-scope battler total for non-basic skills, not the basic-scope total', () =>
    {
      // Arrange
      const action = buildAction({
        skillNote: '',
        hitsBasic: 99,
        hitsSkill: 5,
        isBasicAttack: false,
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(5);
    });

    it('clamps a negative combined total to 0', () =>
    {
      // Arrange
      const action = buildAction({
        skillNote: '<bonus-hits:[a.luk - 100]>',
        evalFields: { luk: 10 },
      });

      // Act
      const result = action.makeHitsPerConnectionBonus();

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/abs/core/_component/bonus-hits-formula.test.js
