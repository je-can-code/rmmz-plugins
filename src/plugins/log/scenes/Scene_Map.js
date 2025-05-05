//region Scene_Map
/**
 * Hooks into `initialize` to add our log.
 */
J.LOG.Aliased.Scene_Map.set('initialize', Scene_Map.prototype.initialize);
Scene_Map.prototype.initialize = function()
{
  // perform original logic.
  J.LOG.Aliased.Scene_Map.get('initialize')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._log = {};

  /**
   * The action log for the map.
   * @type {Window_MapLog}
   */
  this._j._log._actionLog = null;

  /**
   * The chat-centric log for the map.
   * @type {Window_DiaLog}
   */
  this._j._log._diaLog = null;
};

/**
 * Extends {@link #createAllWindows}.<br>
 * Creates the action log as well.
 */
J.LOG.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.LOG.Aliased.Scene_Map.get('createAllWindows')
    .call(this);

  // create the actions log.
  this.createActionLogWindow();

  // create the chat log.
  this.createDiaLogWindow();

  // create the loot log.
  this.createLootLogWindow();
};

//region action log
/**
 * Creates the action log window and adds it to tracking.
 */
Scene_Map.prototype.createActionLogWindow = function()
{
  // create the window.
  const window = this.buildActionLogWindow();

  // update the tracker with the new window.
  this.setActionLogWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the action log window.
 * @returns {Window_MapLog}
 */
Scene_Map.prototype.buildActionLogWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.actionLogWindowRect();

  // create the window with the rectangle.
  const window = new Window_MapLog(rectangle, $actionLogManager);

  // deselect/deactivate the window so we don't have it look interactable.
  window.deselect();
  window.deactivate();

  // return the built and configured window.
  return window;
};

/**
 * Creates the rectangle representing the window for the action log.
 * @returns {Rectangle}
 */
Scene_Map.prototype.actionLogWindowRect = function()
{
  // an arbitrary number of rows.
  const rows = 8;

  // define the width of the window.
  const width = 600;

  // define the height of the window.
  const height = (Window_MapLog.rowHeight * (rows + 2)) - 8;

  // define the origin x of the window.
  const x = Graphics.boxWidth - width;

  // define the origin y of the window.
  const y = Graphics.boxHeight - height - 72;

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};

/**
 * Gets the currently tracked action log window.
 * @returns {Window_MapLog}
 */
Scene_Map.prototype.getActionLogWindow = function()
{
  return this._j._log._actionLog;
};

/**
 * Set the currently tracked action log window to the given window.
 * @param {Window_MapLog} window The window to track.
 */
Scene_Map.prototype.setActionLogWindow = function(window)
{
  this._j._log._actionLog = window;
};
//endregion action log

//region dia log
/**
 * Creates the dia log window and adds it to tracking.
 */
Scene_Map.prototype.createDiaLogWindow = function()
{
  // create the window.
  const window = this.buildDiaLogWindow();

  // update the tracker with the new window.
  this.setDiaLogWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the dia log window.
 * @returns {Window_DiaLog}
 */
Scene_Map.prototype.buildDiaLogWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.diaLogWindowRect();

  // create the window with the rectangle.
  const window = new Window_DiaLog(rectangle, $diaLogManager);

  // deselect/deactivate the window so we don't have it look interactable.
  window.deselect();
  window.deactivate();

  // return the built and configured window.
  return window;
};

/**
 * Creates the rectangle representing the window for the dia log.
 * @returns {Rectangle}
 */
Scene_Map.prototype.diaLogWindowRect = function()
{
  // an arbitrary number of rows.
  const rows = 3;

  // define the width of the window.
  const width = 700;

  // define the height of the window.
  const height = (Window_DiaLog.rowHeight * (rows)) + 24;

  // define the origin x of the window.
  const x = Graphics.boxWidth - width;

  // define the origin y of the window.
  const y = Graphics.verticalPadding;

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};

/**
 * Gets the currently tracked dia log window.
 * @returns {Window_DiaLog}
 */
Scene_Map.prototype.getDiaLogWindow = function()
{
  return this._j._log._diaLog;
};

/**
 * Set the currently tracked dia log window to the given window.
 * @param {Window_DiaLog} window The window to track.
 */
Scene_Map.prototype.setDiaLogWindow = function(window)
{
  this._j._log._diaLog = window;
};
//endregion dia log

//region loot log
/**
 * Creates the dia log window and adds it to tracking.
 */
Scene_Map.prototype.createLootLogWindow = function()
{
  // create the window.
  const window = this.buildLootLogWindow();

  // update the tracker with the new window.
  this.setLootLogWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the loot log window.
 * @returns {Window_LootLog}
 */
Scene_Map.prototype.buildLootLogWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.lootLogWindowRect();

  // create the window with the rectangle.
  const window = new Window_LootLog(rectangle, $lootLogManager);

  // deselect/deactivate the window so we don't have it look interactable.
  window.deselect();
  window.deactivate();

  // return the built and configured window.
  return window;
};

/**
 * Creates the rectangle representing the window for the loot log.
 * @returns {Rectangle}
 */
Scene_Map.prototype.lootLogWindowRect = function()
{
  // an arbitrary number of rows.
  const rows = 12;

  // define the width of the window.
  const width = 350;

  // define the height of the window.
  const height = (Window_LootLog.rowHeight * (rows)) + 24;

  // define the origin x of the window.
  const x = Graphics.boxWidth - width;

  // define the origin y of the window.
  const y = (Graphics.boxHeight / 2) - (height / 2);

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};

/**
 * Gets the currently tracked loot log window.
 * @returns {Window_LootLog}
 */
Scene_Map.prototype.getLootLogWindow = function()
{
  return this._j._log._diaLog;
};

/**
 * Set the currently tracked loot log window to the given window.
 * @param {Window_LootLog} window The window to track.
 */
Scene_Map.prototype.setLootLogWindow = function(window)
{
  this._j._log._diaLog = window;
};
//endregion loot log
//endregion Scene_Map