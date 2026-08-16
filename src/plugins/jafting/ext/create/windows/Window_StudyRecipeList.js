//region Window_StudyRecipeList
/**
 * The shelf: every recipe of the current category that somebody is willing to teach.
 *
 * Recipes already known stay on the shelf rather than vanishing from it, greyed and sorted to the
 * bottom. A shop that hides what you have already bought cannot tell you how much of a category there
 * was, and "nine of fourteen" is the pull that gets somebody to come back.
 *
 * Names and icons are read unmasked. Everything here is by definition uncrafted, so the masked
 * accessors would price a row of question marks- which is a different offer from the one being made.
 */
class Window_StudyRecipeList
  extends Window_FilterableList
{
  /**
   * Overrides {@link Window_FilterableList.initialFilterKey}.<br/>
   * Starts on no shelf at all rather than on the everything-sentinel.
   *
   * This shelf's source is a keyed lookup rather than a list it narrows, so the everything-sentinel would
   * become a request for a category the party has never heard of. An empty key asks for an empty shelf,
   * which is the honest thing to show before the scene has pointed this anywhere.
   * @returns {string}
   */
  initialFilterKey()
  {
    return String.empty;
  }

  /**
   * The category whose shelf is currently being shown.
   * @returns {string}
   */
  getCurrentCategory()
  {
    return this.filterKey();
  }

  /**
   * Switches the shelf to a different category.
   * @param {string} newCategory The category key to show.
   */
  setCurrentCategory(newCategory)
  {
    this.setFilterKey(newCategory);
  }

  /**
   * Implements {@link Window_FilterableList.sourceItems}.<br/>
   * The recipes this vendor is offering on the current shelf.
   *
   * The category is part of the question asked of the party rather than a test applied to the answer, so
   * this list leaves {@link Window_FilterableList.matchesFilter} alone- everything that comes back already
   * belongs to the active shelf.
   * @returns {CraftingRecipe[]}
   */
  sourceItems()
  {
    return $gameParty.getPurchasableRecipesByCategory(this.filterKey());
  }

  /**
   * Implements {@link Window_FilterableList.compareItems}.<br/>
   * Floats what can still be bought above what has already been learned.
   *
   * Recipes the party knows stay on the shelf greyed out rather than vanishing, so that buying one does not
   * make it disappear from the place you just found it.
   * @param {CraftingRecipe} left The first recipe driving this step.
   * @param {CraftingRecipe} right The second recipe driving this step.
   * @returns {number}
   */
  compareItems(left, right)
  {
    return Number(this.isAlreadyKnown(left)) - Number(this.isAlreadyKnown(right));
  }

  /**
   * Implements {@link Window_FilterableList.isActionable}.<br/>
   * A row is actionable when there is something left to buy and the means to buy it.
   * @param {CraftingRecipe} recipe The recipe driving this step.
   * @returns {boolean}
   */
  isActionable(recipe)
  {
    return this.isAlreadyKnown(recipe) === false && recipe.canAffordStudy();
  }

  /**
   * Whether the party has already learned a given recipe.
   * @param {CraftingRecipe} recipe The recipe being examined.
   * @returns {boolean}
   */
  isAlreadyKnown(recipe)
  {
    return $gameParty.getRecipeTrackingByKey(recipe.key)
      .isUnlocked();
  }

  /**
   * Builds a single row of the shelf.
   * @param {CraftingRecipe} recipe The recipe the row represents.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(recipe)
  {
    const alreadyKnown = this.isAlreadyKnown(recipe);

    // a row is selectable only when there is something to buy and the means to buy it.
    const selectable = this.isActionable(recipe);

    const subtexts = [];

    if (alreadyKnown)
    {
      subtexts.push('Already learned.');
    }

    const name = recipe.getUnmaskedRecipeName();
    const iconIndex = recipe.getUnmaskedRecipeIcon();

    return new WindowCommandBuilder(name)
      .setSymbol(recipe.key)
      .setExtensionData(recipe)
      .setIconIndex(iconIndex)
      .setHelpText(name)
      .setEnabled(selectable)
      .setTextLines(subtexts)
      .build();
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * One line per row, since a shelf is a list of names rather than a set of cards.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight();
  }

  /**
   * Overwrites {@link #drawBackgroundRect}.<br/>
   * The per-row backdrop fights the greying that marks a row unavailable, so it is not drawn.
   * @param {Rectangle} _ The rectangle that would have been drawn into.
   */
  drawBackgroundRect(_)
  {
  }
}

export default Window_StudyRecipeList;
//endregion Window_StudyRecipeList