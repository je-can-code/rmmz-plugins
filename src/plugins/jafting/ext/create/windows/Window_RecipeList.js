//region Window_RecipeList
/**
 * A window containing the list of all crafting recipes.
 */
class Window_RecipeList
  extends Window_Command
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
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * This cannot be a class field declaration: JavaScript applies those only after `super()` returns,
   * by which point the command list has already been built from it and found it undefined.
   */
  initMembers()
  {
    /**
     * The currently selected category on the category list window.
     * @type {string}
     */
    this.currentCategory = String.empty;
  }

  /**
   * Sets the current category and updates the list of available recipes.
   * @param {string} newCategory The new jafting category to consider.
   */
  setCurrentCategory(newCategory)
  {
    // nothing to redraw when the value has not changed.
    if (this.currentCategory === newCategory) return;

    // set the new category.
    this.currentCategory = newCategory;

    // refresh the command list based on this new category.
    this.refresh();
  }

  /**
   * Gets the current category to filter recipes by.
   * @return {string}
   */
  getCurrentCategory()
  {
    return this.currentCategory;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Creates the command list of unlocked crafting recipes.
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
   * Builds all commands for this command window.
   * Adds all recipes to the list that are unlocked.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all unlocked entries in the list.
    const recipes = $gameParty.getUnlockedRecipes();

    // determine the current category selected.
    const currentCategory = this.getCurrentCategory();

    // only include the recipes that belong to the current category.
    const categoryRecipes = recipes
      .filter(recipe => recipe.categoryKeys.includes(currentCategory));

    // compile the list of commands.
    const commands = categoryRecipes.map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
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
}

export default Window_RecipeList;

//endregion Window_RecipeList