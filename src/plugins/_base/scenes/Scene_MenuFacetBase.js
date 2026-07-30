//region Scene_MenuFacetBase
import Window_ControlLegend from './../windows/Window_ControlLegend.js';

/**
 * The shared skeleton for menu scenes.
 *
 * Scenes built independently drift. Measured across this ecosystem: one scene centers a container at
 * two thirds of the screen, another runs full width with a hardcoded 420px column, a third invents a
 * layout of its own, and one of them mixes two different vertical origins between its own rectangles.
 * Nobody decided any of that- it is simply what happens when the same idea is implemented separately
 * enough times.
 *
 * This base owns the chrome: a help window across the top, a control legend across the bottom, and a
 * bounded region between them. Subclasses fill the region and nothing else. The region's contents are
 * entirely free; its rectangle is not, and that single constraint is the whole anti-drift mechanism.
 *
 * Every dimension derives from {@link Graphics} and the current line height. There are no pixel
 * literals here, and there should be none in anything built on this.
 */
class Scene_MenuFacetBase
  extends Scene_MenuBase
{
  /**
   * Extends {@link #initialize}.<br/>
   * Also initializes this scene's members.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this scene.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the facet skeleton.
     */
    this._j._facet = {};

    /**
     * The legend describing this scene's controls.
     * @type {Window_ControlLegend|null}
     */
    this._j._facet._legend = null;
  }

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates the shared chrome.
   */
  create()
  {
    // perform original logic.
    super.create();

    // build the chrome shared by every facet scene.
    this.createControlLegendWindow();
  }

  /**
   * Creates the control legend window and adds it to tracking.
   */
  createControlLegendWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.controlLegendWindowRect();

    // create the window with the rectangle.
    const window = new Window_ControlLegend(rectangle);

    // seed it with whatever this scene wants to teach.
    window.setEntries(this.controlLegendEntries());

    // update the tracker with the new window.
    this.setControlLegendWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Gets the currently tracked control legend window.
   * @returns {Window_ControlLegend|null}
   */
  getControlLegendWindow()
  {
    return this._j._facet._legend;
  }

  /**
   * Sets the currently tracked control legend window to the given window.
   * @param {Window_ControlLegend} window The window to track.
   */
  setControlLegendWindow(window)
  {
    this._j._facet._legend = window;
  }

  //endregion create

  //region layout
  /**
   * Overwrites {@link #isBottomHelpMode}.<br/>
   * The help window belongs at the top of a facet scene, never the bottom.
   *
   * The engine defaults this to true, which places the help window across the bottom of the screen-
   * directly where the control legend lives. Left alone, every facet scene renders an empty help
   * window on top of its own legend.
   * @returns {boolean}
   */
  isBottomHelpMode()
  {
    return false;
  }

  /**
   * Overwrites {@link #isBottomButtonMode}.<br/>
   * Facet scenes teach their controls through the legend rather than on-screen buttons.
   * @returns {boolean}
   */
  isBottomButtonMode()
  {
    return true;
  }

  /**
   * The height of the help window across the top.
   * @returns {number}
   */
  helpAreaHeight()
  {
    // a scene that renders no help window must not reserve the strip for one, or the space shows up as
    // a blank band across the top with nothing to explain why it is there.
    if (this.hasHelpWindow() === false) return 0;

    return this.calcWindowHeight(this.helpWindowLineCount(), false);
  }

  /**
   * Whether this scene renders a help window across the top.
   *
   * Most facet scenes should: a line or two describing whatever is highlighted is the cheapest
   * discoverability there is. But some carry a detail panel rich enough that a help strip would either
   * duplicate it or sit empty, and reserving space for a window that never arrives is worse than not
   * reserving it. Those override this to `false`, and receive a taller region in exchange.
   *
   * Note that the base does not create the help window either way- scenes call `createHelpWindow()`
   * themselves, because they alone know what to feed it. This only governs whether the room is made.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return true;
  }

  /**
   * How many lines of description the help window across the top can render.
   * @returns {number}
   */
  helpWindowLineCount()
  {
    return 2;
  }

  /**
   * The height of the control legend across the bottom.
   * @returns {number}
   */
  controlLegendHeight()
  {
    return this.calcWindowHeight(1, false);
  }

  /**
   * Builds the rectangle for the control legend, pinned across the bottom of the screen.
   * @returns {Rectangle}
   */
  controlLegendWindowRect()
  {
    // the legend spans the full width, since it describes the whole scene rather than one window.
    const width = Graphics.boxWidth;

    // a single line of reduced-size text.
    const height = this.controlLegendHeight();

    // pin it to the bottom edge.
    const y = Graphics.boxHeight - height;

    // return the built rectangle.
    return new Rectangle(0, y, width, height);
  }

  /**
   * Builds the rectangle for the bounded region subclasses fill.
   *
   * This is deliberately the *remainder* of the screen rather than a computed size, so that rounding
   * in the chrome above and below can never leave an unclaimed strip of pixels.
   * @returns {Rectangle}
   */
  facetAreaRect()
  {
    // start below the help window.
    const y = this.mainAreaTop();

    // claim everything between the help window and the legend.
    const height = Graphics.boxHeight - y - this.controlLegendHeight();

    // return the built rectangle.
    return new Rectangle(0, y, Graphics.boxWidth, height);
  }

  /**
   * The proportion of the screen width given to a single column of commands.
   *
   * Expressed as a ratio rather than a pixel count so the layout holds at any resolution. Subclasses
   * needing a wider or narrower command column override this rather than computing their own widths.
   * @returns {number}
   */
  commandColumnRatio()
  {
    return 0.22;
  }

  /**
   * The width of a single command column.
   * @returns {number}
   */
  commandColumnWidth()
  {
    return Math.floor(Graphics.boxWidth * this.commandColumnRatio());
  }

  //endregion layout

  /**
   * The entries this scene's control legend describes.
   *
   * Subclasses override this to teach their own controls. Returning an empty collection renders no
   * legend at all, which is the correct behavior for a scene that genuinely has nothing to explain.
   * @returns {{semantic: string, label: string}[]}
   */
  controlLegendEntries()
  {
    return [];
  }
}

export default Scene_MenuFacetBase;
//endregion Scene_MenuFacetBase
