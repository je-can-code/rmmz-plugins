//region Window_FilesConfirm
/**
 * The last chance to change your mind.
 *
 * Deliberately small and deliberately centred over the list, so the row being asked about stays visible
 * behind the question rather than being covered by it - "delete slot 1?" is a much easier question to
 * answer correctly while still looking at slot 1.
 *
 * Which answer the cursor starts on is the mode's decision, not this window's. Only the irreversible
 * command opens on "no"; everywhere else, starting on the safe answer would add a keypress to the thing
 * the player just asked for.
 */
class Window_FilesConfirm
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Seeds the question before the command list is first built.
   */
  initMembers()
  {
    /**
     * The question being asked.
     * @type {string}
     */
    this._prompt = String.empty;
  }

  /**
   * Gets the question being asked.
   * @returns {string}
   */
  prompt()
  {
    return this._prompt;
  }

  /**
   * Sets the question being asked and redraws around it.
   * @param {string} prompt The question to ask.
   */
  setPrompt(prompt)
  {
    this._prompt = prompt;

    this.refresh();
  }

  /**
   * The symbol of the answer that goes ahead.
   * @returns {string}
   */
  confirmSymbol()
  {
    return 'confirm';
  }

  /**
   * The symbol of the answer that backs out.
   * @returns {string}
   */
  denySymbol()
  {
    return 'deny';
  }

  /**
   * How many lines the question is given before the answers begin.
   * @returns {number}
   */
  promptLineCount()
  {
    return 2;
  }

  /**
   * Extends {@link Window_Selectable.itemRect}.<br/>
   * Pushes every answer below the question rather than letting the first one sit on top of it.
   * @param {number} index The row being placed.
   * @returns {Rectangle}
   */
  itemRect(index)
  {
    // perform original logic.
    const rectangle = super.itemRect(index);

    rectangle.y += this.promptLineCount() * this.lineHeight();

    return rectangle;
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   */
  makeCommandList()
  {
    this.addBuiltCommand(new WindowCommandBuilder('Yes').setSymbol(this.confirmSymbol())
      .build());

    this.addBuiltCommand(new WindowCommandBuilder('No').setSymbol(this.denySymbol())
      .build());
  }

  /**
   * Extends {@link Window_Command.refresh}.<br/>
   * Also draws the question above the answers.
   */
  refresh()
  {
    // perform original logic, which clears the contents and draws the two answers.
    super.refresh();

    // a window built before anyone asked anything has nothing to draw above them.
    if (this.prompt() === String.empty) return;

    this.drawTextEx(this.prompt(), 0, 0, this.innerWidth);
  }
}

export default Window_FilesConfirm;
//endregion Window_FilesConfirm