//region Window_AbsMenu
/**
 * The main JABS menu window called from the map.
 * This window contains mostly combat-setup options relating to JABS.
 */
class Window_AbsMenu
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The shape of the window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Generates the command list for the JABS menu.
   */
  makeCommandList()
  {
    // build all the commands.
    const commands = this.buildCommands();

    // add the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands that exist in the JABS menu.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // build the main menu command.
    const mainMenuCommand = new WindowCommandBuilder(J.ABS.Metadata.MainMenuText)
      .setSymbol('main-menu')
      .setEnabled($gameSystem.isMenuEnabled())
      .setIconIndex(189)
      .setHelpText(this.mainMenuHelpText())
      .build();

    // return the built commands. extensions append their own to this.
    return [ mainMenuCommand ];
  }

  /**
   * The help text for the JABS main menu.
   * @returns {string}
   */
  mainMenuHelpText()
  {
    const description = [
      "The unabbreviated main menu with access to player status, descriptions, etc.",
      "This is colloquially referred to as the 'The Main Menu™' by protagonists all across the universe."
    ];

    return description.join("\n");
  }

  /**
   * Closes the Abs menu.
   */
  closeMenu()
  {
    if (!this.isClosed())
    {
      this.close();
    }

    $jabsEngine.absPause = false;
    $jabsEngine.requestAbsMenu = false;
  }
}

export default Window_AbsMenu;
//endregion Window_AbsMenu