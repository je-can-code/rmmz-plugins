//region CraftingCreationSession
import CraftingRecipe from './CraftingRecipe.js';
/**
 * Owns Creation scene workflow state and the craft attempt (delegates rules to {@link CraftingRecipe}).
 */
class CraftingCreationSession
{
  /**
   * High-level UX phases for the Creation menu.
   */
  static Phase = {
    BrowsingRecipes: 'browsing_recipes',
    SelectingIngredients: 'selecting_ingredients',
  };

  /**
   * @type {string}
   */
  #phase = CraftingCreationSession.Phase.BrowsingRecipes;

  /**
   * Outcome of the last {@link #tryCraftRecipe} for UI or tests.
   * @type {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }|null}
   */
  #lastCraftOutcome = null;

  /**
   * The entry chosen for each categorical ingredient of the recipe being crafted, keyed by that
   * ingredient's index in the recipe.
   *
   * This is session state rather than recipe state on purpose. Recipes are parsed once at boot and
   * shared by every craft, so a choice written onto one would outlive the craft that made it and leak
   * into the next. It also never reaches a savefile - the session is not serialized, and persisting
   * database rows by value is precisely what the refinement lineage design exists to avoid.
   * @type {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>}
   */
  #selections = new Map();

  /**
   * Resets session when the Creation scene is entered fresh.
   */
  reset()
  {
    this.#phase = CraftingCreationSession.Phase.BrowsingRecipes;
    this.#lastCraftOutcome = null;
    this.#selections = new Map();
  }

  /**
   * Gets the entries chosen so far for the craft in progress.
   * @returns {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>}
   */
  getSelections()
  {
    return this.#selections;
  }

  /**
   * Begins choosing entries for a recipe's categorical ingredients, discarding any earlier picks.
   */
  beginIngredientSelection()
  {
    this.#selections = new Map();
    this.#phase = CraftingCreationSession.Phase.SelectingIngredients;
  }

  /**
   * Records the entry the player chose for one categorical ingredient.
   * @param {number} ingredientIndex The ingredient's index within the recipe.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry The entry chosen to fill it.
   */
  recordSelection(ingredientIndex, entry)
  {
    this.#selections.set(ingredientIndex, entry);
  }

  /**
   * Abandons the craft in progress and returns to browsing recipes.
   */
  cancelIngredientSelection()
  {
    this.#selections = new Map();
    this.#phase = CraftingCreationSession.Phase.BrowsingRecipes;
  }

  /**
   * @returns {string}
   */
  getPhase()
  {
    return this.#phase;
  }

  /**
   * @returns {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }|null}
   */
  getLastCraftOutcome()
  {
    return this.#lastCraftOutcome;
  }

  /**
   * @returns {{ phase: string, lastCraftOutcome: object|null }}
   */
  snapshot()
  {
    return {
      phase: this.#phase,
      lastCraftOutcome: this.#lastCraftOutcome,
    };
  }

  /**
   * Attempts to craft the given recipe when the player confirms on the recipe list.
   *
   * @param {CraftingRecipe|null|undefined} recipe The recipe driving this step.
   * @param {number} count How many times to craft it; a batch is a shortcut for crafting repeatedly.
   * @returns {{ crafted: boolean, playedSuccessSound: boolean, reason: string|null }}
   */
  tryCraftRecipe(recipe, count = 1)
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

    // clamped rather than trusted: the ceiling was read from stock at the moment the prompt opened, and the
    // same selections have to still cover every repetition by the time it closes.
    const repetitions = Math.min(count, recipe.maxCraftableCount(this.#selections));

    // spend whichever entries were chosen, once per repetition.
    recipe.craftMany(repetitions, this.#selections);

    // the picks belonged to that craft alone; the next one starts clean.
    this.#selections = new Map();
    this.#phase = CraftingCreationSession.Phase.BrowsingRecipes;

    this.#lastCraftOutcome = {
      crafted: true,
      playedSuccessSound: true,
      reason: null,
    };
    return this.#lastCraftOutcome;
  }
}

export default CraftingCreationSession;

//endregion CraftingCreationSession