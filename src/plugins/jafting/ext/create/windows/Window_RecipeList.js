//region Window_RecipeList
/**
 * A window containing the list of all crafting recipes.
 */
class Window_RecipeList
  extends Window_FilterableList
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);
  }

  /**
   * Overrides {@link Window_FilterableList.initialFilterKey}.<br/>
   * Starts on no category rather than on the everything-sentinel.
   *
   * A recipe declares the categories it belongs to, and none of them is the everything-sentinel, so
   * starting there would quietly show an empty list. An empty key says the same thing honestly, and the
   * scene points this at a real category before the player ever sees it.
   * @returns {string}
   */
  initialFilterKey()
  {
    return String.empty;
  }

  /**
   * Sets the current category and updates the list of available recipes.
   * @param {string} newCategory The new jafting category to consider.
   */
  setCurrentCategory(newCategory)
  {
    this.setFilterKey(newCategory);
  }

  /**
   * Gets the current category to filter recipes by.
   * @return {string}
   */
  getCurrentCategory()
  {
    return this.filterKey();
  }

  /**
   * Implements {@link Window_FilterableList.sourceItems}.<br/>
   * Every recipe the party has learned that this station actually deals in.
   *
   * Scoped to the unlocked categories, which is how a station says what it makes: the calling event
   * unlocks its own and locks them again afterwards. Without this the mortar and pestle would happily
   * offer to fry a pile of wings.
   * @returns {CraftingRecipe[]}
   */
  sourceItems()
  {
    const stockedKeys = $gameParty.getUnlockedCategories()
      .map(category => category.key);
    const stocked = new Set(stockedKeys);

    return $gameParty.getUnlockedRecipes()
      .filter(recipe => recipe.categoryKeys.some(key => stocked.has(key)));
  }

  /**
   * Implements {@link Window_FilterableList.matchesFilter}.<br/>
   * Whether a recipe is filed under the category being browsed.
   * @param {CraftingRecipe} recipe The recipe driving this step.
   * @param {string} filterKey The category key being browsed.
   * @returns {boolean}
   */
  matchesFilter(recipe, filterKey)
  {
    // the everything-tab narrows nothing further; the source is already this station's stock.
    if (filterKey === FilterCycle.ALL) return true;

    return recipe.categoryKeys.includes(filterKey);
  }

  /**
   * Implements {@link Window_FilterableList.isActionable}.<br/>
   * A recipe is actionable when the party holds everything it asks for.
   * @param {CraftingRecipe} recipe The recipe driving this step.
   * @returns {boolean}
   */
  isActionable(recipe)
  {
    return recipe.canCraft();
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the recipe data.
   * @param {CraftingRecipe} recipe The recipe data.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(recipe)
  {
    // build a command based on the category.
    return new WindowCommandBuilder(recipe.getRecipeName())
      .setSymbol(recipe.key)
      .setExtensionData(recipe)
      .setHelpText(recipe.getRecipeDescription())
      .setIconIndex(recipe.getRecipeIcon())
      .setEnabled(recipe.canCraft())
      .build();
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Makes the command rows smaller so there can be additional recipeeeees.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight();
  }

  /**
   * Overwrites {@link #drawBackgroundRect}.<br/>
   * Prevents the rendering of the backdrop of each line in the window.
   * @param {Rectangle} _ The rectangle to draw the background for.
   * @override
   */
  drawBackgroundRect(_)
  {
  }

  /**
   * Overrides {@link Window_FilterableList.emptyListText}.<br/>
   * Names the reason this lane is bare, which is always the same reason.
   *
   * A category the player has learned nothing in is the ordinary early state of every lane but one, so
   * this is read far more often than it sounds like it would be.
   * @returns {string}
   */
  emptyListText()
  {
    return 'No recipes known here.';
  }
}

export default Window_RecipeList;

//endregion Window_RecipeList