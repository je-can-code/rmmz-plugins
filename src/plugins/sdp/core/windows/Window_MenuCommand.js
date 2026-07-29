//region Window_MenuCommand
/**
 * Extends the make command list for the main menu to include SDP, if it meets the conditions.
 */
J.SDP.Aliased.Window_MenuCommand.set('makeCommandList', Window_MenuCommand.prototype.makeCommandList);
Window_MenuCommand.prototype.makeCommandList = function()
{
  // perform original logic.
  J.SDP.Aliased.Window_MenuCommand.get('makeCommandList')
    .call(this);

  // if we cannot add the command, then do not.
  if (!this.canAddSdpCommand()) return;

  // build the command.
  const command = new WindowCommandBuilder(J.SDP.Metadata.commandName)
    .setSymbol("sdp-menu")
    .setHelpText("Spend earned points to grow this character's parameters.")
    .setMenuSection(MenuSection.Actor)
    .setEnabled($gameParty.hasAnyUnlockedSdps())
    .setIconIndex(J.SDP.Metadata.commandIconIndex)
    .setColorIndex(1)
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
 * Determines whether or not the sdp command can be added to the main menu.
 *
 * Formerly also refused to render whenever JABS was installed, unless a parameter opted back in. That
 * made sense while the JABS quick menu carried its own copy of this command and the two would have
 * duplicated each other- but the quick menu no longer offers anything except a way into this one, so
 * the check had quietly become the reason the scene was reachable from nowhere at all.
 * @returns {boolean} True if the command should be added, false otherwise.
 */
Window_MenuCommand.prototype.canAddSdpCommand = function()
{
  // the switch remains the single gate, so the command can stay hidden until the story introduces it.
  return $gameSwitches.value(J.SDP.Metadata.menuSwitchId);
};
//endregion Window_MenuCommand