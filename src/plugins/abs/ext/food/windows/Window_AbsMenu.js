//region Window_AbsMenu food extensions

//region buildCommands
/**
 * Extends {@link Window_AbsMenu.prototype.buildCommands}.<br>
 * Appends the Equip Food command to the JABS quick-menu list so that players
 * can assign a food item to the R2 slot from the same interface used for tools
 * and dodge skills.
 * @returns {BuiltWindowCommand[]} All commands, including the food assignment entry.
 */
J.ABS.EXT.FOOD.Aliased.Window_AbsMenu.set('buildCommands', Window_AbsMenu.prototype.buildCommands);
Window_AbsMenu.prototype.buildCommands = function()
{
  // perform original logic to collect the existing command list.
  const commands = J.ABS.EXT.FOOD.Aliased.Window_AbsMenu.get('buildCommands').call(this);

  // build the Equip Food command, mirroring the tool command's visual style.
  const foodCommand = new WindowCommandBuilder(J.ABS.EXT.FOOD.Metadata.EquipFoodText)
    .setSymbol('food-assign')
    .setEnabled(true)
    .setIconIndex(210)
    .setColorIndex(29)
    .setHelpText(this.foodAssignHelpText())
    .build();

  commands.push(foodCommand);

  return commands;
};
//endregion buildCommands

//region foodAssignHelpText
/**
 * Returns the help text shown for the Equip Food command in the ABS menu.
 * @returns {string} The help text string.
 */
Window_AbsMenu.prototype.foodAssignHelpText = function()
{
  const lines = [
    'Select a food item to assign to the R2 food slot.',
    'Consuming food applies buffet heals and starts a typed chain arc.',
  ];

  return lines.join('\n');
};
//endregion foodAssignHelpText
//endregion Window_AbsMenu food extensions