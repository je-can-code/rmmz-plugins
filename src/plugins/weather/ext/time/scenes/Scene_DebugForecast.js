//region Scene_DebugForecast
import ForecastDirector from './../managers/ForecastDirector.js';
import Window_DebugForecast from './../windows/Window_DebugForecast.js';

/**
 * The scene a player reads the forecast in.
 *
 * One day at a time, paged left and right, because six phases across four or five destinations is
 * already a dense thing to read and stacking three days of it would be denser than it is useful.
 *
 * **Deliberately dumb**, like the window it owns: it holds which day is on screen, asks
 * {@link ForecastTable} for that day, and hands the result over. Nothing about weather is decided
 * here.
 */
class Scene_DebugForecast
  extends Scene_MenuBase
{
  /**
   * Opens the forecast.
   *
   * A static so the two ways in - the menu command and the plugin command - reach it through one
   * door rather than each knowing how to push a scene.
   */
  static callScene()
  {
    SceneManager.push(Scene_DebugForecast);
  }

  /**
   * Extends {@link Scene_MenuBase.initialize}.<br/>
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    this.initMembers();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the forecast.
     */
    this._j._forecast ||= {};

    /**
     * How many days ahead of today is being shown.
     * @type {number}
     */
    this._j._forecast._dayOffset = 0;

    /**
     * The window the day is drawn in.
     * @type {?Window_DebugForecast}
     */
    this._j._forecast._window = null;
  }

  /**
   * Gets how many days ahead of today is being shown.
   * @returns {number} The dayOffset.
   */
  dayOffset()
  {
    // hand back which day is on screen.
    return this._j._forecast._dayOffset;
  }

  /**
   * Sets how many days ahead of today is being shown.
   * @param {number} newOffset The new dayOffset.
   */
  setDayOffset(newOffset)
  {
    // assign which day is on screen.
    this._j._forecast._dayOffset = newOffset;
  }

  /**
   * Gets the window the day is drawn in.
   * @returns {?Window_DebugForecast} The forecastWindow.
   */
  forecastWindow()
  {
    // hand back the window.
    return this._j._forecast._window;
  }

  /**
   * Sets the window the day is drawn in.
   * @param {Window_DebugForecast} newWindow The new forecastWindow.
   */
  setForecastWindow(newWindow)
  {
    // assign the window.
    this._j._forecast._window = newWindow;
  }

  /**
   * Extends {@link Scene_MenuBase.create}.<br/>
   * Also builds the forecast window and fills it with today.
   */
  create()
  {
    // perform original logic.
    super.create();

    this.createForecastWindow();
    this.showDay(0);
  }

  /**
   * Builds the window the forecast is drawn in.
   */
  createForecastWindow()
  {
    const window = new Window_DebugForecast(this.forecastRectangle());

    this.setForecastWindow(window);
    this.addWindow(window);
  }

  /**
   * The bounds the forecast is drawn within.
   * @returns {Rectangle}
   */
  forecastRectangle()
  {
    const x = 0;
    const y = this.mainAreaTop();
    const width = Graphics.boxWidth;
    const height = this.mainAreaHeight();

    return new Rectangle(x, y, width, height);
  }

  /**
   * Shows a given day, clamped to the days the forecast is willing to show.
   * @param {number} dayOffset How many days ahead of today to show.
   */
  showDay(dayOffset)
  {
    const clamped = ForecastDirector.clampDayOffset(dayOffset);

    this.setDayOffset(clamped);

    this.forecastWindow()
      .setTable(ForecastDirector.tableFor($gameTime, clamped));
  }

  /**
   * Extends {@link Scene_MenuBase.update}.<br/>
   * Also pages between days, and leaves.
   */
  update()
  {
    // perform original logic.
    super.update();

    this.updatePaging();
  }

  /**
   * Moves between days on the left and right inputs.
   */
  updatePaging()
  {
    if (Input.isRepeated('right') === true)
    {
      this.showDay(this.dayOffset() + 1);

      return;
    }

    if (Input.isRepeated('left') === true)
    {
      this.showDay(this.dayOffset() - 1);

      return;
    }

    if (Input.isTriggered('cancel') === true)
    {
      this.popScene();
    }
  }
}

export default Scene_DebugForecast;
//endregion Scene_DebugForecast