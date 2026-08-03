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

    /**
     * What answering yes will cost, drawn beneath the question.
     * @type {string}
     */
    this._detail = String.empty;
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
   * Gets what answering yes will cost.
   * @returns {string}
   */
  detail()
  {
    return this._detail;
  }

  /**
   * Sets the question being asked and redraws around it.
   *
   * The two arrive together because they are drawn together, and setting one without the other would
   * leave the window briefly describing a different command than the one it is asking about.
   * @param {string} prompt The question to ask.
   * @param {string} detail What answering yes will cost, or an empty string when nothing needs saying.
   */
  setPrompt(prompt, detail)
  {
    this._prompt = prompt;

    this.setDetail(detail);

    this.refresh();
  }

  /**
   * Sets what answering yes will cost.
   *
   * Deliberately does not redraw: it is only ever written as half of a question, and {@link #setPrompt}
   * refreshes once both halves are in place rather than twice while they disagree.
   * @param {string} detail What answering yes will cost.
   */
  setDetail(detail)
  {
    this._detail = detail;
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
    // grab the two answers available.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * A question only ever has the two answers, in the order a reader expects them.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const yes = new WindowCommandBuilder('Yes')
      .setSymbol(this.confirmSymbol())
      .build();

    const no = new WindowCommandBuilder('No')
      .setSymbol(this.denySymbol())
      .build();

    return [ yes, no ];
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

    // the second line is optional, and the space above the answers is reserved for it either way, so
    // a command that needs no qualification does not shuffle its answers upward.
    if (this.detail() === String.empty) return;

    this.drawTextEx(this.detail(), 0, this.lineHeight(), this.innerWidth);
  }
}

export default Window_FilesConfirm;
//endregion Window_FilesConfirm