//region Scene_Map food HUD extensions
import Window_FoodFrame from '../windows/Window_FoodFrame.js';

//region initHudMembers
/**
 * Extends {@link Scene_Map.prototype.initHudMembers}.<br>
 * Initializes the storage slot for the food frame window.
 */
J.HUD.EXT.FOOD.Aliased.Scene_Map.set('initHudMembers', Scene_Map.prototype.initHudMembers);
Scene_Map.prototype.initHudMembers = function()
{
  // perform original logic.
  J.HUD.EXT.FOOD.Aliased.Scene_Map.get('initHudMembers').call(this);

  this._j._hud._food = {};

  /**
   * The window that displays the leader's active food chain status.
   * @type {Window_FoodFrame|null}
   */
  this._j._hud._food._frame = null;
};
//endregion initHudMembers

//region createAllWindows
/**
 * Extends {@link Scene_Map.prototype.createAllWindows}.<br>
 * Includes creation of the food frame window alongside other HUD windows.
 */
J.HUD.EXT.FOOD.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.HUD.EXT.FOOD.Aliased.Scene_Map.get('createAllWindows').call(this);

  // create and register the food frame window.
  this.createFoodFrameWindow();
};
//endregion createAllWindows

//region createFoodFrameWindow
/**
 * Creates the food frame window and adds it to the scene's window registry.
 */
Scene_Map.prototype.createFoodFrameWindow = function()
{
  // build the window.
  const window = this.buildFoodFrameWindow();

  // store a reference for later access.
  this.setFoodFrameWindow(window);

  // register it with the scene so it is drawn each frame.
  this.addWindow(window);
};

/**
 * Builds and configures the food frame window.
 * @returns {Window_FoodFrame} The fully configured window.
 */
Scene_Map.prototype.buildFoodFrameWindow = function()
{
  // determine the display rectangle.
  const rectangle = this.foodFrameWindowRect();

  // create the window.
  const window = new Window_FoodFrame(rectangle);

  return window;
};

/**
 * Calculates the rectangle for the food frame window.
 * Width and height come from plugin parameters. Height only affects how many
 * chain state labels are visible; icon and bar size are fixed in {@link Window_FoodFrame}.
 * @returns {Rectangle}
 */
Scene_Map.prototype.foodFrameWindowRect = function()
{
  // wide enough for the bar column and full chain state names (see windowWidth parameter).
  const width = J.HUD.EXT.FOOD.Metadata.windowWidth;

  // total height; extra pixels only add visible chain-state label rows (see windowHeight parameter).
  const height = J.HUD.EXT.FOOD.Metadata.windowHeight;

  // x/y come from plugin parameters so Jeremy can reposition without touching source.
  const x = J.HUD.EXT.FOOD.Metadata.windowX;
  const y = J.HUD.EXT.FOOD.Metadata.windowY;

  return new Rectangle(x, y, width, height);
};
//endregion createFoodFrameWindow

//region getFoodFrameWindow / setFoodFrameWindow
/**
 * Gets the currently tracked food frame window.
 * @returns {Window_FoodFrame|null}
 */
Scene_Map.prototype.getFoodFrameWindow = function()
{
  return this._j._hud._food._frame;
};

/**
 * Sets the tracked food frame window to the given instance.
 * @param {Window_FoodFrame} window The window to track.
 */
Scene_Map.prototype.setFoodFrameWindow = function(window)
{
  this._j._hud._food._frame = window;
};
//endregion getFoodFrameWindow / setFoodFrameWindow

//region postPartyCycling hook
/**
 * Extends {@link JABS_Engine.prototype.postPartyCycling}.<br>
 * Refreshes the food frame window whenever the party leader changes so that
 * the displayed chain arc reflects the new leader's state.
 */
J.HUD.EXT.FOOD.Aliased.JABS_Engine.set('postPartyCycling', JABS_Engine.prototype.postPartyCycling);
JABS_Engine.prototype.postPartyCycling = function()
{
  // perform original logic (sets requestPartyRotation / requestSpriteRefresh flags).
  J.HUD.EXT.FOOD.Aliased.JABS_Engine.get('postPartyCycling').call(this);

  // signal that the food frame needs a refresh on the next scene update.
  this.requestFoodFrameRefresh = true;
};
//endregion postPartyCycling hook

//region updateHudFrames
/**
 * Extends {@link Scene_Map.prototype.updateHudFrames}.<br>
 * Handles the food frame refresh request each frame.
 */
J.HUD.EXT.FOOD.Aliased.Scene_Map.set('updateHudFrames', Scene_Map.prototype.updateHudFrames);
Scene_Map.prototype.updateHudFrames = function()
{
  // perform original logic.
  J.HUD.EXT.FOOD.Aliased.Scene_Map.get('updateHudFrames').call(this);

  // process any pending food frame refresh.
  this.handleFoodFrameRefresh();
};
//endregion updateHudFrames

//region handleFoodFrameRefresh
/**
 * If the engine has requested a food frame refresh, performs it and clears the flag.
 */
Scene_Map.prototype.handleFoodFrameRefresh = function()
{
  // check if a refresh was requested (party cycle or explicit signal).
  if (!$jabsEngine.requestFoodFrameRefresh) return;

  // refresh the food frame so the new leader's chain is shown.
  const foodFrame = this.getFoodFrameWindow();
  if (foodFrame) foodFrame.refresh();

  // acknowledge the request.
  $jabsEngine.requestFoodFrameRefresh = false;
};
//endregion handleFoodFrameRefresh
//endregion Scene_Map food HUD extensions