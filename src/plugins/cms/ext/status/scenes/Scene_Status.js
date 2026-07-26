//region Scene_Status
import Window_StatusPageHint from '../windows/Window_StatusPageHint.js';
import Window_StatusParameters from '../windows/Window_StatusParameters.js';
import Window_StatusStatBreakdown from '../windows/Window_StatusStatBreakdown.js';
import Window_StatusStatList from '../windows/Window_StatusStatList.js';

/**
 * Overwrites {@link #createButtons}.<br/>
 * Removes buttons because fuck the buttons.
 */
Scene_Status.prototype.createButtons = function()
{
};

/**
 * Overwrites {@link #create}.<br/>
 * Creates all windows and initializes state.
 */
Scene_Status.prototype.create = function()
{
  // perform base create.
  Scene_MenuBase.prototype.create.call(this);

  // initialize members/state.
  this.initMembers();

  // create Page 1 windows.
  this.createStatusWindow();
  this.createStatusParamsWindow();
  this.createStatusEquipWindow();

  // create Page 2 windows.
  this.createStatListWindow();
  this.createStatBreakdownWindow();

  // create the bottom-centered hint window (visible on both pages).
  this.createStatusHintWindow();

  // apply initial page visibility and activation.
  this.applyPageVisibility();
};

//region init
/**
 * Initializes all members and namespaced state for this scene.
 */
Scene_Status.prototype.initMembers = function()
{
  // ensure root namespaces for this scene branch.
  if (!this._j) this._j = {};
  if (!this._j._cms_s) this._j._cms_s = {};
  if (!this._j._cms_s._status) this._j._cms_s._status = {};

  // initialize window references.
  this._j._cms_s._status._windows = {
    _status: null,
    _params: null,
    _equip: null,
    _list: null,
    _breakdown: null,
    _hint: null,
  };

  // initialize state.
  this._j._cms_s._status._state = {
    _pageIndex: 0,
    _lastDir4: 0,
    _switchCooldown: 0,
  };
};
//endregion init

//region accessors (windows)
Scene_Status.prototype.getStatusWindow = function()
{
  return this._j._cms_s._status._windows._status;
};

Scene_Status.prototype.setStatusWindow = function(v)
{
  this._j._cms_s._status._windows._status = v;
};

Scene_Status.prototype.getParamsWindow = function()
{
  return this._j._cms_s._status._windows._params;
};

Scene_Status.prototype.setParamsWindow = function(v)
{
  this._j._cms_s._status._windows._params = v;
};

Scene_Status.prototype.getEquipWindow = function()
{
  return this._j._cms_s._status._windows._equip;
};

Scene_Status.prototype.setEquipWindow = function(v)
{
  this._j._cms_s._status._windows._equip = v;
};

Scene_Status.prototype.getStatListWindow = function()
{
  return this._j._cms_s._status._windows._list;
};

Scene_Status.prototype.setStatListWindow = function(v)
{
  this._j._cms_s._status._windows._list = v;
};

Scene_Status.prototype.getStatBreakdownWindow = function()
{
  return this._j._cms_s._status._windows._breakdown;
};

Scene_Status.prototype.setStatBreakdownWindow = function(v)
{
  this._j._cms_s._status._windows._breakdown = v;
};

Scene_Status.prototype.getStatusHintWindow = function()
{
  return this._j._cms_s._status._windows._hint;
};

Scene_Status.prototype.setStatusHintWindow = function(v)
{
  this._j._cms_s._status._windows._hint = v;
};
//endregion accessors (windows)

//region accessors (state)
Scene_Status.prototype.getPageIndex = function()
{
  return this._j._cms_s._status._state._pageIndex | 0;
};

Scene_Status.prototype.setPageIndex = function(v)
{
  this._j._cms_s._status._state._pageIndex = v | 0;
};

Scene_Status.prototype.getLastDir4 = function()
{
  return this._j._cms_s._status._state._lastDir4 | 0;
};

Scene_Status.prototype.setLastDir4 = function(v)
{
  this._j._cms_s._status._state._lastDir4 = v | 0;
};

Scene_Status.prototype.getSwitchCooldown = function()
{
  return this._j._cms_s._status._state._switchCooldown | 0;
};

Scene_Status.prototype.setSwitchCooldown = function(v)
{
  const frames = v | 0;
  this._j._cms_s._status._state._switchCooldown = Math.max(0, frames);
};
//endregion accessors (state)

/**
 * Overwrites {@link #refreshActor}.<br/>
 * Refresh all windows.
 */
