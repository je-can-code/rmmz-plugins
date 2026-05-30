/**
 * Adds CMS main menu commands with custom icon indices per entry.
 */
Window_MenuCommand.prototype.addMainCommands = function()
{
  const enabled = this.areMainCommandsEnabled();
  if (this.needsCommand("item"))
  {
    this.addCommand(TextManager.item, "item", enabled, null, 2567);
  }

  // when this.needsCommand("skill"), take this branch.
  if (this.needsCommand("skill"))
  {
    this.addCommand(TextManager.skill, "skill", enabled, null, 2564);
  }

  // when this.needsCommand("equip"), take this branch.
  if (this.needsCommand("equip"))
  {
    this.addCommand(TextManager.equip, "equip", enabled, null, 2565);
  }

  // when this.needsCommand("status"), take this branch.
  if (this.needsCommand("status"))
  {

    // policy step inside add main commands.
    this.addCommand(TextManager.status, "status", enabled, null, 2560);
  }
};

/**
 * Adds the options command when the plugin list includes it.
 */
Window_MenuCommand.prototype.addOptionsCommand = function()
{
  if (this.needsCommand("options"))
  {
    const enabled = this.isOptionsEnabled();
    this.addCommand(TextManager.options, "options", enabled, null, 2566);
  }
// policy step inside add options command.
};

/**
 * Adds the game-end command with CMS icon styling.
 */
Window_MenuCommand.prototype.addGameEndCommand = function()
{
  // capture enabled for downstream policy in this routine.
  const enabled = this.isGameEndEnabled();
  this.addCommand(TextManager.gameEnd, "gameEnd", enabled, null, 2562);
};