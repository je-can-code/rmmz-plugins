//region plugins/abs/ext/food/database/rpg-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food RPG_State (unit, all downstream dependencies mocked)', () =>
{
  const FOOD_CHAIN_REGEX = Symbol('FoodChain');
  const FOOD_GROUP_COLOR_REGEX = Symbol('FoodGroupColor');

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { RegExp: { FoodChain: FOOD_CHAIN_REGEX, FoodGroupColor: FOOD_GROUP_COLOR_REGEX } } } } };
    globalThis.RPGManager = { getStringFromNoteByRegex: vi.fn() };

    function RPG_State()
    {
    }

    globalThis.RPG_State = RPG_State;

    await import('../../../../../../src/plugins/abs/ext/food/database/RPG_State.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getStringFromNoteByRegex.mockReset();
  });

  describe('jabsFoodChainType', () =>
  {
    it('returns null when there is no tag', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);
      const state = Object.create(globalThis.RPG_State.prototype);
      expect(state.jabsFoodChainType).toBeNull();
    });

    it('lowercases the tagged chain type', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('OVERSTUFFED');
      const state = Object.create(globalThis.RPG_State.prototype);
      expect(state.jabsFoodChainType).toBe('overstuffed');
    });
  });

  describe('jabsFoodGroupColor', () =>
  {
    it('returns null when there is no tag', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);
      const state = Object.create(globalThis.RPG_State.prototype);
      expect(state.jabsFoodGroupColor).toBeNull();
    });

    it('returns the raw hex color string, unmodified', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('#44CC44');
      const state = Object.create(globalThis.RPG_State.prototype);
      expect(state.jabsFoodGroupColor).toBe('#44CC44');
    });
  });
});
//endregion plugins/abs/ext/food/database/rpg-state.test.js
