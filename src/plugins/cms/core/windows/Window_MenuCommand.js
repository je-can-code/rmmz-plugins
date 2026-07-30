/**
 * Overwrites {@link #addMainCommands}.<br/>
 * Adds the vanilla main commands as built commands carrying both an icon and a menu section.
 *
 * These are built rather than added through vanilla's {@link Window_Command.addCommand} because that
 * pushes a plain object with nowhere to record a section, and these four are precisely the commands
 * that need one- three of them open actor-scoped scenes and belong in the menu's left column.
 */
Window_MenuCommand.prototype.addMainCommands = function()
{
  // all four vanilla main commands share the same enabled state.
  const enabled = this.areMainCommandsEnabled();

  // the item scene concerns the party's shared inventory rather than any one actor.
  if (this.needsCommand("item"))
  {
    this.addBuiltCommand(new WindowCommandBuilder(TextManager.item).setSymbol("item")
      .setHelpText(J.CMS_M.Metadata.helpTextFor("item"))
      .setEnabled(enabled)
      .setIconIndex(2567)
      .setMenuSection(MenuSection.Party)
      .build());
  }

  // the remaining three each open a scene about a single actor.
  if (this.needsCommand("skill"))
  {
    this.addBuiltCommand(new WindowCommandBuilder(TextManager.skill).setSymbol("skill")
      .setHelpText(J.CMS_M.Metadata.helpTextFor("skill"))
      .setEnabled(enabled)
      .setIconIndex(2564)
      .setMenuSection(MenuSection.Actor)
      .build());
  }

  if (this.needsCommand("equip"))
  {
    this.addBuiltCommand(new WindowCommandBuilder(TextManager.equip).setSymbol("equip")
      .setHelpText(J.CMS_M.Metadata.helpTextFor("equip"))
      .setEnabled(enabled)
      .setIconIndex(2565)
      .setMenuSection(MenuSection.Actor)
      .build());
  }
};

/**
 * Overwrites {@link #addOptionsCommand}.<br/>
 * Adds the options command when the plugin list includes it.
 */
Window_MenuCommand.prototype.addOptionsCommand = function()
{
  // the options command is only present when the database says it should be.
  if (this.needsCommand("options") === false) return;

  // whether the player may actually open it right now.
  const enabled = this.isOptionsEnabled();

  // options concern the game rather than any actor.
  this.addBuiltCommand(new WindowCommandBuilder(TextManager.options).setSymbol("options")
    .setHelpText(J.CMS_M.Metadata.helpTextFor("options"))
    .setEnabled(enabled)
    .setIconIndex(2566)
    .setMenuSection(MenuSection.Party)
    .build());
};

/**
 * Overwrites {@link #addGameEndCommand}.<br/>
 * Adds the game-end command with CMS icon styling.
 */
Window_MenuCommand.prototype.addGameEndCommand = function()
{
  // whether the player may actually quit right now.
  const enabled = this.isGameEndEnabled();

  // quitting concerns the game rather than any actor.
  this.addBuiltCommand(new WindowCommandBuilder(TextManager.gameEnd).setSymbol("gameEnd")
    .setHelpText(J.CMS_M.Metadata.helpTextFor("gameEnd"))
    .setEnabled(enabled)
    .setIconIndex(2562)
    .setMenuSection(MenuSection.Party)
    .build());
};
