//region Window_CategoryList
/**
 * A window containing the list of all crafting categories.
 */
class Window_CategoryList
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of unlocked crafting categories.
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
   * Adds all categories to the list that are unlocked.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all unlocked entries in the list.
    const categories = $gameParty.getUnlockedCategories();

    // compile the list of commands.
    const commands = categories.map(this.buildCommand, this);

    // return the compiled list of commands.
    return commands;
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the category data.
   * @param {CraftingCategory} category The category data.
   * @returns {BuiltWindowCommand} The built command based on this enemy.
   */
  buildCommand(category)
  {
    // build a command based on the category.
    return new WindowCommandBuilder(category.name)
      .setSymbol(category.key)
      .setExtensionData(category)
      .setIconIndex(category.iconIndex)
      .setHelpText(category.description)
      .setEnabled(category.hasAnyRecipes())
      .build();
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}

//endregion Window_CategoryList