//region Window_MenuCommand
/**
 * Extends {@link #makeCommandList}.<br>
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
 * When no switch is configured (id 0), the command is always shown.
 * @returns {boolean}
 */
Window_MenuCommand.prototype.canAddPassivesCommand = function()
{
  // switch id of 0 means "always show"; no switch check needed.
  if (!J.PASSIVE.Metadata.menuSwitchId) return true;

  // defer to the configured switch.
  return $gameSwitches.value(J.PASSIVE.Metadata.menuSwitchId);
};
//endregion Window_MenuCommand