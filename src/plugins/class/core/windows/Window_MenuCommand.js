//region Window_MenuCommand
import ClassManager from '../managers/ClassManager.js';

/**
 * Extends {@link #addOriginalCommands}.<br/>
 * Adds the class command to the main menu's actor column.
 */
J.CLASS.Aliased.Window_MenuCommand.set('addOriginalCommands', Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.CLASS.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // the command appears only once the game has made it visible.
  if (ClassManager.isMenuCommandVisible() === false) return;

  // build the command.
  const command = this.buildClassesCommand();

  // add the command to the menu.
  this.addBuiltCommand(command);
};

/**
 * Builds the class command, which belongs to the actor column since every class is one actor's.
 * @returns {BuiltWindowCommand}
 */
Window_MenuCommand.prototype.buildClassesCommand = function()
{
  return new WindowCommandBuilder(J.CLASS.Metadata.commandName)
    .setSymbol('classes')
    .setHelpText('Review what each of this character\'s classes does and teaches.')
    .setMenuSection(MenuSection.Actor)
    .setIconIndex(J.CLASS.Metadata.commandIconIndex)
    .build();
};
//endregion Window_MenuCommand