//region Window_OmnipediaList
/**
 * Extends {@link #buildCommands}.<br/>
 * Adds the statistopedia command to the list of commands in the omnipedia.
 */
J.OMNI.EXT.STATS.Aliased.Window_OmnipediaList.set('buildCommands', Window_OmnipediaList.prototype.buildCommands);
Window_OmnipediaList.prototype.buildCommands = function()
{
  // perform original logic.
  const originalCommands = J.OMNI.EXT.STATS.Aliased.Window_OmnipediaList.get('buildCommands')
    .call(this);

  // check if the statistopedia command should be added.
  if (this.canAddStatistopediaCommand())
  {
    // build the statistopedia command.
    const statistopediaCommand = new WindowCommandBuilder(J.OMNI.EXT.STATS.Metadata.Command.Name)
      .setSymbol(J.OMNI.EXT.STATS.Metadata.Command.Symbol)
      .addTextLine("A running account of everything you have done out there.")
      .addTextLine("It keeps score whether or not you asked it to.")
      .setIconIndex(J.OMNI.EXT.STATS.Metadata.Command.IconIndex)
      .build();

    // add the statistopedia command to the running list.
    originalCommands.push(statistopediaCommand);
  }

  // return all the commands.
  return originalCommands;
};

/**
 * Determines whether or not the statistopedia command should be added to the Omnipedia.
 * @returns {boolean}
 */
Window_OmnipediaList.prototype.canAddStatistopediaCommand = function()
{
  // if the necessary switch isn't ON, don't render the command at all.
  if (!$gameSwitches.value(J.OMNI.EXT.STATS.Metadata.EnabledSwitch)) return false;

  // add the command!
  return true;
};
//endregion Window_OmnipediaList