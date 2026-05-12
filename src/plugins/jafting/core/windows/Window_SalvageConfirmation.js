//region Window_SalvageConfirmation
/**
 * Confirms execution of salvage so players cannot accidentally dismantle gear.
 */
class Window_SalvageConfirmation
  extends Window_Command
{
  /**
   * @param {Rectangle} rect Window geometry.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Builds confirm/cancel commands.
   */
  makeCommandList()
  {
    // symbols stay terse—scene handlers map ok/cancel semantics onto these keys.
    this.addCommand('Salvage now', 'confirm', true);
    this.addCommand('Nevermind', 'cancel', true);
  }
}

//endregion Window_SalvageConfirmation