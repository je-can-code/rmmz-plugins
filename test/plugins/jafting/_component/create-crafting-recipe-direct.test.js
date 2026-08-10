//region plugins/jafting/_component/create-crafting-recipe-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingRecipe from '../../../../src/plugins/jafting/ext/create/__models/CraftingRecipe.js';

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
      // ingredients are allocated against a shared tally rather than polled independently.
      allocateFrom: vi.fn(() => hasEnough),
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

    it('allocates every ingredient against one shared tally', () =>
    {
      // Arrange
      const first = fakeComponent({ hasEnough: true });
      const second = fakeComponent({ hasEnough: true });
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [ first, second ], [], [],
      );

      // Act
      recipe.canCraft();

      // Assert - both slots must draw from the same map, or two slots could spend one stack.
      const [ [ firstTally ] ] = first.allocateFrom.mock.calls;
      const [ [ secondTally ] ] = second.allocateFrom.mock.calls;
      expect(firstTally).toBeInstanceOf(Map);
      expect(secondTally).toBe(firstTally);
    });

    it('does not allocate tools against the ingredient tally', () =>
    {
      // Arrange - tools are never consumed, so they must not deplete what ingredients can claim.
      const tool = fakeComponent({ hasEnough: true });
      const recipe = new CraftingRecipe(
        'Potion', 'potion', [ 'alchemy' ], 1, 'desc', true, false,
        [], [ tool ], [],
      );

      // Act
      recipe.canCraft();

      // Assert
      expect(tool.hasEnough).toHaveBeenCalledTimes(1);
      expect(tool.allocateFrom).not.toHaveBeenCalled();
    });
  });

  describe('categoricalIngredientIndices', () =>
  {
    /**
     * Builds a fake component that reports whether it is categorical.
     * @param {boolean} isCategorical Whether the slot names types rather than an id.
     * @returns {object}
     */
    function slot(isCategorical)
    {
      return {
        ...fakeComponent(),
        isCategorical: () => isCategorical,
      };
    }

    it('lists only the ingredients that name types', () =>
    {
      // Arrange
      const recipe = new CraftingRecipe(
        'Stew', 'stew', [ 'cooking' ], 1, 'desc', true, false,
        [ slot(false), slot(true), slot(false), slot(true) ], [], [],
      );

      // Act
      const result = recipe.categoricalIngredientIndices();

      // Assert
      expect(result).toEqual([ 1, 3 ]);
    });

    it('ignores categorical tools', () =>
    {
      // Arrange - a tool is never consumed, so which eligible one is held cannot matter.
      const recipe = new CraftingRecipe(
        'Stew', 'stew', [ 'cooking' ], 1, 'desc', true, false,
        [ slot(false) ], [ slot(true) ], [],
      );

      // Act
      const result = recipe.categoricalIngredientIndices();

      // Assert
      expect(result).toEqual([]);
    });

    it('needsIngredientSelection is true when any ingredient names types', () =>
    {
      // Arrange
      const recipe = new CraftingRecipe(
        'Stew', 'stew', [ 'cooking' ], 1, 'desc', true, false,
        [ slot(false), slot(true) ], [], [],
      );

      // Act
      const result = recipe.needsIngredientSelection();

      // Assert
      expect(result).toBe(true);
    });

    it('needsIngredientSelection is false when every ingredient names an id', () =>
    {
      // Arrange
      const recipe = new CraftingRecipe(
        'Stew', 'stew', [ 'cooking' ], 1, 'desc', true, false,
        [ slot(false), slot(false) ], [], [],
      );

      // Act
      const result = recipe.needsIngredientSelection();

      // Assert
      expect(result).toBe(false);
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
      expect(JaftingSalvageManager.applyCraftRecipeOutputs).toHaveBeenCalledWith(recipe, expect.any(Map));
      expect($gameParty.getRecipeTrackingByKey).toHaveBeenCalledWith('potion');
      expect(tracking.improveProficiency).toHaveBeenCalledTimes(1);
    });

    it('spends the selected entry for a categorical ingredient', () =>
    {
      // Arrange
      const chosen = { id: 388, name: 'Grim Flank' };
      const ingredient = fakeComponent();
      const recipe = new CraftingRecipe(
        'Stew', 'stew', [ 'cooking' ], 1, 'desc', true, false,
        [ ingredient ], [], [],
      );

      // Act
      recipe.craft(new Map([ [ 0, chosen ] ]));

      // Assert - the pick reaches consume, rather than the component resolving one on its own.
      expect(ingredient.consume).toHaveBeenCalledWith(chosen);
    });
  });

  //region batching
  /**
   * Batching is a shortcut for pressing craft repeatedly, so the ceiling is simply how many repetitions the stock
   * survives. Nothing substitutes a different entry once the chosen one runs out - the player named what they
   * wanted spent, and a batch quietly deciding otherwise is the failure this whole selection step exists to avoid.
   */
  /**
   * Builds a recipe from just the parts these cases care about.
   * @param {object[]} ingredients The ingredient slots.
   * @param {object[]} tools The tool slots.
   * @param {object[]} outputs The output slots.
   * @returns {CraftingRecipe}
   */
  function buildRecipe(ingredients, tools = [], outputs = [])
  {
    return new CraftingRecipe(
      'Thing', 'thing', [ 'cat' ], 1, 'desc', true, false,
      ingredients,
      tools,
      outputs,
    );
  }

  describe('maxCraftableCount', () =>
  {
    /**
     * Builds an ingredient slot wanting a given quantity of a given entry.
     * @param {object} entry The database row the slot resolves to.
     * @param {number} quantity How many the slot consumes per craft.
     * @returns {object}
     */
    function ingredientFor(entry, quantity)
    {
      return {
        ...fakeComponent({ item: entry }),
        quantity: vi.fn(() => quantity),
        isDatabaseEntry: vi.fn(() => true),
      };
    }

    it('reports how many repetitions the stock allows', () =>
    {
      // Arrange
      const gel = { id: 1 };
      globalThis.$gameParty.numItems = vi.fn(() => 24);
      const recipe = buildRecipe([ ingredientFor(gel, 1) ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(24);
    });

    it('sums demand per entry rather than per slot', () =>
    {
      // Arrange - two slots both filled by the same gel spend two of it per craft, so a stock of twenty-four is
      // twelve crafts and not twenty-four.
      const gel = { id: 1 };
      globalThis.$gameParty.numItems = vi.fn(() => 24);
      const recipe = buildRecipe([ ingredientFor(gel, 1), ingredientFor(gel, 1) ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(12);
    });

    it('is bounded by the scarcest ingredient', () =>
    {
      // Arrange
      const gel = { id: 1 };
      const herb = { id: 2 };
      globalThis.$gameParty.numItems = vi.fn(entry => entry === gel
        ? 24
        : 3);
      const recipe = buildRecipe([ ingredientFor(gel, 1), ingredientFor(herb, 1) ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(3);
    });

    it('measures the chosen entry rather than the one the slot would have picked', () =>
    {
      // Arrange - the selection is the whole point: a batch must not fall back to a roomier stack.
      const big = { id: 1 };
      const colossal = { id: 2 };
      globalThis.$gameParty.numItems = vi.fn(entry => entry === big
        ? 4
        : 99);
      const recipe = buildRecipe([ ingredientFor(colossal, 1) ]);

      // Act
      const max = recipe.maxCraftableCount(new Map([ [ 0, big ] ]));

      // Assert
      expect(max).toBe(4);
    });

    it('rounds down a stock that does not divide evenly', () =>
    {
      // Arrange
      const gel = { id: 1 };
      globalThis.$gameParty.numItems = vi.fn(() => 7);
      const recipe = buildRecipe([ ingredientFor(gel, 2) ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(3);
    });

    it('lets tools alone bound nothing, because they are never consumed', () =>
    {
      // Arrange - holding one soup pot is holding enough for any number of repetitions.
      const gel = { id: 1 };
      globalThis.$gameParty.numItems = vi.fn(() => 10);
      const tool = {
        ...fakeComponent({ item: { id: 9 } }),
        quantity: vi.fn(() => 1),
        isDatabaseEntry: vi.fn(() => true),
      };
      const recipe = buildRecipe([ ingredientFor(gel, 1) ], [ tool ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(10);
    });

    it('measures a currency slot against what it can afford', () =>
    {
      // Arrange - gold holds no entry, so it is asked directly rather than counted in the party's bag.
      const gold = {
        ...fakeComponent({ item: null }),
        quantity: vi.fn(() => 100),
        isDatabaseEntry: vi.fn(() => false),
        getHandledQuantity: vi.fn(() => 550),
      };
      globalThis.$gameParty.numItems = vi.fn(() => 0);
      const recipe = buildRecipe([ gold ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(5);
    });

    it('reports nothing craftable when even one is out of reach', () =>
    {
      // Arrange
      const recipe = buildRecipe([ fakeComponent({ hasEnough: false }) ]);

      // Act
      const max = recipe.maxCraftableCount();

      // Assert
      expect(max).toBe(0);
    });
  });

  describe('craftMany', () =>
  {
    it('crafts once per repetition, earning proficiency each time', () =>
    {
      // Arrange - a batch is a shortcut for pressing craft repeatedly, so it must be indistinguishable from having
      // done exactly that. Ten crafts is ten improvements, not one.
      const ingredient = fakeComponent({ item: { id: 1 } });
      const output = fakeComponent({ item: { id: 2 } });
      const recipe = buildRecipe([ ingredient ], [], [ output ]);

      // Act
      recipe.craftMany(10);

      // Assert
      expect(ingredient.consume).toHaveBeenCalledTimes(10);
      expect(output.generate).toHaveBeenCalledTimes(10);
      expect(tracking.improveProficiency).toHaveBeenCalledTimes(10);
    });

    it('stamps every output separately rather than once for the batch', () =>
    {
      // Arrange - each result keeps its own dismantle provenance.
      const recipe = buildRecipe([ fakeComponent({ item: { id: 1 } }) ]);

      // Act
      recipe.craftMany(3);

      // Assert
      expect(globalThis.JaftingSalvageManager.applyCraftRecipeOutputs).toHaveBeenCalledTimes(3);
    });

    it('crafts nothing when asked for nothing', () =>
    {
      // Arrange
      const ingredient = fakeComponent({ item: { id: 1 } });
      const recipe = buildRecipe([ ingredient ]);

      // Act
      recipe.craftMany(0);

      // Assert
      expect(ingredient.consume).not.toHaveBeenCalled();
    });

    it('spends the chosen entry on every repetition', () =>
    {
      // Arrange
      const big = { id: 1 };
      const ingredient = fakeComponent({ item: { id: 2 } });
      const recipe = buildRecipe([ ingredient ]);

      // Act
      recipe.craftMany(2, new Map([ [ 0, big ] ]));

      // Assert
      expect(ingredient.consume).toHaveBeenNthCalledWith(1, big);
      expect(ingredient.consume).toHaveBeenNthCalledWith(2, big);
    });
  });
  //endregion batching

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
//endregion plugins/jafting/_component/create-crafting-recipe-direct.test.js
