//region Window_JaftingList
import Scene_JaftingRefine from '../scenes/Scene_JaftingRefine.js';

/**
 * Extends {@link #buildCommands}.<br/>
 * Includes the refinement command as well as the rest.
 */
J.JAFTING.EXT.REFINE.Aliased.Window_JaftingList.set('buildCommands', Window_JaftingList.prototype.buildCommands);
Window_JaftingList.prototype.buildCommands = function()
{
  // get the original list of commands.
  // perform original logic.
  const commands = J.JAFTING.EXT.REFINE.Aliased.Window_JaftingList.get('buildCommands')
    .call(this);

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
  return new WindowCommandBuilder(J.JAFTING.EXT.REFINE.Metadata.commandName)
    .setSymbol(Scene_JaftingRefine.KEY)
    .setEnabled(Scene_JaftingRefine.isRefineCommandEnabled())
    .addTextLine("Give your equipment a personal touch.")
    .addTextLine("Modify your equips with trait transferrence and reach for godlihood!")
    .setIconIndex(J.JAFTING.EXT.REFINE.Metadata.commandIconIndex)
    .build();
};
//endregion Window_JaftingList