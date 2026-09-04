//region Scene_Map dps HUD extensions
import Window_DpsFrame from '../windows/Window_DpsFrame.js';

//region initHudMembers
/**
 * Extends {@link Scene_Map.prototype.initHudMembers}.<br/>
 * Initializes the storage slot for the dps frame window.
 */
J.HUD.EXT.DPS.Aliased.Scene_Map.set('initHudMembers', Scene_Map.prototype.initHudMembers);
Scene_Map.prototype.initHudMembers = function()
{
  // perform original logic.
  J.HUD.EXT.DPS.Aliased.Scene_Map.get('initHudMembers')
    .call(this);

  this._j._hud._dps = {};

  /**
   * The window that displays each battle member's damage output.
   * @type {Window_DpsFrame|null}
   */
  this._j._hud._dps._frame = null;
};
//endregion initHudMembers

//region createAllWindows
/**
 * Extends {@link Scene_Map.prototype.createAllWindows}.<br/>
 * Includes creation of the dps frame window alongside other HUD windows.
 */
J.HUD.EXT.DPS.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.HUD.EXT.DPS.Aliased.Scene_Map.get('createAllWindows')
    .call(this);

  // create and register the dps frame window.
  this.createDpsFrameWindow();
};
//endregion createAllWindows

//region createDpsFrameWindow
/**
 * Creates the dps frame window and adds it to the scene's window registry.
 */
Scene_Map.prototype.createDpsFrameWindow = function()
{
  // build the window.
  const window = this.buildDpsFrameWindow();

  // store a reference for later access.
  this.setDpsFrameWindow(window);

  // register it with the scene so it is drawn each frame.
  this.addWindow(window);
};

/**
 * Builds and configures the dps frame window.
 * @returns {Window_DpsFrame} The fully configured window.
 */
Scene_Map.prototype.buildDpsFrameWindow = function()
{
  // determine the display rectangle.
  const rectangle = this.dpsFrameWindowRect();

  // create the window.
  const window = new Window_DpsFrame(rectangle);

  return window;
};

/**
 * Calculates the rectangle for the dps frame window.
 *
 * All four values come from plugin parameters so the readout can be dragged out of the way of
 * whatever else is being watched without touching source.
 * @returns {Rectangle}
 */
Scene_Map.prototype.dpsFrameWindowRect = function()
{
  const width = J.HUD.EXT.DPS.Metadata.windowWidth;
  const height = J.HUD.EXT.DPS.Metadata.windowHeight;
  const x = J.HUD.EXT.DPS.Metadata.windowX;
  const y = J.HUD.EXT.DPS.Metadata.windowY;

  return new Rectangle(x, y, width, height);
};
//endregion createDpsFrameWindow

//region getDpsFrameWindow / setDpsFrameWindow
/**
 * Gets the currently tracked dps frame window.
 * @returns {Window_DpsFrame|null}
 */
Scene_Map.prototype.getDpsFrameWindow = function()
{
  return this._j._hud._dps._frame;
};

/**
 * Sets the tracked dps frame window to the given instance.
 * @param {Window_DpsFrame} window The window to track.
 */
Scene_Map.prototype.setDpsFrameWindow = function(window)
{
  this._j._hud._dps._frame = window;
};
//endregion getDpsFrameWindow / setDpsFrameWindow
//endregion Scene_Map dps HUD extensions