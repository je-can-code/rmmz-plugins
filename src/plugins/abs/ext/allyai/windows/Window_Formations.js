//region Window_Formations
/**
 * A window that allows selection from a list of ally AI formations.
 */
class Window_Formations
  extends Window_Command
{
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Generates the command list for the JABS menu.
   */
  makeCommandList()
  {
    // build all the commands.
    const commands = this.buildCommands();

    // add the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  buildCommands()
  {
    // iterate over each of the commands.
    return J.ABS.EXT.ALLYAI.Metadata.FormationTypes.map(this.buildCommand, this);
  }

  buildCommand(formation)
  {
    // extract some data from the formation.
    const {
      key,
      name,
      description
    } = formation;

    // check if the currently selected formation is what this is.
    const isEquipped = $gameParty.getPartyFormation() === key;

    // build the icon based on whether or not its assigned.
    const iconIndex = isEquipped
      ? J.ABS.EXT.ALLYAI.Metadata.AiModeEquippedIconIndex
      : J.ABS.EXT.ALLYAI.Metadata.AiModeNotEquippedIconIndex;

    // build the new "command".
    return new WindowCommandBuilder(name)
      .setSymbol("select-formation")
      .setTextLines(description.split(/[\r\n]/i))
      .flagAsSubText()
      .setIconIndex(iconIndex)
      .setEnabled(true)
      .setExtensionData(formation)
      .build();
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}
export default Window_Formations;
//endregion Window_Formations