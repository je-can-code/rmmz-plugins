//region Window_JaftingList
/**
 * Extends {@link #buildCommands}.<br>
 * Includes the refinement command as well as the rest.
 */
J.JAFTING.EXT.REFINE.Aliased.Window_JaftingList.set('buildCommands', Window_JaftingList.prototype.buildCommands);
Window_JaftingList.prototype.buildCommands = function()
{
  // get the original list of commands.
  const commands = J.JAFTING.EXT.REFINE.Aliased.Window_JaftingList.get('buildCommands').call(this);

  // add the creation command.
  commands.push(this.buildRefinementCommand());

  // return the compiled list.
  return commands;
};

/**
 * Builds the jafting refinement command for the main jafting types menu.
 * @return {BuiltWindowCommand}
 */
Window_JaftingList.prototype.buildRefinementCommand = function()
{
  return new WindowCommandBuilder("Refinement")
    .setSymbol(Scene_JaftingRefine.KEY)
    .addSubTextLine("Give your equipment a personal touch.")
    .addSubTextLine("Modify your equips with trait transferrence and reach for godlihood!")
    .setIconIndex(2565)
    .build();
};
//endregion Window_JaftingList