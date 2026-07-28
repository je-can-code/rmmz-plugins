//region Window_MenuCommand
/**
 * Extends {@link #makeCommandList}.<br/>
 * Adds the Passives viewer command to the main menu command list.
 */
J.PASSIVE.Aliased.Window_MenuCommand.set('makeCommandList', Window_MenuCommand.prototype.makeCommandList);
Window_MenuCommand.prototype.makeCommandList = function()
{
  // perform original logic.
  J.PASSIVE.Aliased.Window_MenuCommand.get('makeCommandList')
    .call(this);

  // if the guard switch prevents the command, skip it.
  if (!this.canAddPassivesCommand()) return;

  // build and insert the Passives command.
  const command = new WindowCommandBuilder(J.PASSIVE.Metadata.commandName)
    .setSymbol('passive-menu')
    .setHelpText("Review the always-active effects this character benefits from.")
    .setMenuSection(MenuSection.Actor)
    .setEnabled(true)
    .setIconIndex(J.PASSIVE.Metadata.commandIconIndex)
    .build();

  // insert before "End Game" if it is the last entry; otherwise append.
  const lastCommand = this._list.at(-1);
  if (lastCommand.symbol === 'gameEnd')
  {
    this._list.splice(this._list.length - 2, 0, command);
  }
  else
  {
    this.addBuiltCommand(command);
  }
};

/**
 * Determines whether the Passives command should be added to the menu.
 * @returns {boolean}
 */
Window_MenuCommand.prototype.canAddPassivesCommand = function()
{
  return $gameSwitches.value(J.PASSIVE.Metadata.menuSwitchId);
};
//endregion Window_MenuCommand