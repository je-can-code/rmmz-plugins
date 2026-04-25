//region CraftingCreationSession
/**
 * Owns Creation scene workflow state and the craft attempt (delegates rules to {@link CraftingRecipe}).
 */
class CraftingCreationSession
{
  /**
   * High-level UX phases for the Creation menu.
   */
  static Phase = {
    BrowsingCategories: 'browsing_categories',
    BrowsingRecipes: 'browsing_recipes',
  };

  /**
   * @type {string}
   */
  #phase = CraftingCreationSession.Phase.BrowsingCategories;

  /**
   * Category key driving the recipe list after the user picks a category.
   * @type {string|null}
   */
  #categoryKey = null;

  /**
   * Outcome of the last {@link #tryCraftRecipe} for UI or tests.
   * @type {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }|null}
   */
  #lastCraftOutcome = null;

  /**
   * Resets session when the Creation scene is entered fresh.
   */
  reset()
  {
    this.#phase = CraftingCreationSession.Phase.BrowsingCategories;
    this.#categoryKey = null;
    this.#lastCraftOutcome = null;
  }

  /**
   * @returns {string}
   */
  getPhase()
  {
    return this.#phase;
  }

  /**
   * @returns {string|null}
   */
  getCategoryKey()
  {
    return this.#categoryKey;
  }

  /**
   * @returns {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }|null}
   */
  getLastCraftOutcome()
  {
    return this.#lastCraftOutcome;
  }

  /**
   * @returns {{ phase: string, categoryKey: string|null, lastCraftOutcome: object|null }}
   */
  snapshot()
  {
    return {
      phase: this.#phase,
      categoryKey: this.#categoryKey,
      lastCraftOutcome: this.#lastCraftOutcome,
    };
  }

  /**
   * User locked in a category; recipe list should filter to {@link categoryKey}.
   *
   * @param {string} categoryKey
   */
  enterRecipeBrowsing(categoryKey)
  {
    this.#categoryKey = categoryKey;
    this.#phase = CraftingCreationSession.Phase.BrowsingRecipes;
  }

  /**
   * User backed out of the recipe column to categories.
   */
  returnToCategoryBrowsing()
  {
    this.#phase = CraftingCreationSession.Phase.BrowsingCategories;
    this.#categoryKey = null;
  }

  /**
   * Attempts to craft the given recipe when the player confirms on the recipe list.
   *
   * @param {CraftingRecipe|null|undefined} recipe
   * @returns {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }}
   */
  tryCraftRecipe(recipe)
  {
    if (recipe === null || recipe === undefined)
    {
      this.#lastCraftOutcome = {
        crafted: false,
        playedSuccessSound: false,
        reason: 'no_recipe',
      };
      return this.#lastCraftOutcome;
    }

    if (recipe.canCraft() === false)
    {
      this.#lastCraftOutcome = {
        crafted: false,
        playedSuccessSound: false,
        reason: 'requirements_not_met',
      };
      return this.#lastCraftOutcome;
    }

    recipe.craft();
    this.#lastCraftOutcome = {
      crafted: true,
      playedSuccessSound: true,
      reason: null,
    };
    return this.#lastCraftOutcome;
  }
}

//endregion CraftingCreationSession