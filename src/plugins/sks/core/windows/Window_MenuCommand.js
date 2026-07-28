//region Window_MenuCommand
/**
 * Extends {@link #addOriginalCommands}.</br>
 * Adds the Skill Equip menu command if enabled via plugin parameter.
 */
J.SKS.Aliased.Window_MenuCommand.set('addOriginalCommands', Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.SKS.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // add the SKS menu command if enabled via plugin parameter.
  const switchId = J.SKS.Metadata.menuSwitchId;

  // if no switch configured or the switch is ON, show the command.
  if (switchId === 0 || $gameSwitches.value(switchId))
  {
    // build the command.
    const builtCommand = new WindowCommandBuilder('Skill Equip')
      .setSymbol('skill-equip')
      .setHelpText("Choose which of this character's known skills are active.")
      .setMenuSection(MenuSection.Actor)
      .setIconIndex(78)
      .build();

    // add the command to the menu.
    this.addBuiltCommand(builtCommand);
  }
};
//endregion Window_MenuCommand
