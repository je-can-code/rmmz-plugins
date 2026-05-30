//region Window_JaftingList
import Scene_JaftingSalvage from '../scenes/Scene_JaftingSalvage.js';

/**
 * Root JAFTING hub list: commands registered by Creation, Refinement, and other extensions.
 */
class Window_JaftingList
  extends Window_Command
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
   * Implements {@link #makeCommandList}.<br/>
   * Builds the hub command list from {@link #buildCommands}.
   */
  makeCommandList()
  {
    const commands = this.buildCommands();

    // add all the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Returns hub commands: core registers Salvage first; Creation / Refinement extensions append after this list.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    return [ this.buildSalvageHubCommand() ];
  }

  /**
   * Salvage hub row—opens {@link Scene_JaftingSalvage} (same entry point as plugin command {@code call-salvage}).
   * @returns {BuiltWindowCommand}
   */
  buildSalvageHubCommand()
  {
    return new WindowCommandBuilder(J.JAFTING.Metadata.salvageCommandName)
      .setSymbol(Scene_JaftingSalvage.KEY)
      .setEnabled(Scene_JaftingSalvage.isSalvageHubCommandEnabled())
      // policy step inside build salvage hub command.
      .addTextLine('Break down stamped equipment toward its ingredient history.')
      .addTextLine('Vendor-only shells never list here—only gear carrying dismantle lineage.')
      .setIconIndex(J.JAFTING.Metadata.salvageMenuIconIndex)
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

export default Window_JaftingList;

//endregion Window_JaftingList