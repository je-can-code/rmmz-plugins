//region plugins/abs/ext/food/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food RPG_Skill (unit, all downstream dependencies mocked)', () =>
{
  const END_FOOD_CHAIN_REGEX = Symbol('EndFoodChain');
  const IMPERVIOUS_REGEX = Symbol('FoodChainImpervious');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          FOOD: {
            RegExp: {
              EndFoodChain: END_FOOD_CHAIN_REGEX,
              FoodChainImpervious: IMPERVIOUS_REGEX,
            },
          },
        },
      },
    };
    globalThis.RPGManager = { checkForBooleanFromNoteByRegex: vi.fn() };

    function RPG_Skill()
    {
    }

    globalThis.RPG_Skill = RPG_Skill;

    await import('../../../../../../src/plugins/abs/ext/food/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset();
  });

  describe('jabsEndsFoodChain', () =>
  {
    it('is true when the skill carries the tag', () =>
    {
      // Arrange
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const skill = Object.create(globalThis.RPG_Skill.prototype);

      // Act
      const result = skill.jabsEndsFoodChain;

      // Assert- the exact regex matters, since the sibling immunity tag is also on offer and
      // reading the wrong one would still return true here.
      expect(result).toBe(true);
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex)
        .toHaveBeenCalledWith(skill, END_FOOD_CHAIN_REGEX);
    });

    it('is false when the skill does not carry the tag', () =>
    {
      // Arrange- an untagged skill is the ordinary case, and it is also the endurance-move case:
      // omitting the tag is an authoring decision, not a defect.
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      const skill = Object.create(globalThis.RPG_Skill.prototype);

      // Act
      const result = skill.jabsEndsFoodChain;

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/food/database/rpg-skill.test.js
