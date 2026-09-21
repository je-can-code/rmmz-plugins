//region Window_ForecastCommand
/**
 * The three things a player can ask the forecast.
 *
 * Right now, the rest of today, and the week - which is the whole of what anybody wants from a
 * forecast, at the three distances they want it from.
 */
class Window_ForecastCommand
  extends Window_Command
{
  /**
   * The symbol for the view describing what it is doing where the player stands.
   * @type {string}
   */
  static NowSymbol = 'forecast-now';

  /**
   * The symbol for the view describing the rest of today over Raevula.
   * @type {string}
   */
  static TodaySymbol = 'forecast-today';

  /**
   * The symbol for the view describing the week ahead over Raevula.
   * @type {string}
   */
  static WeekSymbol = 'forecast-week';

  /**
   * Overwrites {@link #makeCommandList}.<br/>
   * Builds the three views.
   */
  makeCommandList()
  {
    const now = new WindowCommandBuilder('Right Now').setSymbol(Window_ForecastCommand.NowSymbol)
      .setHelpText('What the weather is doing where you are standing.')
      .build();

    const today = new WindowCommandBuilder('Today').setSymbol(Window_ForecastCommand.TodaySymbol)
      .setHelpText('How the sky over Raevula moves through the rest of the day.')
      .build();

    const week = new WindowCommandBuilder('The Week').setSymbol(Window_ForecastCommand.WeekSymbol)
      .setHelpText('The days ahead over Raevula, at a glance.')
      .build();

    [ now, today, week ].forEach(command => this.addBuiltCommand(command));
  }
}

export default Window_ForecastCommand;
//endregion Window_ForecastCommand