Scene_Status.prototype.refreshActor = function()
{
  const actor = this.actor();
  this.getStatusWindow()
    .setActor(actor);
  this.getParamsWindow()
    .setActor(actor);
  this.getEquipWindow()
    .setActor(actor);

  // grab the window handles for reference.
  const list = this.getStatListWindow();
  const breakdown = this.getStatBreakdownWindow();

  // also set the actor on the list.
  list.setActor(actor);

  // also set the actor on the breakdown.
  breakdown.setContext(actor, list.currentParameterKey());
};

/**
 * Overwrites {@link #onActorChange}.<br/>
 * Vanilla activates {@link this._statusWindow}, which CMS does not use.
 * Refresh all CMS windows and restore focus for the active page.
 */
Scene_Status.prototype.onActorChange = function()
{
  Scene_MenuBase.prototype.onActorChange.call(this);
  this.refreshActor();
  this.applyPageVisibility();
};

//region rect helpers
/**
 * Width of the stacked actor + equip column on the left edge of Page 1.
 * @returns {number}
 */
Scene_Status.prototype.statusLeftColumnWidth = function()
{
  // ~25% narrower than the original 30% column — reclaimed width goes to the stat grid.
  return Math.round(Graphics.boxWidth * 0.225);
};

/**
 * The rectangle for the status window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusWindowRect = function()
{
  const wx = 0;
  const wy = 0;
  const ww = this.statusLeftColumnWidth();
  const wh = Math.round(Graphics.boxHeight * 0.6);
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the equip window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusEquipWindowRect = function()
{
  const wx = 0;
  const wy = this.getStatusWindow().height;
  const ww = this.statusLeftColumnWidth();
  const wh = Math.round(Graphics.boxHeight * 0.4);
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the parameters window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusParamsWindowRect = function()
{
  const leftColumnWidth = this.statusLeftColumnWidth();

  // sit flush against the narrowed actor column.
  const wx = leftColumnWidth;

  // compute the vertical offset from the hint’s height.
  const hintRect = this.statusHintWindowRect();
  const wy = hintRect.height;

  // span the remainder of the screen to the right edge.
  const ww = Graphics.boxWidth - leftColumnWidth;

  // fill remaining height beneath the hint.
  const wh = Graphics.boxHeight - wy;

  // border-to-border placement.
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the stat list window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusStatListWindowRect = function()
{
  const leftColumnWidth = this.statusLeftColumnWidth();

  // start exactly after the left column.
  const wx = leftColumnWidth;

  // align directly under the hint (no top gap).
  const hintRect = this.statusHintWindowRect();
  const wy = hintRect.height;

  // arbitrary width.
  const ww = 440;

  // height fills the remaining space below the hint.
  const wh = Graphics.boxHeight - wy;
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the stat breakdown window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusStatBreakdownWindowRect = function()
{
  // grab the list for relative positioning.
  const list = this.statusStatListWindowRect();

  // start at the list’s right edge.
  const wx = list.x + list.width;

  // align directly under the hint.
  const wy = this.statusHintWindowRect().height;

  // use the remaining width to the right;
  const ww = Graphics.boxWidth - wx;

  // fill the rest of the screen below the hint.
  const wh = Graphics.boxHeight - wy;
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the hint window.
 * @returns {Rectangle}
 */
Scene_Status.prototype.statusHintWindowRect = function()
{
  const leftColumnWidth = this.statusLeftColumnWidth();

  // start the hint immediately after the left column.
  const wx = leftColumnWidth;

  // arbitrary y.
  const wy = 0;

  // the hint spans the remainder of the screen to the right.
  const ww = Graphics.boxWidth - wx;

  // arbitrary height.
  const wh = 60;

  return new Rectangle(wx, wy, ww, wh);
};
//endregion rect helpers

//region create
/**
 * Creates the status window and configures it.
 */
Scene_Status.prototype.createStatusWindow = function()
{
  const rect = this.statusWindowRect();
  const win = new Window_Status(rect);
  this.setStatusWindow(win);
  this.addWindow(win);
};

/**
 * Creates the parameters window and configures it.
 */
Scene_Status.prototype.createStatusParamsWindow = function()
{
  const rect = this.statusParamsWindowRect();
  const win = new Window_StatusParameters(rect);
  this.setParamsWindow(win);
  this.addWindow(win);
};

/**
 * Creates the equipment window and configures it.
 */
Scene_Status.prototype.createStatusEquipWindow = function()
{
  const rect = this.statusEquipWindowRect();
  const win = new Window_StatusEquip(rect);
  this.setEquipWindow(win);
  this.addWindow(win);
};

/**
 * Creates the stat list window and configures it.
 */
Scene_Status.prototype.createStatListWindow = function()
{
  const rect = this.statusStatListWindowRect();
  const list = new Window_StatusStatList(rect);
  this.setStatListWindow(list);
  list.setActor(this.actor());
  list.setChangeHandler(this.onStatListChanged.bind(this));
  this.addWindow(list);
};

