//region Scene_Map
/**
 * Extends {@link Scene_Map#initialize}.<br/>
 * Also initializes the TIME window.
 */
J.TIME.Aliased.Scene_Map.set("initialize", Scene_Map.prototype.initialize);
Scene_Map.prototype.initialize = function()
{
  // perform original logic.
  J.TIME.Aliased.Scene_Map.get("initialize")
    .call(this);

  // init the TIME window.
  this.initTimeMembers();
};

/**
 * Initializes all members related to the TIME system.
 */
Scene_Map.prototype.initTimeMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The window that displays the current time, real or artificial.
   * @type {Window_Time}
   */
  this._j._timeWindow = null;
};

/**
 * Extends {@link Scene_Map#createAllWindows}.<br/>
 * Also creates the TIME window.
 */
J.TIME.Aliased.Scene_Map.set("createAllWindows", Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.TIME.Aliased.Scene_Map.get("createAllWindows")
    .call(this);

  // also create the TIME window.
  this.createTimeWindow();
};

//region TIME window
/**
 * Creates the TIME window.
 */
Scene_Map.prototype.createTimeWindow = function()
{
  // create the window.
  const window = this.buildTimeWindow();

  // update the tracker with the new window.
  this.setTimeWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the TIME window.
 * @returns {Window_Time}
 */
Scene_Map.prototype.buildTimeWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.timeWindowRect();

  // create the window with the rectangle.
  const window = new Window_Time(rectangle);

  // return the built and configured window.
  return window;
};

/**
 * Creates the rectangle representing the window for TIME.
 * @returns {Rectangle}
 */
Scene_Map.prototype.timeWindowRect = function()
{
  // defined the width of the window.
  const width = 200;

  // define the height of the window.
  const height = 180;

  // the x and y are defined by the plugin parameters.
  const x = J.TIME.Metadata.TimeWindowX;
  const y = J.TIME.Metadata.TimeWindowY;

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};

/**
 * Gets the currently tracked TIME window.
 * @returns {Window_Time}
 */
Scene_Map.prototype.getTimeWindow = function()
{
  return this._j._timeWindow;
};

/**
 * Sets the currently tracked TIME window to the given window.
 * @param window
 */
Scene_Map.prototype.setTimeWindow = function(window)
{
  this._j._timeWindow = window;
};
//endregion TIME window

/**
 * Extends {@link Scene_Map#update}.<br/>
 * Also updates the TIME window.
 */
J.TIME.Aliased.Scene_Map.set("update", Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.TIME.Aliased.Scene_Map.get("update")
    .call(this);

  // also update the TIME window.
  this.updateTimeWindow();
};

/**
 * Handles the updating of the TIME window.
 */
Scene_Map.prototype.updateTimeWindow = function()
{
  // grab the TIME window.
  const timeWindow = this.getTimeWindow();

  // if for some reason, there is no TIME window, then don't try to update it.
  if (timeWindow === null) return;

  // update TIME.
  timeWindow.update();

  // handle visibility.
  this.manageTimeVisibility();
};

/**
 * Manages the visibility of the TIME window.
 */
Scene_Map.prototype.manageTimeVisibility = function()
{
  // grab the TIME window.
  const timeWindow = this.getTimeWindow();

  // check if the map window should be visible.
  if ($gameTime.isMapWindowVisible())
  {
    // show the window.
    timeWindow.show();
    timeWindow.open();
  }
  // it shouldn't be visible.
  else
  {
    // hide the window.
    timeWindow.close();
    timeWindow.hide();
  }
};

/**
 * Extends {@link Scene_Map#onMapLoaded}.<br/>
 * Also handles blocking/unblocking the flow of TIME based on the presence of tags.
 */
J.TIME.Aliased.Scene_Map.set("onMapLoaded", Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // inspect if this map was loaded as a result of a map transfer.
  if (this._transfer)
  {
    // handle the blockage of TIME as-needed.
    this.handleTimeBlock();

    // flag the system for needing a tone change (potentially) upon map transfer.
    $gameTime.setNeedsToneChange(true);
  }

  // perform original logic.
  J.TIME.Aliased.Scene_Map.get("onMapLoaded")
    .call(this);
};

/**
 * Blocks the flow of time if the target map is tagged with the specified tag.
 */
Scene_Map.prototype.handleTimeBlock = function()
{
  // check if TIME should be blocked.
  // TODO: update this to use notes instead of meta.
  if ($dataMap.meta && $dataMap.meta['timeBlock'])
  {
    // block it.
    $gameTime.block();
  }
  // it shouldn't be blocked.
  else
  {
    // unblock it.
    $gameTime.unblock();
  }
};
//endregion Scene_Map