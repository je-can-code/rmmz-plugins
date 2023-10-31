//region Window_JaftingList
/**
 * Extends {@link #buildCommands}.<br>
 * Includes the creation command as well as the rest.
 */
J.JAFTING.EXT.CREATE.Aliased.Window_JaftingList.set('buildCommands', Window_JaftingList.prototype.buildCommands);
Window_JaftingList.prototype.buildCommands = function()
{
  // get the original list of commands.
  const commands = J.JAFTING.EXT.CREATE.Aliased.Window_JaftingList.get('buildCommands').call(this);

  // add the creation command.
  commands.push(this.buildCreationCommand());

  // return the compiled list.
  return commands;
};

/**
 * Builds the jafting creation command for the main jafting types menu.
 * @return {BuiltWindowCommand}
 */
Window_JaftingList.prototype.buildCreationCommand = function()
{
  return new WindowCommandBuilder("Crafting")
    .setSymbol(Scene_JaftingCreate.KEY)
    .addSubTextLine("The crux of creation.")
    .addSubTextLine("Create items and equips from various categories of crafting- as your heart desires.")
    .setIconIndex(2565)
    .build();
};
//endregion Window_JaftingList