//region Window_MenuCommand
/**
 * Extends {@link #addOriginalCommands}.<br/>
 * Also adds a command to open the JABS input remapping scene from the main menu.
 */
J.ABS.EXT.INPUT.Aliased.Window_MenuCommand.set('addOriginalCommands', Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // if we cannot add the command, then do not.
  if (this.canAddJabsRemapCommand() === false) return;

  this.addJabsRemapCommand();
};

/**
 * Adds the JABS Controls command to the main menu.
 */
Window_MenuCommand.prototype.addJabsRemapCommand = function()
{
  // build the JABS remap command.
  const command = new WindowCommandBuilder('Remap Controls')
    .setSymbol('jabsRemap')
    .setHelpText("Rebind the controls used during combat.")
    .setIconIndex(2569)
    .setEnabled(true)
    .build();

  // determine what the last command is.
  const lastCommand = this.commandList().at(-1);

  // check if the last command is the "End Game" command.
  if (lastCommand.symbol === "gameEnd")
  {
    // add it before the "End Game" command.
    this.commandList().splice(this.commandList().length - 2, 0, command);
  }
  // the last command is something else.
  else
  {
    // just add it to the end.
    this.addBuiltCommand(command);
  }
};

/**
 * Determines whether or not the JABS Controls command can be added to the main menu.
 * @returns {boolean} True if the command should be added, false otherwise.
 */
Window_MenuCommand.prototype.canAddJabsRemapCommand = function()
{
  // if JABS is not present, then do not render this command.
  if (!J.ABS) return false;

  // render the command!
  return true;
};
//endregion Window_MenuCommand