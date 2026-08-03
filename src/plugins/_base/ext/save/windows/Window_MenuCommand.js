//region Window_MenuCommand
/**
 * Overwrites {@link #addSaveCommand}.<br/>
 * Offers the files scene from the menu, ungated.
 *
 * Two vanilla gates are deliberately dropped here, and both of them would otherwise take this command
 * off the menu entirely:
 *
 * - **`needsCommand("save")`** reads the database's menu-command table, and a project that turned the
 *   save command off there did so to stop the *menu* from saving. That is now this plugin's own policy
 *   rather than a setting - the menu offers Load and Rewind and never Save, because saving is the save
 *   platform's job - so the table is answering a question nobody is asking anymore.
 * - **`isSaveEnabled()`** reads `$gameSystem.isSaveEnabled()`, which an event can turn off and, in a
 *   game built around save points, generally has. Leaving that gate in would grey out Load and Rewind
 *   as collateral damage from a switch that was only ever meant to be about saving.
 *
 * Neither omission can leak into a savefile, which is the thing that would actually be dangerous: this
 * is a rendering decision made fresh every time the menu opens, not state written anywhere.
 */
Window_MenuCommand.prototype.addSaveCommand = function()
{
  const files = new WindowCommandBuilder('Files')
    .setSymbol('save')
    .setHelpText('Save, load, or step back through this playthrough.')
    .setIconIndex(2568)
    .setMenuSection(MenuSection.Party)
    .build();

  this.addBuiltCommand(files);
};
//endregion Window_MenuCommand