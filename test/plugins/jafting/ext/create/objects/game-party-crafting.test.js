//region plugins/jafting/ext/create/objects/game-party-crafting.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The party owns which recipes and categories the player has actually discovered, kept as tracking
 * objects separate from the recipe definitions themselves so progress survives the config being
 * edited between sessions. Two things follow from that and both are covered here: trackings are
 * reconciled against the config on load rather than rebuilt, so existing progress is never lost;
 * and the crafting list uses named divider entries for layout, which must never become unlockable
 * or the player would "discover" a horizontal rule.
 */
describe('J-JAFTING-Creation Game_Party (direct src import)', () =>
{
  let RecipeTracking;
  let CategoryTracking;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      JAFTING: {
        EXT: {
          CREATE: {
            Aliased: { Game_Party: new Map() },
            Metadata: { recipes: [], categories: [], recipesMap: new Map(), categoriesMap: new Map() },
          },
        },
      },
    };

    // the tracking models register themselves for save serialization at import time.
    globalThis.SerializableRegistry = { register: () => {} };

    function StubGameParty()
    {
    }

    StubGameParty.prototype.initialize = function()
    {
    };
    globalThis.Game_Party = StubGameParty;

    ({ default: RecipeTracking } = await import('../../../../../../src/plugins/jafting/ext/create/__models/RecipeTracking.js'));
    ({ default: CategoryTracking } = await import('../../../../../../src/plugins/jafting/ext/create/__models/CategoryTracking.js'));
    globalThis.RecipeTracking = RecipeTracking;
    globalThis.CategoryTracking = CategoryTracking;

    await import('../../../../../../src/plugins/jafting/ext/create/objects/Game_Party.js');
  });

  afterEach(() =>
  {
    globalThis.J.JAFTING.EXT.CREATE.Metadata.recipes = [];
    globalThis.J.JAFTING.EXT.CREATE.Metadata.categories = [];
    globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap = new Map();
    globalThis.J.JAFTING.EXT.CREATE.Metadata.categoriesMap = new Map();
  });

  let party;

  beforeEach(() =>
  {
    party = new globalThis.Game_Party();
    party.initJaftingCreationMembers();
  });

  /**
   * Registers recipe definitions into plugin metadata.
   * @param {object[]} recipes The recipe definitions.
   */
  function useRecipes(recipes)
  {
    globalThis.J.JAFTING.EXT.CREATE.Metadata.recipes = recipes;
    globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap = new Map(recipes.map(r => [ r.key, r ]));
  }

  /**
   * Registers category definitions into plugin metadata.
   * @param {object[]} categories The category definitions.
   */
  function useCategories(categories)
  {
    globalThis.J.JAFTING.EXT.CREATE.Metadata.categories = categories;
    globalThis.J.JAFTING.EXT.CREATE.Metadata.categoriesMap = new Map(categories.map(c => [ c.key, c ]));
  }

  //region divider entries
  describe('canGainEntry', () =>
  {
    it('permits an ordinary named entry', () =>
    {
      // Arrange & Act & Assert
      expect(party.canGainEntry('iron_sword')).toBe(true);
    });

    it.each([
      [ 'a null name', null ],
      [ 'a blank name', '   ' ],
      [ 'an underscore-prefixed name', '_hidden' ],
      [ 'a double-equals divider', '== Blades ==' ],
      [ 'the explicit empty marker', '-- empty --' ],
    ])('refuses %s, which exists purely for list layout', (_label, name) =>
    {
      // Arrange: dividers and placeholders are rendered as separators in the crafting list, so
      // unlocking one would show the player a horizontal rule as a discovered recipe.
      // Act & Assert
      expect(party.canGainEntry(name)).toBe(false);
    });
  });
  //endregion divider entries

  //region reconciling with config
  describe('updateRecipesFromConfig', () =>
  {
    it('adds a tracking for a recipe the save has never seen', () =>
    {
      // Arrange: content added in a later patch has to appear for saves already in progress.
      useRecipes([ { key: 'new_recipe', unlockedByDefault: false } ]);

      // Act
      party.updateRecipesFromConfig();

      // Assert
      expect(party.getAllRecipeTrackings().length).toBe(1);
    });

    it('leaves an existing tracking untouched rather than replacing it', () =>
    {
      // Arrange: rebuilding would discard whatever the player had already unlocked.
      useRecipes([ { key: 'known', unlockedByDefault: false } ]);
      party.updateRecipesFromConfig();
      party.unlockRecipe('known');

      // Act
      party.updateRecipesFromConfig();

      // Assert
      expect(party.getRecipeTrackingByKey('known')
        .isUnlocked()).toBe(true);
    });

    it('does not add a second tracking for a recipe it already has', () =>
    {
      // Arrange- reconciling runs on every load, so a find-or-create that always created would grow the
      // list without bound. Asserting the unlock state survives is not enough to catch that: lookups go
      // through `find`, which happily returns the first of two and reads as correct.
      useRecipes([ { key: 'known', unlockedByDefault: false } ]);
      party.updateRecipesFromConfig();

      // Act
      party.updateRecipesFromConfig();
      party.updateRecipesFromConfig();

      // Assert
      expect(party.getAllRecipeTrackings().length)
        .toBe(1);
    });

    it('skips divider entries when reconciling', () =>
    {
      // Arrange
      useRecipes([ { key: '== Blades ==', unlockedByDefault: false } ]);

      // Act
      party.updateRecipesFromConfig();

      // Assert
      expect(party.getAllRecipeTrackings()).toEqual([]);
    });
  });

  describe('updateCategoriesFromConfig', () =>
  {
    it('adds a tracking for a category the save has never seen', () =>
    {
      // Arrange
      useCategories([ { key: 'blades', name: 'Blades', unlockedByDefault: false } ]);

      // Act
      party.updateCategoriesFromConfig();

      // Assert
      expect(party.getAllCategoryTrackings().length).toBe(1);
    });

    it('leaves an existing category tracking untouched', () =>
    {
      // Arrange
      useCategories([ { key: 'blades', name: 'Blades', unlockedByDefault: false } ]);
      party.updateCategoriesFromConfig();
      party.unlockCategory('blades');

      // Act
      party.updateCategoriesFromConfig();

      // Assert
      expect(party.getCategoryTrackingByKey('blades')
        .isUnlocked()).toBe(true);
    });

    it('does not add a second tracking for a category it already has', () =>
    {
      // Arrange- same find-or-create shape as the recipe side, and the same reason the unlock-state
      // assertion above cannot catch a duplicate.
      useCategories([ { key: 'blades', name: 'Blades', unlockedByDefault: false } ]);
      party.updateCategoriesFromConfig();

      // Act
      party.updateCategoriesFromConfig();
      party.updateCategoriesFromConfig();

      // Assert
      expect(party.getAllCategoryTrackings().length)
        .toBe(1);
    });

    it('skips a category whose name is a divider even when its key is not', () =>
    {
      // Arrange: categories are checked on both key and name, since either can carry the
      // divider marker depending on how the config was authored.
      useCategories([ { key: 'spacer', name: '-- empty --', unlockedByDefault: false } ]);

      // Act
      party.updateCategoriesFromConfig();

      // Assert
      expect(party.getAllCategoryTrackings()).toEqual([]);
    });
  });
  //endregion reconciling with config

  //region unlock state
  describe('recipe unlock state', () =>
  {
    beforeEach(() =>
    {
      useRecipes([
        { key: 'alpha', unlockedByDefault: false },
        { key: 'beta', unlockedByDefault: true },
      ]);
      party.updateRecipesFromConfig();
    });

    it('lists only the unlocked recipes', () =>
    {
      // Arrange & Act
      const unlocked = party.getUnlockedRecipes();

      // Assert
      expect(unlocked.map(recipe => recipe.key)).toEqual([ 'beta' ]);
    });

    it('includes a recipe once it has been unlocked', () =>
    {
      // Arrange
      party.unlockRecipe('alpha');

      // Act
      const unlocked = party.getUnlockedRecipes();

      // Assert
      expect(unlocked.map(recipe => recipe.key).sort()).toEqual([ 'alpha', 'beta' ]);
    });

    it('drops a recipe again once it is locked', () =>
    {
      // Arrange
      party.lockRecipe('beta');

      // Act
      const unlocked = party.getUnlockedRecipes();

      // Assert
      expect(unlocked).toEqual([]);
    });

    it('unlocks every non-divider recipe at once', () =>
    {
      // Arrange & Act
      party.unlockAllRecipes();

      // Assert
      expect(party.getUnlockedRecipes().length).toBe(2);
    });

    it('locks every recipe at once', () =>
    {
      // Arrange
      party.unlockAllRecipes();

      // Act
      party.lockAllRecipes();

      // Assert
      expect(party.getUnlockedRecipes()).toEqual([]);
    });

    it('skips a tracking whose recipe has since left the config', () =>
    {
      // Arrange: a save can outlive a recipe that was removed in a later patch, and the list
      // must not try to render a definition that no longer exists.
      party.unlockAllRecipes();
      useRecipes([ { key: 'alpha', unlockedByDefault: false } ]);

      // Act
      const unlocked = party.getUnlockedRecipes();

      // Assert
      expect(unlocked.map(recipe => recipe.key)).toEqual([ 'alpha' ]);
    });

    it('reports an unlock attempt against an unknown recipe', () =>
    {
      // Arrange: a plugin command naming a key that does not exist is an authoring mistake.
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.unlockRecipe('nope');

      // Assert
      expect(error).toHaveBeenCalled();

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      error.mockRestore();
    });

    it('reports a lock attempt against an unknown recipe', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.lockRecipe('nope');

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });
  });

  describe('category unlock state', () =>
  {
    beforeEach(() =>
    {
      useCategories([
        { key: 'blades', name: 'Blades', unlockedByDefault: false },
        { key: 'armors', name: 'Armors', unlockedByDefault: true },
      ]);
      party.updateCategoriesFromConfig();
    });

    it('lists only the unlocked categories', () =>
    {
      // Arrange & Act
      const unlocked = party.getUnlockedCategories();

      // Assert
      expect(unlocked.map(category => category.key)).toEqual([ 'armors' ]);
    });

    it('includes a category once it has been unlocked', () =>
    {
      // Arrange
      party.unlockCategory('blades');

      // Act
      const unlocked = party.getUnlockedCategories();

      // Assert
      expect(unlocked.map(category => category.key).sort()).toEqual([ 'armors', 'blades' ]);
    });

    it('drops a category again once it is locked', () =>
    {
      // Arrange
      party.lockCategory('armors');

      // Act
      const unlocked = party.getUnlockedCategories();

      // Assert
      expect(unlocked).toEqual([]);
    });

    it('locks every category at once', () =>
    {
      // Arrange & Act
      party.lockAllCategories();

      // Assert
      expect(party.getUnlockedCategories()).toEqual([]);
    });

    it('skips a tracking whose category has since left the config', () =>
    {
      // Arrange
      party.unlockCategory('blades');
      useCategories([ { key: 'armors', name: 'Armors', unlockedByDefault: true } ]);

      // Act
      const unlocked = party.getUnlockedCategories();

      // Assert
      expect(unlocked.map(category => category.key)).toEqual([ 'armors' ]);
    });

    it('reports an unlock attempt against an unknown category', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.unlockCategory('nope');

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });

    it('reports a lock attempt against an unknown category', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.lockCategory('nope');

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });
  });
  //endregion unlock state

  //region lookups
  describe('lookups', () =>
  {
    it('finds a recipe definition by key', () =>
    {
      // Arrange
      useRecipes([ { key: 'alpha', unlockedByDefault: false } ]);

      // Act
      const recipe = party.getRecipeByKey('alpha');

      // Assert
      expect(recipe.key).toBe('alpha');
    });

    it('finds a category definition by key', () =>
    {
      // Arrange
      useCategories([ { key: 'blades', name: 'Blades', unlockedByDefault: false } ]);

      // Act
      const category = party.getCategoryByKey('blades');

      // Assert
      expect(category.key).toBe('blades');
    });

    it('finds nothing for a key belonging to neither', () =>
    {
      // Arrange & Act & Assert
      expect(party.getCategoryByKey('nope')).toBeUndefined();
    });
  });
  //endregion lookups

  //region crafted counts
  describe('getCraftedRecipeCountByCategoryKey', () =>
  {
    it('counts nothing for a category with no unlocked recipes', () =>
    {
      // Arrange: the category list shows a crafted tally per category, and an empty one has to
      // read as zero rather than walking an empty key set.
      useCategories([ { key: 'blades', name: 'Blades', unlockedByDefault: true } ]);
      party.updateCategoriesFromConfig();

      // Act
      const count = party.getCraftedRecipeCountByCategoryKey('blades');

      // Assert
      expect(count).toBe(0);
    });
  });
  //endregion crafted counts

  //region purchasable recipes
  describe('getPurchasableRecipesByCategory', () =>
  {
    /**
     * Builds a recipe definition of the shape the shelf filters over.
     * @param {string} key The recipe's key.
     * @param {string[]} cost The cost components, where an empty list means not for sale.
     * @param {string} categoryKey The category it belongs to.
     * @returns {object}
     */
    function purchasableRecipe(key, cost, categoryKey)
    {
      return {
        key,
        cost,
        categoryKeys: [ categoryKey ],
        isPurchasable()
        {
          return this.cost.length > 0;
        },
      };
    }

    it('offers a costed recipe of the category asked for', () =>
    {
      // Arrange
      useRecipes([ purchasableRecipe('sellable', [ {} ], 'blades') ]);

      // Act
      const purchasable = party.getPurchasableRecipesByCategory('blades');

      // Assert
      expect(purchasable.length).toBe(1);
      expect(purchasable[0].key).toBe('sellable');
    });

    it('withholds a recipe carrying no cost, which is not for sale rather than free', () =>
    {
      // Arrange- the near-miss: identical but for the cost, and nothing shipped before study has one.
      useRecipes([
        purchasableRecipe('sellable', [ {} ], 'blades'),
        purchasableRecipe('free_ride', [], 'blades'),
      ]);

      // Act
      const purchasable = party.getPurchasableRecipesByCategory('blades');

      // Assert
      expect(purchasable.map(recipe => recipe.key)).toEqual([ 'sellable' ]);
    });

    it('withholds the divider rows that pad the configuration', () =>
    {
      // Arrange- dividers are never unlocked, so a shelf built from what is locked is built from these.
      useRecipes([
        purchasableRecipe('sellable', [ {} ], 'blades'),
        purchasableRecipe('_DIVIDER', [ {} ], 'blades'),
        purchasableRecipe('==SECTION', [ {} ], 'blades'),
      ]);

      // Act
      const purchasable = party.getPurchasableRecipesByCategory('blades');

      // Assert
      expect(purchasable.map(recipe => recipe.key)).toEqual([ 'sellable' ]);
    });

    it('withholds a costed recipe belonging to some other category', () =>
    {
      // Arrange
      useRecipes([
        purchasableRecipe('sellable', [ {} ], 'blades'),
        purchasableRecipe('elsewhere', [ {} ], 'spears'),
      ]);

      // Act
      const purchasable = party.getPurchasableRecipesByCategory('blades');

      // Assert
      expect(purchasable.map(recipe => recipe.key)).toEqual([ 'sellable' ]);
    });

    it('keeps offering a recipe the party already knows', () =>
    {
      // Arrange- a shop that hides what you bought cannot show you how much of it there was; the
      // window greys these and sorts them last rather than the accessor dropping them.
      useRecipes([ purchasableRecipe('sellable', [ {} ], 'blades') ]);
      party.updateRecipesFromConfig();
      party.unlockRecipe('sellable');

      // Act
      const purchasable = party.getPurchasableRecipesByCategory('blades');

      // Assert
      expect(purchasable.length).toBe(1);
    });
  });
  //endregion purchasable recipes
});
//endregion plugins/jafting/ext/create/objects/game-party-crafting.test.js