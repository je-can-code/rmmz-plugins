//region plugins/abs/ext/formula/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Formula RPG_Skill (unit, all downstream dependencies mocked)', () =>
{
  const FORMULA_APPLY_REGEX = Symbol('FormulaApply');
  const SKILL_APPLY_REGEX = Symbol('SkillApply');

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.FORMULA namespace- only the shape this one file reads.
    globalThis.J = {
      ABS: {
        EXT: {
          FORMULA: {
            RegExp: { FormulaApply: FORMULA_APPLY_REGEX, SkillApply: SKILL_APPLY_REGEX },
          },
        },
      },
    };

    // RPGManager is a downstream dependency (different file); mock it entirely.
    globalThis.RPGManager = { getArraysFromNotesByRegex: vi.fn() };

    // FormulaEffect is a downstream dependency (a sibling model file); mock its static factories
    // with identity-preserving stand-ins so this file's own wiring/caching logic is what's tested.
    vi.doMock('../../../../../../src/plugins/abs/ext/formula/__models/FormulaEffect.js', () => ({
      default: {
        fromFormulaTuple: vi.fn((tuple) => ({ from: 'formula', tuple })),
        fromSkillTuple: vi.fn((tuple) => ({ from: 'skill', tuple })),
      },
    }));

    // RPG_Skill.prototype only needs to exist for functions to attach to.
    function RPG_Skill()
    {
    }

    globalThis.RPG_Skill = RPG_Skill;

    // the file under test- patches globalThis.RPG_Skill.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/formula/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getArraysFromNotesByRegex.mockReset();
  });

  function buildSkill()
  {
    return Object.create(globalThis.RPG_Skill.prototype);
  }

  describe('jabsFormulaEffects', () =>
  {
    it('builds and caches the effects on first access', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex
        .mockReturnValueOnce([ [ 'hit', 'target', 'hp', 'a.atk' ] ])
        .mockReturnValueOnce([]);
      const skill = buildSkill();

      // Act
      const result = skill.jabsFormulaEffects();

      // Assert
      expect(result).toHaveLength(1);
      expect(skill._j._abs._formulaEffects).toBe(result);
    });

    it('returns the cached effects on subsequent access without reparsing', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex
        .mockReturnValueOnce([ [ 'hit', 'target', 'hp', 'a.atk' ] ])
        .mockReturnValueOnce([]);
      const skill = buildSkill();

      // Act
      const first = skill.jabsFormulaEffects();
      const second = skill.jabsFormulaEffects();

      // Assert
      expect(second).toBe(first);
      expect(globalThis.RPGManager.getArraysFromNotesByRegex).toHaveBeenCalledTimes(2);
    });
  });

  describe('extractJabsFormulaEffects', () =>
  {
    it('combines by-formula and by-skill effects into a single array', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex
        .mockReturnValueOnce([ [ 'hit', 'target', 'hp', 'a.atk' ] ])
        .mockReturnValueOnce([ [ 'use', 'self', '7' ] ]);
      const skill = buildSkill();

      // Act
      const result = skill.extractJabsFormulaEffects();

      // Assert
      expect(globalThis.RPGManager.getArraysFromNotesByRegex).toHaveBeenNthCalledWith(1, skill, FORMULA_APPLY_REGEX);
      expect(globalThis.RPGManager.getArraysFromNotesByRegex).toHaveBeenNthCalledWith(2, skill, SKILL_APPLY_REGEX);
      expect(result).toEqual([
        { from: 'formula', tuple: [ 'hit', 'target', 'hp', 'a.atk' ] },
        { from: 'skill', tuple: [ 'use', 'self', '7' ] },
      ]);
    });

    it('defaults to an empty array when RPGManager finds no matching tags', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([]);
      const skill = buildSkill();

      // Act
      const result = skill.extractJabsFormulaEffects();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/formula/database/rpg-skill.test.js
