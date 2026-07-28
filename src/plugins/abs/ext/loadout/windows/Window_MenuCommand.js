//region Window_MenuCommand
/**
 * Extends {@link #addOriginalCommands}.<br/>
 * Adds the loadout command to the main menu's actor column.
 */
J.ABS.EXT.LOADOUT.Aliased.Window_MenuCommand.set(
  'addOriginalCommands',
  Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.ABS.EXT.LOADOUT.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // add the loadout command if it should be visible.
  if (this.canAddLoadoutCommand() === false) return;

  // build the command.
  const command = new WindowCommandBuilder(J.ABS.EXT.LOADOUT.Metadata.commandName).setSymbol('jabs-loadout')
    .setHelpText('Choose which skills and items each character has bound to each combat input.')
    .setEnabled(true)
    .setIconIndex(J.ABS.EXT.LOADOUT.Metadata.commandIconIndex)
    .setMenuSection(MenuSection.Actor)
    .build();

  // add the command to the menu.
  this.addBuiltCommand(command);
};

/**
 * Determines whether the loadout command should appear in the menu.
 * @returns {boolean}
 */
Window_MenuCommand.prototype.canAddLoadoutCommand = function()
{
  // an unconfigured switch means the command is always available.
  const switchId = J.ABS.EXT.LOADOUT.Metadata.menuSwitchId;
  if (switchId === 0) return true;

  // otherwise the switch governs it.
  return $gameSwitches.value(switchId);
};
//endregion Window_MenuCommand
