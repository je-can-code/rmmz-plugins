//region Window_MenuCommand
/**
 * Extends {@link #addOriginalCommands}.<br/>
 * Adds the ally AI command to the main menu's party column.
 *
 * The party column rather than the actor column, because what this configures is how the party behaves
 * as a group- the formation they hold, whether they pick fights of their own- and the per-ally presets
 * only make sense read against each other.
 */
J.ABS.EXT.ALLYAI.Aliased.Window_MenuCommand.set(
  'addOriginalCommands',
  Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // if the switch is disabled, then the command won't even appear in the menu.
  if (this.canAddAllyAiCommand() === false) return;

  // if followers aren't being used, then this command will be disabled- there are no allies to direct.
  const enabled = $gamePlayer.followers()
    .isVisible();

  // build the command.
  const command = new WindowCommandBuilder(J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandName).setSymbol('ally-ai')
    .setEnabled(enabled)
    .setIconIndex(J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandIconIndex)
    .setColorIndex(27)
    .setHelpText(this.allyAiHelpText())
    .setMenuSection(MenuSection.Party)
    .build();

  // add the command to the menu.
  this.addBuiltCommand(command);
};

/**
 * Determines whether or not the ally ai management command can be added to the menu.
 * @returns {boolean} True if the command should be added, false otherwise.
 */
Window_MenuCommand.prototype.canAddAllyAiCommand = function()
{
  // if the necessary switch isn't ON, don't render the command at all.
  return $gameSwitches.value(J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandSwitchId);
};

/**
 * The help text for the ally AI menu command.
 * @returns {string}
 */
Window_MenuCommand.prototype.allyAiHelpText = function()
{
  const description = [
    "Your ally management selection menu.",
    "A general direction or theme of guidance can be assigned to your allies from here." ];

  return description.join("\n");
};
//endregion Window_MenuCommand
