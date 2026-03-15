//region Window_MenuCommand
/**
 * Extends {@link #addOriginalCommands}.</br>
 * Adds the Aptitude menu command if enabled via plugin parameter.
 */
J.APT.Aliased.Window_MenuCommand.set('addOriginalCommands', Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.APT.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // add the APT menu command if enabled via plugin parameter.
  const switchId = J.APT.Metadata.menuSwitchId;

  // if no switch configured or the switch is ON, show the command.
  if (switchId === 0 || $gameSwitches.value(switchId))
  {
    // build the command.
    const builtCommand = new WindowCommandBuilder('Aptitude')
      .setSymbol('aptitude')
      .setIconIndex(186)
      .build();

    // add the command to the menu.
    this.addBuiltCommand(builtCommand);
  }
};
//endregion Window_MenuCommand