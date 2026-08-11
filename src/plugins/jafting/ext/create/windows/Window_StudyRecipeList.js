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
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.
   *
   * Seeded here rather than as a class field or in the constructor, because `Window_Command.initialize`
   * refreshes- and therefore calls `makeCommandList`- before either of those has run.
   */
  initMembers()
  {
    /**
     * The category whose shelf is currently being shown.
     * @type {string}
     */
    this.currentCategory = String.empty;
  }

  /**
   * The category whose shelf is currently being shown.
   * @returns {string}
   */
  getCurrentCategory()
  {
    return this.currentCategory;
  }

  /**
   * Switches the shelf to a different category.
   * @param {string} newCategory The category key to show.
   */
  setCurrentCategory(newCategory)
  {
    if (this.currentCategory === newCategory) return;

    this.currentCategory = newCategory;

    this.refresh();
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.
   */
  makeCommandList()
  {
    // empty the current list.
    this.clearCommandList();

    // grab all the listings available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a command for every recipe on this category's shelf.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const currentCategory = this.getCurrentCategory();
    const recipes = $gameParty.getPurchasableRecipesByCategory(currentCategory);

    const unknown = recipes.filter(recipe => this.isAlreadyKnown(recipe) === false);
    const known = recipes.filter(recipe => this.isAlreadyKnown(recipe));

    // what can still be bought floats to the top; what has been bought settles beneath it.
    const sorted = unknown.concat(known);

    return sorted.map(this.buildCommand, this);
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
    const affordable = recipe.canAffordStudy();

    // a row is selectable only when there is something to buy and the means to buy it.
    const selectable = (alreadyKnown === false) && affordable;

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