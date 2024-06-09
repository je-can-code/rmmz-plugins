//region Window_LootLog
/**
 * An extension/modification of the base {@link Window_MapLog}.<br/>
 * The {@link Window_DiaLog} is used for the chatter log.
 */
class Window_LootLog extends Window_MapLog
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   * @param {MapLogManager} logManager the manager that this window leverages to get logs from.
   */
  constructor(rect, logManager)
  {
    super(rect, logManager);
  }

  /**
   * Builds all commands for this action log window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // do nothing if the log manager is not yet set.
    if (!this.logManager) return [];

    // iterate over each log and build a command for them.
    const commands = this.logManager.getLogs()
      .map((log, index) =>
      {
        // add the message as a "command" into the log window.
        return new WindowCommandBuilder(`\\FS[14]${log.message()}`)
          .setSymbol(`log-${index}`)
          .setEnabled(true)
          .build();
      });

    // return the built commands.
    return commands;
  }
}

//endregion Window_LootLog