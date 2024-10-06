//region Window_OmnipediaList
/**
 * A window displaying the list of jafting types available.
 */
class Window_JaftingList extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of omnipedia entries available for this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // add all the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all omnipedia commands to the list that are available.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    /*
    const refinementCommand = new WindowCommandBuilder("Refinement")
      .setSymbol("refinement")
      .addSubTextLine("The niche hobbiest dream.")
      .addSubTextLine("Update equips by consuming other equips and materials- to an extent.")
      .setIconIndex(2566)
      .build();

    const freestyleCommand = new WindowCommandBuilder("Freestyle")
      .setSymbol("freestyle")
      .addSubTextLine("Submit to RNGesus.")
      .addSubTextLine("Freestyle with some materials to experience creation- with a touch of random.")
      .setIconIndex(2569)
      .build();
    */

    return [];
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

//endregion Window_OmnipediaList