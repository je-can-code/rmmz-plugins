//region plugins/jafting/_component/create-crafting-support-models-direct.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingCategory from '../../../../src/plugins/jafting/ext/create/__models/CraftingCategory.js';
import CraftingConfiguration from '../../../../src/plugins/jafting/ext/create/__models/CraftingConfiguration.js';

/**
 * Direct-import coverage for the smaller pure-data JAFTING Creation models: CraftingCategory (reads
 * $gameParty as a bare global), CraftingConfiguration (plain builder, no globals), and the two save-data
 * tracking classes CategoryTracking/RecipeTracking, which call SerializableRegistry.register() at
 * import time- stubbed here the same way registerJaftingSalvageSerializableModels's own test does.
 */
describe('JAFTING Creation support models (direct src import)', () =>
{
  describe('CraftingCategory', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameParty = {
        lockCategory: vi.fn(),
        unlockCategory: vi.fn(),
        getUnlockedRecipes: vi.fn(() => []),
      };
    });

    afterEach(() =>
    {
      delete globalThis.$gameParty;
    });

    it('constructor assigns every field', () =>
    {
      const category = new CraftingCategory('Potions', 'potions', 5, 'brewable', true);

      expect(category.name).toBe('Potions');
      expect(category.key).toBe('potions');
      expect(category.iconIndex).toBe(5);
      expect(category.description).toBe('brewable');
      expect(category.unlockedByDefault).toBe(true);
    });

    it('lock/unlock delegate to $gameParty by key', () =>
    {
      const category = new CraftingCategory('Potions', 'potions', 5, 'brewable', true);

      category.lock();
      expect($gameParty.lockCategory).toHaveBeenCalledWith('potions');

      category.unlock();
      expect($gameParty.unlockCategory).toHaveBeenCalledWith('potions');
    });

    it('hasAnyRecipes is true only when an unlocked recipe references this category key', () =>
    {
      const category = new CraftingCategory('Potions', 'potions', 5, 'brewable', true);

      $gameParty.getUnlockedRecipes.mockReturnValue([]);
      expect(category.hasAnyRecipes()).toBe(false);

      $gameParty.getUnlockedRecipes.mockReturnValue([
        { categoryKeys: [ 'weapons' ] },
        { categoryKeys: [ 'potions', 'food' ] },
      ]);
      expect(category.hasAnyRecipes()).toBe(true);
    });
  });

  describe('CraftingConfiguration', () =>
  {
    it('constructor exposes recipes() and categories() as passed in', () =>
    {
      const recipes = [ {} ];
      const categories = [ {}, {} ];
      const config = new CraftingConfiguration(recipes, categories);

      expect(config.recipes()).toBe(recipes);
      expect(config.categories()).toBe(categories);
    });

    it('builder fluently constructs a configuration and resets its own state after build()', () =>
    {
      const recipes = [ { key: 'r1' } ];
      const categories = [ { key: 'c1' } ];

      const built = CraftingConfiguration.builder
        .recipes(recipes)
        .categories(categories)
        .build();

      expect(built.recipes()).toBe(recipes);
      expect(built.categories()).toBe(categories);

      const resetBuild = CraftingConfiguration.builder.build();
      expect(resetBuild.recipes()).toEqual([]);
      expect(resetBuild.categories()).toEqual([]);
    });
  });

  describe('CategoryTracking / RecipeTracking', () =>
  {
    let registerSpy;
    let CategoryTracking;
    let RecipeTracking;

    beforeAll(async () =>
    {
      // both classes call SerializableRegistry.register(this) at module top level (see
      // registerJaftingSalvageSerializableModels.js for the equivalent core-side pattern), so the stub
      // must exist on globalThis *before* the dynamic import evaluates the module- a static top-level
      // import would run before this beforeAll and throw ReferenceError.
      registerSpy = vi.fn();
      globalThis.SerializableRegistry = { register: registerSpy };

      ({ default: CategoryTracking } = await import(
        '../../../../src/plugins/jafting/ext/create/__models/CategoryTracking.js'
      ));
      ({ default: RecipeTracking } = await import(
        '../../../../src/plugins/jafting/ext/create/__models/RecipeTracking.js'
      ));
    });

    it('registers both classes with SerializableRegistry at import time', () =>
    {
      expect(registerSpy).toHaveBeenCalledWith(CategoryTracking);
      expect(registerSpy).toHaveBeenCalledWith(RecipeTracking);
    });

    it('CategoryTracking tracks unlocked state and crafted count', () =>
    {
      const tracking = new CategoryTracking('potions', false);

      expect(tracking.isUnlocked()).toBe(false);
      expect(tracking.craftedCount()).toBe(0);

      tracking.unlock();
      expect(tracking.isUnlocked()).toBe(true);

      tracking.lock();
      expect(tracking.isUnlocked()).toBe(false);
    });

    it('RecipeTracking seeds proficiency from the constructor and tracks unlock/craft state', () =>
    {
      const tracking = new RecipeTracking('potion_recipe', false, 2);

      expect(tracking.craftingProficiency()).toBe(2);
      expect(tracking.hasBeenCrafted()).toBe(true);
      expect(tracking.isUnlocked()).toBe(false);

      tracking.unlock();
      expect(tracking.isUnlocked()).toBe(true);

      tracking.improveProficiency();
      expect(tracking.craftingProficiency()).toBe(3);

      tracking.improveProficiency(5);
      expect(tracking.craftingProficiency()).toBe(8);
    });

    it('RecipeTracking hasBeenCrafted is false at zero proficiency', () =>
    {
      const tracking = new RecipeTracking('never_crafted', true);

      expect(tracking.hasBeenCrafted()).toBe(false);
    });
  });
});
//endregion plugins/jafting/_component/create-crafting-support-models-direct.test.js
