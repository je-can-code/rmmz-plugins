//region Scene_Map (targeting tick)
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';
import Window_TargetingList from './../windows/Window_TargetingList.js';

/**
 * Extends {@link Scene_Map#createAllWindows}.<br/>
 * Also creates the passive cycle-select list window, hidden until a cycle-mode session begins.
 */
J.ABS.EXT.TARGETING.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.ABS.EXT.TARGETING.Aliased.Scene_Map.get('createAllWindows')
    .call(this);

  // also create the (initially hidden) targeting list window.
  this.createTargetingListWindow();
};

/**
 * Creates the passive list window used by cycle-mode targeting sessions.
 */
Scene_Map.prototype.createTargetingListWindow = function()
{
  const rect = this.targetingListWindowRect();
  this._targetingListWindow = new Window_TargetingList(rect);
  this._targetingListWindow.hide();
  this.addWindow(this._targetingListWindow);
};

/**
 * Determines the shape of the targeting list window. Position is configurable via plugin
 * parameters (defaulting to vertically centered); size is fixed.
 * @returns {Rectangle}
 */
Scene_Map.prototype.targetingListWindowRect = function()
{
  // fixed width; height is half of the original "generous candidate pool" size.
  const width = 240;
  const height = (Graphics.boxHeight - 120) / 2;

  // placement is left to the plugin parameters.
  const { targetingListWindowX: x, targetingListWindowY: y } = J.ABS.EXT.TARGETING.Metadata;

  return new Rectangle(x, y, width, height);
};

/**
 * Extends {@link Scene_Map#update}.<br/>
 * Ticks the targeting manager, then keeps the cycle-mode list window in sync.
 */
J.ABS.EXT.TARGETING.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic (characters, windows, JABS itself, etc).
  J.ABS.EXT.TARGETING.Aliased.Scene_Map.get('update')
    .call(this);

  // whether a session was active before ticking this frame, to detect the begin/end transition.
  const wasActive = this._targetingWasActive === true;

  // tick the targeting manager after everything else has updated for this frame.
  JABS_TargetingManager.update();

  this.updateTargetingListWindow(wasActive);
};

/**
 * Shows/hides/populates the cycle-mode list window based on the targeting manager's state.
 * @param {boolean} wasActive Whether a session was active before this frame's tick.
 */
Scene_Map.prototype.updateTargetingListWindow = function(wasActive)
{
  // `isActive` short-circuits before `cursor.isCycleMode()` ever runs, so `cursor` being null
  // while inactive is never actually dereferenced.
  const isActive = JABS_TargetingManager.isActive();
  const cursor = JABS_TargetingManager.getCursor();
  const isCycleMode = isActive && cursor.isCycleMode();

  if (isCycleMode)
  {
    // populate once, right when the session begins.
    if (!wasActive)
    {
      this._targetingListWindow.setCandidates(cursor.getCandidates());
      this._targetingListWindow.show();
    }

    // keep the highlight in sync with the manager's current cycle position every frame.
    this._targetingListWindow.select(cursor.getSelectedIndex());
  }
  else if (this._targetingListWindow.visible)
  {
    this._targetingListWindow.hide();
  }

  this._targetingWasActive = isActive;
};
//endregion Scene_Map (targeting tick)
