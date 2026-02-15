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
    // build the commands.
    const commands = this.buildCommands();

    // add the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds the commands for this window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // build the "Apply" command.
    const apply = new WindowCommandBuilder('Apply current remapping')
      .setIconIndex(91)
      .setSymbol('apply')
      .setEnabled(true)
      .build();

    // build the "Reset to Defaults" command.
    const defaults = new WindowCommandBuilder('Reset to defaults')
      .setIconIndex(207)
      .setSymbol('defaults')
      .setEnabled(true)
      .build();

    // build the "Undo changes" command.
    const reset = new WindowCommandBuilder('Undo changes')
      .setIconIndex(74)
      .setSymbol('reset')
      .setEnabled(true)
      .build();

    // build the "Exit without saving" command.
    const cancel = new WindowCommandBuilder('Exit without saving')
      .setIconIndex(90)
      .setSymbol('cancel')
      .setEnabled(true)
      .build();

    return [ apply, defaults, reset, cancel ];
  }
}

//endregion Window_JabsRemapCommand