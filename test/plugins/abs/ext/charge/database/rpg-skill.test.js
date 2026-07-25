//region plugins/abs/ext/charge/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge RPG_Skill (unit, all downstream dependencies mocked)', () =>
{
  const CHARGE_DATA_REGEX = Symbol('ChargeData');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { CHARGE: { RegExp: { ChargeData: CHARGE_DATA_REGEX } } } } };
    globalThis.RPGManager = { getArraysFromNotesByRegex: vi.fn() };

    function RPG_Skill()
    {
    }

    globalThis.RPG_Skill = RPG_Skill;

    await import('../../../../../../src/plugins/abs/ext/charge/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getArraysFromNotesByRegex.mockReset();
  });

  describe('jabsChargeData', () =>
  {
    it('reads the charge tier arrays from notes', () =>
    {
      // Arrange
      const skill = Object.create(globalThis.RPG_Skill.prototype);
      const tiers = [ [ 1, 30, 5, 0, 0 ] ];
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue(tiers);

      // Act
      const result = skill.jabsChargeData;

      // Assert
      expect(globalThis.RPGManager.getArraysFromNotesByRegex).toHaveBeenCalledWith(skill, CHARGE_DATA_REGEX, true);
      expect(result).toBe(tiers);
    });
  });
});
//endregion plugins/abs/ext/charge/database/rpg-skill.test.js
