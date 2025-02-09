//region Window_QuestopediaCategories
class Window_QuestopediaCategories
  extends Window_HorzCommand
{
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of all known quests in this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all categories to the list.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // grab all possible categories.
    const questCategories = QuestManager.categories(false);

    // return the compiled list of commands.
    return questCategories.map(this.buildCommand, this);
  }

  /**
   * Builds a {@link BuiltWindowCommand} based on the category data.
   * @param {OmniCategory} omniCategory The category data.
   * @returns {BuiltWindowCommand} The built command based on this category.
   */
  buildCommand(omniCategory)
  {
    // build a command based on the category.
    // NOTE: the name is left empty because this is an icon-based list.
    return new WindowCommandBuilder(omniCategory.name)
      .setSymbol(omniCategory.key)
      .setExtensionData(omniCategory)
      .setIconIndex(omniCategory.iconIndex)
      .build();
  }

  /**
   * Overrides {@link maxCols}.<br/>
   * Sets the column count to be the number of categories there are.
   * @returns {number}
   */
  maxCols()
  {
    return QuestManager.categories(false).length;
  };
}

//endregion Window_QuestopediaCategories