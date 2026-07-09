//region plugins/jafting/create-crafting-recipe-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingRecipe from '../../../src/plugins/jafting/ext/create/__models/CraftingRecipe.js';

/**
 * Direct-import coverage for CraftingRecipe. The class only statically imports CraftingComponent for
 * JSDoc typing- its own methods work against whatever fake component objects are passed into
 * ingredients/tools/outputs, so this file uses simple hand-built fakes rather than real CraftingComponent
 * instances. craft() reaches JaftingSalvageManager and $gameParty as bare globals (never imported), so
 * both are stubbed minimally.
 */
describe('CraftingRecipe (direct src import)', () =>
{
  /**
   * Minimal fake mirroring the CraftingComponent surface CraftingRecipe actually calls.
   *
   * @param {object} opts
   * @returns {object}
   */
  function fakeComponent({ hasEnough = true, item } = {})
  {
    return {
      hasEnough: vi.fn(() => hasEnough),
      consume: vi.fn(),
      generate: vi.fn(),
      getItem: vi.fn(() => item),
    };
  }

  let tracking;

  beforeEach(() =>
  {
    tracking = { improveProficiency: vi.fn(), hasBeenCrafted: vi.fn(() => false) };

    globalThis.$gameParty = {
      getRecipeTrackingByKey: vi.fn(() => tracking),
    };

    globalThis.JaftingSalvageManager = { applyCraftRecipeOutputs: vi.fn() };
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
    delete globalThis.JaftingSalvageManager;
  });

  describe('canCraft', () =>
  {
    it('is true only when every ingredient and every tool reports hasEnough', () =>
    {
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [ fakeComponent({ hasEnough: true }) ],
        [ fakeComponent({ hasEnough: true }) ],
        [],
      );

      expect(recipe.canCraft()).toBe(true);
    });

    it('is false when any ingredient is missing', () =>
    {
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [ fakeComponent({ hasEnough: false }) ],
        [],
        [],
      );

      expect(recipe.canCraft()).toBe(false);
    });

    it('is false when any tool is missing even if ingredients are satisfied', () =>
    {
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [ fakeComponent({ hasEnough: true }) ],
        [ fakeComponent({ hasEnough: false }) ],
        [],
      );

      expect(recipe.canCraft()).toBe(false);
    });
  });

  describe('craft', () =>
  {
    it('consumes ingredients, generates outputs, stamps salvage lineage, and improves proficiency', () =>
    {
      const ingredient = fakeComponent();
      const output = fakeComponent();
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [ ingredient ], [], [ output ],
      );

      recipe.craft();

      expect(ingredient.consume).toHaveBeenCalledTimes(1);
      expect(output.generate).toHaveBeenCalledTimes(1);
      expect(JaftingSalvageManager.applyCraftRecipeOutputs).toHaveBeenCalledWith(recipe);
      expect($gameParty.getRecipeTrackingByKey).toHaveBeenCalledWith('potion');
      expect(tracking.improveProficiency).toHaveBeenCalledTimes(1);
    });
  });

  describe('needsMasking', () =>
  {
    it('is false outright when maskedUntilCrafted is false', () =>
    {
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, false, [], [], [],
      );

      expect(recipe.needsMasking()).toBe(false);
    });

    it('is true while maskedUntilCrafted is true and it has never been crafted', () =>
    {
      tracking.hasBeenCrafted.mockReturnValue(false);
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, true, [], [], [],
      );

      expect(recipe.needsMasking()).toBe(true);
    });

    it('is false once the tracking reports it has been crafted before', () =>
    {
      tracking.hasBeenCrafted.mockReturnValue(true);
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, true, [], [], [],
      );

      expect(recipe.needsMasking()).toBe(false);
    });
  });

  describe('getProficiency', () =>
  {
    it('reads craftingProficiency from the recipe tracking', () =>
    {
      tracking.craftingProficiency = vi.fn(() => 7);
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, false, [], [], [],
      );

      expect(recipe.getProficiency()).toBe(7);
    });
  });

  describe('getRecipeName / getRecipeDescription / getRecipeIcon', () =>
  {
    it('falls back to the primary output when name/description/icon are unset', () =>
    {
      const output = fakeComponent({ item: { name: 'Output Item', description: 'output desc', iconIndex: 42 } });
      const recipe = new CraftingRecipe(
        '', 'potion', [], -1, '', true, false, [], [], [ output ],
      );

      expect(recipe.getRecipeName()).toBe('Output Item');
      expect(recipe.getRecipeDescription()).toBe('output desc');
      expect(recipe.getRecipeIcon()).toBe(42);
    });

    it('uses the recipe own name/description/icon when defined', () =>
    {
      const recipe = new CraftingRecipe(
        'Custom Name', 'potion', [], 9, 'custom desc', true, false, [], [], [],
      );

      expect(recipe.getRecipeName()).toBe('Custom Name');
      expect(recipe.getRecipeDescription()).toBe('custom desc');
      expect(recipe.getRecipeIcon()).toBe(9);
    });

    it('masks name/description with question marks and forces icon 93 while needing masking', () =>
    {
      tracking.hasBeenCrafted.mockReturnValue(false);
      const recipe = new CraftingRecipe(
        "Fire's Potion!", 'potion', [], 9, "It's hot.", true, true, [], [], [],
      );

      // masking regex swaps every letter/apostrophe/bang/dot for '?' but leaves spaces untouched:
      // "Fire's" (6 chars) -> "??????", "Potion!" (7 chars) -> "???????".
      expect(recipe.getRecipeName()).toBe('?????? ???????');
      // "It's" (4 chars) -> "????", "hot." (4 chars) -> "????".
      expect(recipe.getRecipeDescription()).toBe('???? ????');
      expect(recipe.getRecipeIcon()).toBe(93);
    });
  });

  describe('getPrimaryOutput', () =>
  {
    it('returns the getItem() of the first output', () =>
    {
      const output = fakeComponent({ item: { id: 1 } });
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, false, [], [], [ output ],
      );

      expect(recipe.getPrimaryOutput()).toEqual({ id: 1 });
    });
  });

  describe('getAllComponents', () =>
  {
    it('generates every ingredient and tool (debug helper)', () =>
    {
      const ingredient = fakeComponent();
      const tool = fakeComponent();
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [], 1, 'desc', true, false, [ ingredient ], [ tool ], [],
      );

      recipe.getAllComponents();

      expect(ingredient.generate).toHaveBeenCalledTimes(1);
      expect(tool.generate).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/jafting/create-crafting-recipe-direct.test.js
