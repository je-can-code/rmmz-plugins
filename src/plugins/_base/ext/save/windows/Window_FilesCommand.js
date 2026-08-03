//region Window_FilesCommand
import SaveFileModeCatalog from './../core/SaveFileModeCatalog.js';

/**
 * The column naming what the player can do with their files.
 *
 * It offers whatever the origin offers and nothing else, which is why there is no branching here worth
 * reading: the decision of what a save platform means versus what the title screen means lives in one
 * table, and this window simply renders the answer.
 */
class Window_FilesCommand
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Seeds the roster and the origin before the command list is first built from them.
   *
   * `Window_Command.initialize` ends by refreshing, and refreshing is what calls `makeCommandList` - so
   * this hook is the only moment early enough for the list to see these at all.
   */
  initMembers()
  {
    /**
     * Every mode this window could offer, whether or not the current origin does.
     * @type {SaveFileMode[]}
     */
    this._modes = SaveFileModeCatalog.all();

    /**
     * Where the scene was opened from, which decides what is offered.
     *
     * Empty until the scene says, and an empty origin offers nothing - the list is built once during
     * construction, before anyone could have said, and a window that guessed would draw commands it is
     * about to have to take away again.
     * @type {string}
     */
    this._entryMode = String.empty;
  }

  /**
   * Gets every mode this window could offer.
   * @returns {SaveFileMode[]}
   */
  modes()
  {
    return this._modes;
  }

  /**
   * Gets where the scene was opened from.
   * @returns {string}
   */
  entryMode()
  {
    return this._entryMode;
  }

  /**
   * Sets where the scene was opened from and rebuilds the commands around it.
   * @param {string} entryMode The origin the scene was opened from.
   */
  setEntryMode(entryMode)
  {
    this._entryMode = entryMode;

    // the list built during construction was built against nothing; this is the one that counts.
    this.refresh();
  }

  /**
   * Finds the mode a command symbol names.
   * @param {string} symbol The symbol of the chosen command.
   * @returns {SaveFileMode|null} The mode, or null for `back`, which is a scene handler rather than a
   * mode.
   */
  modeFor(symbol)
  {
    return this.modes()
      .find(mode => mode.key() === symbol) ?? null;
  }

  /**
   * The symbol of the command that leaves the scene.
   * @returns {string}
   */
  backSymbol()
  {
    return 'back';
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   * Offers what the origin offers, then a way out.
   */
  makeCommandList()
  {
    // built once during construction before the scene has said where the player came from, and an
    // origin nobody has named offers nothing.
    if (this.entryMode() === String.empty) return;

    this.modes()
      .filter(mode => mode.isOfferedFrom(this.entryMode()))
      .forEach(mode => this.addModeCommand(mode));

    // leaving is always available, and always last.
    this.addBuiltCommand(new WindowCommandBuilder('Back').setSymbol(this.backSymbol())
      .setHelpText('Return to what you were doing.')
      .build());
  }

  /**
   * Adds the command for one mode.
   * @param {SaveFileMode} mode The mode being offered.
   */
  addModeCommand(mode)
  {
    this.addBuiltCommand(new WindowCommandBuilder(mode.label()).setSymbol(mode.key())
      .setHelpText(mode.helpText())
      .setEnabled(mode.isEnabled())
      .setIconIndex(mode.iconIndex())
      .build());
  }
}

export default Window_FilesCommand;
//endregion Window_FilesCommand