//region Window_Stances
/**
 * A window that allows selection from the stances the party's allies can take.
 */
class Window_Stances
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The shape of this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Generates the command list of stances.
   */
  makeCommandList()
  {
    // build all the commands.
    const commands = this.buildCommands();

    // add the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds one command for every stance the party can take.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // iterate over each of the stances.
    return J.ABS.EXT.ALLYAI.Metadata.StanceTypes.map(this.buildCommand, this);
  }

  /**
   * Builds the command for a single stance.
   * @param {JABS_Stance} stance The stance to build a command for.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(stance)
  {
    // extract some data from the stance.
    const {
      key,
      name,
      description
    } = stance;

    // check if the currently chosen stance is what this is.
    const isEquipped = $gameParty.getPartyStance() === key;

    // build the icon based on whether or not its assigned.
    const iconIndex = isEquipped
      ? J.ABS.EXT.ALLYAI.Metadata.AiModeEquippedIconIndex
      : J.ABS.EXT.ALLYAI.Metadata.AiModeNotEquippedIconIndex;

    // build the new "command".
    return new WindowCommandBuilder(name)
      .setSymbol('select-stance')
      .setTextLines(description.split(/[\r\n]/i))
      .flagAsSubText()
      .setIconIndex(iconIndex)
      .setEnabled(true)
      .setExtensionData(stance)
      .build();
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}
export default Window_Stances;
//endregion Window_Stances