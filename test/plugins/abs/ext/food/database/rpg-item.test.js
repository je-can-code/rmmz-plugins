//region plugins/abs/ext/food/database/rpg-item.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food RPG_Item (unit, all downstream dependencies mocked)', () =>
{
  const FOOD_REGEX = Symbol('Food');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { RegExp: { Food: FOOD_REGEX } } } } };
    globalThis.RPGManager = { getStringFromNoteByRegex: vi.fn() };

    function RPG_Item()
    {
    }

    globalThis.RPG_Item = RPG_Item;

    await import('../../../../../../src/plugins/abs/ext/food/database/RPG_Item.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getStringFromNoteByRegex.mockReset();
  });

  describe('jabsFoodType', () =>
  {
    it('returns null when the item has no food tag', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);
      const item = Object.create(globalThis.RPG_Item.prototype);
      expect(item.jabsFoodType).toBeNull();
    });

    it('lowercases the tagged food type', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('PROTEIN');
      const item = Object.create(globalThis.RPG_Item.prototype);
      expect(item.jabsFoodType).toBe('protein');
    });
  });
});
//endregion plugins/abs/ext/food/database/rpg-item.test.js
