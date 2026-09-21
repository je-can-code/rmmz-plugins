//region Scene_Forecast
import ForecastDirector from './../managers/ForecastDirector.js';
import Window_ForecastCommand from './../windows/Window_ForecastCommand.js';
import Window_ForecastNow from './../windows/Window_ForecastNow.js';
import Window_ForecastToday from './../windows/Window_ForecastToday.js';
import Window_ForecastWeek from './../windows/Window_ForecastWeek.js';

/**
 * The forecast, as a player reads it.
 *
 * Three views at three distances: what it is doing here and now, how the sky over Raevula moves
 * through the rest of today, and the shape of the week. Built on the facet skeleton so it sits in
 * the same chrome as every other scene in the game rather than inventing a layout.
 *
 * **Raevula, not Erocia's regions.** There is one weather system over the island and one town left
 * standing on it, so there is one forecast; a player has no way to check the sky somewhere they
 * are not. The developer screen behind `showDebugForecast` breaks it down by destination, and is
 * deliberately not this.
 *
 * Deliberately dumb, like its windows. It owns which view is showing and asks
 * {@link ForecastDirector} for the contents.
 */
class Scene_Forecast
  extends Scene_MenuFacetBase
{
  /**
   * Opens the forecast.
   */
  static callScene()
  {
    SceneManager.push(Scene_Forecast);
  }

  /**
   * Extends {@link Scene_MenuFacetBase.initMembers}.<br/>
   * Also initializes this scene's own windows.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * A grouping of all properties associated with the forecast.
     */
    this._j._forecast = {};

    /**
     * The list of views.
     * @type {?Window_ForecastCommand}
     */
    this._j._forecast._commands = null;

    /**
     * The view describing here and now.
     * @type {?Window_ForecastNow}
     */
    this._j._forecast._now = null;

    /**
     * The view describing the rest of today.
     * @type {?Window_ForecastToday}
     */
    this._j._forecast._today = null;

    /**
     * The view describing the week ahead.
     * @type {?Window_ForecastWeek}
     */
    this._j._forecast._week = null;

    /**
     * Which view is currently filled, so it is only refilled when it actually changes.
     *
     * Without this the update loop refills sixty times a second, which re-rolls the remark on
     * every frame and leaves the here-and-now view flickering through every line anybody wrote.
     * @type {string}
     */
    this._j._forecast._showing = String.empty;
  }

  /**
   * Gets which view is currently filled.
   * @returns {string} The showing symbol.
   */
  showing()
  {
    // hand back which view has been filled.
    return this._j._forecast._showing;
  }

  /**
   * Sets which view is currently filled.
   * @param {string} newSymbol The new showing symbol.
   */
  setShowing(newSymbol)
  {
    // assign which view has been filled.
    this._j._forecast._showing = newSymbol;
  }

  /**
   * Gets the list of views.
   * @returns {?Window_ForecastCommand} The commandWindow.
   */
  commandWindow()
  {
    // hand back the list.
    return this._j._forecast._commands;
  }

  /**
   * Sets the list of views.
   * @param {Window_ForecastCommand} newWindow The new commandWindow.
   */
  setCommandWindow(newWindow)
  {
    // assign the list.
    this._j._forecast._commands = newWindow;
  }

  /**
   * Gets the view describing here and now.
   * @returns {?Window_ForecastNow} The nowWindow.
   */
  nowWindow()
  {
    // hand back the here-and-now view.
    return this._j._forecast._now;
  }

  /**
   * Sets the view describing here and now.
   * @param {Window_ForecastNow} newWindow The new nowWindow.
   */
  setNowWindow(newWindow)
  {
    // assign the here-and-now view.
    this._j._forecast._now = newWindow;
  }

  /**
   * Gets the view describing the rest of today.
   * @returns {?Window_ForecastToday} The todayWindow.
   */
  todayWindow()
  {
    // hand back the day view.
    return this._j._forecast._today;
  }

  /**
   * Sets the view describing the rest of today.
   * @param {Window_ForecastToday} newWindow The new todayWindow.
   */
  setTodayWindow(newWindow)
  {
    // assign the day view.
    this._j._forecast._today = newWindow;
  }

  /**
   * Gets the view describing the week ahead.
   * @returns {?Window_ForecastWeek} The weekWindow.
   */
  weekWindow()
  {
    // hand back the week view.
    return this._j._forecast._week;
  }

  /**
   * Sets the view describing the week ahead.
   * @param {Window_ForecastWeek} newWindow The new weekWindow.
   */
  setWeekWindow(newWindow)
  {
    // assign the week view.
    this._j._forecast._week = newWindow;
  }

  /**
   * Extends {@link Scene_MenuFacetBase.create}.<br/>
   * Also builds the list and the three views.
   */
  create()
  {
    // perform original logic.
    super.create();

    this.createHelpWindow();
    this.createForecastCommandWindow();
    this.createForecastViews();

    this.showView(Window_ForecastCommand.NowSymbol);
  }

  /**
   * Builds the list of views.
   */
  createForecastCommandWindow()
  {
    const window = new Window_ForecastCommand(this.forecastCommandRect());

    window.setHandler(Window_ForecastCommand.NowSymbol, this.commandView.bind(this));
    window.setHandler(Window_ForecastCommand.TodaySymbol, this.commandView.bind(this));
    window.setHandler(Window_ForecastCommand.WeekSymbol, this.commandView.bind(this));
    window.setHandler('cancel', this.popScene.bind(this));
    window.setHelpWindow(this.helpWindow());
    window.activate();

    this.setCommandWindow(window);
    this.addWindow(window);
  }

  /**
   * Builds all three views, with only the first showing.
   */
  createForecastViews()
  {
    const rect = this.forecastDetailRect();

    this.setNowWindow(new Window_ForecastNow(rect));
    this.setTodayWindow(new Window_ForecastToday(rect));
    this.setWeekWindow(new Window_ForecastWeek(rect));

    this.forecastViews()
      .forEach(window => this.addWindow(window));
  }

  /**
   * Every view, in the order the list offers them.
   * @returns {Window_Base[]}
   */
  forecastViews()
  {
    return [ this.nowWindow(), this.todayWindow(), this.weekWindow() ];
  }

  /**
   * The bounds of the list of views.
   * @returns {Rectangle}
   */
  forecastCommandRect()
  {
    const area = this.facetAreaRect();

    // sized to its three rows rather than to the column. A list window is drawn full height where
    // it holds an unknown number of things and the player scrolls it; this holds exactly three
    // forever, and stretching it leaves most of the screen's left edge as an empty box.
    const height = this.calcWindowHeight(Window_ForecastCommand.ViewCount, true);

    return new Rectangle(area.x, area.y, this.commandColumnWidth(), height);
  }

  /**
   * The bounds the showing view fills.
   * @returns {Rectangle}
   */
  forecastDetailRect()
  {
    const area = this.facetAreaRect();
    const x = area.x + this.commandColumnWidth();

    return new Rectangle(x, area.y, area.width - this.commandColumnWidth(), area.height);
  }

  /**
   * Moves between views as the cursor moves, rather than on confirm.
   *
   * A three-item list where every item is a page of information is a list nobody wants to press a
   * button to read - the cursor moving *is* the choice.
   */
  commandView()
  {
    this.commandWindow()
      .activate();
  }

  /**
   * Extends {@link Scene_MenuFacetBase.update}.<br/>
   * Also keeps the showing view in step with the cursor.
   */
  update()
  {
    // perform original logic.
    super.update();

    this.updateShowingView();
  }

  /**
   * Shows whichever view the cursor is currently on.
   */
  updateShowingView()
  {
    const symbol = this.commandWindow()
      .currentSymbol();

    if (symbol === null) return;

    // the cursor has not moved, and refilling would re-roll the remark on every frame.
    if (symbol === this.showing()) return;

    this.showView(symbol);
  }

  /**
   * Shows one view and hides the others.
   * @param {string} symbol Which view to show.
   */
  showView(symbol)
  {
    this.setShowing(symbol);

    const showing = this.viewFor(symbol);

    this.forecastViews()
      .forEach(window =>
      {
        window.visible = window === showing;
      });

    this.fillView(symbol);
  }

  /**
   * Which window a given view symbol belongs to.
   * @param {string} symbol The view being asked for.
   * @returns {Window_Base}
   */
  viewFor(symbol)
  {
    if (symbol === Window_ForecastCommand.TodaySymbol) return this.todayWindow();

    if (symbol === Window_ForecastCommand.WeekSymbol) return this.weekWindow();

    return this.nowWindow();
  }

  /**
   * Fills the showing view with what it describes.
   *
   * Refilled whenever it is shown rather than once at creation, because the clock keeps running
   * while the scene is open and a phase can turn over under the player's cursor.
   * @param {string} symbol Which view is showing.
   */
  fillView(symbol)
  {
    if (symbol === Window_ForecastCommand.TodaySymbol)
    {
      this.todayWindow()
        .setDigest(ForecastDirector.todayFor($gameTime));

      return;
    }

    if (symbol === Window_ForecastCommand.WeekSymbol)
    {
      this.weekWindow()
        .setDigest(ForecastDirector.weekFor($gameTime));

      return;
    }

    this.nowWindow()
      .setReading(ForecastDirector.readingHere($gameTime));
  }

  /**
   * Overwrites {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * @returns {{semantic: string, label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        // a pair rather than one entry, because moving between the three views is one control as
        // far as the player is concerned. The legend falls back to a semantic's own name when
        // nothing resolves it, so these read as words rather than vanishing.
        semantic: [ 'up', 'down' ],
        label: 'Change view',
      },
      {
        semantic: 'cancel',
        label: 'Back',
      },
    ];
  }
}

export default Scene_Forecast;
//endregion Scene_Forecast