/**
 * Extends {@link #buildCommands}.<br>
 * Adds the questopedia command to the list of commands in the omnipedia.
 */
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList.set('buildCommands', Window_OmnipediaList.prototype.buildCommands);
Window_OmnipediaList.prototype.buildCommands = function()
{
  // perform original logic.
  const originalCommands = J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList.get('buildCommands')
    .call(this);

  // check if the monsterpedia command should be added.
  if (this.canAddMonsterpediaCommand())
  {
    // build the monsterpedia command.
    const questopediaCommand = new WindowCommandBuilder(J.OMNI.EXT.QUEST.Metadata.Command.Name)
      .setSymbol(J.OMNI.EXT.QUEST.Metadata.Command.Symbol)
      .addTextLine("A fine binding full of pages that contain details of known quests.")
      .addTextLine("It won't contain anything you don't actually know about.")
      .setIconIndex(J.OMNI.EXT.QUEST.Metadata.Command.IconIndex)
      .build();

    // add the monsterpedia command to the running list.
    originalCommands.push(questopediaCommand);
  }

  // return all the commands.
  return originalCommands;
};

/**
 * Determines whether or not the monsterpedia command should be added to the Omnipedia.
 * @returns {boolean}
 */
Window_OmnipediaList.prototype.canAddMonsterpediaCommand = function()
{
  // if the necessary switch isn't ON, don't render the command at all.
  if (!$gameSwitches.value(J.OMNI.EXT.QUEST.Metadata.enabledSwitchId)) return false;

  // add the command!
  return true;
};