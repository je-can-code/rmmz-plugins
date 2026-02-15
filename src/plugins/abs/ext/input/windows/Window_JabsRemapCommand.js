//region Window_JabsRemapCommand
/**
 * Bottom command strip for Apply / Reset / Cancel.
 */
class Window_JabsRemapCommand
  extends Window_Command
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);
  }

  /**
   * Gets the number of visible rows.
   * @returns {number}
   */
  numVisibleRows()
  {
    // render a single row.
    return 4;
  }

  /**
   * Defines the commands for this window.
   */
  makeCommandList()
  {
    // add the apply command.
    this.addCommand("Apply current remapping", "apply");

    // add the defaults command (reset to defaults preview).
    this.addCommand("Reset to defaults", "defaults");

    // add the reset command (revert pending to current live bindings).
    this.addCommand("Undo changes", "reset");

    // add the close command.
    this.addCommand("Exit without saving", "cancel");
  }
}

//endregion Window_JabsRemapCommand