/**
 * Creates the stat breakdown window and configures it.
 */
Scene_Status.prototype.createStatBreakdownWindow = function()
{
  const rect = this.statusStatBreakdownWindowRect();
  const breakdown = new Window_StatusStatBreakdown(rect);
  this.setStatBreakdownWindow(breakdown);
  breakdown.setContext(this.actor(), 'mhp');
  this.addWindow(breakdown);
};

/**
 * Creates the bottom-centered hint window.
 */
Scene_Status.prototype.createStatusHintWindow = function()
{
  // build the hint rect.
  const rect = this.statusHintWindowRect();

  // create the hint window.
  const hint = new Window_StatusPageHint(rect);

  // store reference.
  this.setStatusHintWindow(hint);

  // add to the scene.
  this.addWindow(hint);
};
//endregion create

//region page switching + visibility
/**
 * An event that fires when the selected stat changes in the list window.
 */
Scene_Status.prototype.onStatListChanged = function()
{
  // if there is no index, don't execute the on-change event.
  if (this.getPageIndex() !== 1) return;

  // grab the selected long param id.
  const parameterKey = this.getStatListWindow()
    .currentParameterKey();

  // update the context of the breakdown window.
  this.getStatBreakdownWindow()
    .setContext(this.actor(), parameterKey);
};

/**
 * Applies visibility to the windows based on the current page index.
 */
Scene_Status.prototype.applyPageVisibility = function()
{
  // determine which page is currently active.
  const isPage1 = this.getPageIndex() === 0;
  const isPage2 = this.getPageIndex() === 1;

  // always show the left-side status and equip windows on both pages.
  this.getStatusWindow().visible = true;
  this.getEquipWindow().visible = true;

  // toggle the right-hand content by page.
  this.getParamsWindow().visible = isPage1;

  this.getStatBreakdownWindow().visible = isPage2;

  // keep the hint visible on both pages.
  this.getStatusHintWindow().visible = true;

  const listWindow = this.getStatListWindow();
  listWindow.visible = isPage2;

  // manage activation for the selectable list only when Page 2 is active.
  if (isPage1)
  {
    // deactivate the list window for page 1.
    listWindow.deactivate();
  }
  else
  {
    // activate the list window for page 2.
    listWindow.activate();

    // autoselect the first item in the list of we haven't selected anything yet.
    if (listWindow.index() === -1)
    {
      listWindow.select(0);
    }
  }
};
//endregion page switching + visibility

//region update
/**
 * Extends {@link #update}.<br/>
 * Also handles page switching and cooldowns.
 */
J.CMS_S.Aliased.Scene_Status.set('update', Scene_Status.prototype.update);
Scene_Status.prototype.update = function()
{
  // perform original logic.
  J.CMS_S.Aliased.Scene_Status.get('update')
    .call(this);

  // watch for the cancel button, it leaves the scene.
  if (Input.isTriggered('cancel'))
  {
    this.popScene();
    return;
  }

  // also update the page switch cooldown.
  this.updatePageSwitchCooldown();
};

/**
 * Updates the page switch cooldown.
 */
Scene_Status.prototype.updatePageSwitchCooldown = function()
{
  // decrement the switch cooldown if any.
  const cooldown = this.getSwitchCooldown();

  // check if we need to cool down.
  if (cooldown > 0)
  {
    // decrement the cooldown.
    const nextFrames = cooldown - 1;

    // update the cooldown.
    this.setSwitchCooldown(nextFrames);

    // stop processing.
    return;
  }

  // handle normalized menu input when not cooling down.
  if (this.getSwitchCooldown() === 0)
  {
    this.handleNormalizedStatusInput();
  }
};

/**
 * Handles L2/R2 page switching and L1/R1 actor cycling for the status scene.
 * Page 1 has no active selectable window, so this lives at scene scope.
 */
Scene_Status.prototype.handleNormalizedStatusInput = function()
{
  let handled = false;

  // L2 or R2 flips between the overview grid and the stat breakdown list.
  if (Input.isTriggered('l2') || Input.isTriggered('r2'))
  {
    const next = (this.getPageIndex() + 1) % 2;
    this.setPageIndex(next);
    this.applyPageVisibility();
    this.onStatListChanged();
    handled = true;
  }

  // L1 / R1 cycle the viewed party member.
  if (Input.isTriggered('pageup'))
  {
    this.previousActor();
    handled = true;
  }

  if (Input.isTriggered('pagedown'))
  {
    this.nextActor();
    handled = true;
  }

  if (handled)
  {
    this.setSwitchCooldown(12);
  }
};
//endregion update
//endregion Scene_Status