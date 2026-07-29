//region Scene_Equip
import Window_MoreEquipData from '../windows/Window_MoreEquipData.js';
import Window_EquipActorRibbon from '../windows/Window_EquipActorRibbon.js';
import Window_EquipControlsHint from '../windows/Window_EquipControlsHint.js';

/**
 * Initializes this scene.
 */
Scene_Equip.prototype.initialize = function()
{
  Scene_MenuBase.prototype.initialize.call(this);
  this._j = this._j || {};
  this._j.moreVisible = false;
};

/**
 * Overwrites {@link #createButtons}.<br/>
 * Removes the buttons because fuck the buttons.
 */
Scene_Equip.prototype.createButtons = function()
{
};

/**
 * Overwrites {@link #create}.<br/>
 * Removes the command window, because who even uses optimize?
 */
Scene_Equip.prototype.create = function()
{
  Scene_MenuBase.prototype.create.call(this);
  this.createHelpWindow();
  this.createActorRibbonWindow();
  this.createControlsHintWindow();
  this.createStatusWindow();
  this.createMoreDataWindow();
  this.createSlotWindow();
  this.createItemWindow();
  this.refreshActor();
  this.slotWindow().activate();
  this.slotWindow().select(0);
  this.slotWindow().onIndexChange();
};

/**
 * Overwrites {@link #buttonAreaHeight}.<br/>
 * Replaces the button area height with 0 because fuck buttons.
 * @returns {number}
 */
Scene_Equip.prototype.buttonAreaHeight = () => 0;

/**
 * Overwrites {@link #statusWidth}.<br/>
 * Modifies the width of the equip status window — whatever {@link #rightColumnWidth} trims off
 * the right-hand column (slot/item lists + controls hint) flows into this column instead, since
 * the parameter grid is the one that actually needs the room.
 * @returns {number}
 */
Scene_Equip.prototype.statusWidth = function()
{
  return Graphics.boxWidth - this.rightColumnWidth();
};

/**
 * The width of the right-hand column (slot list, item list, controls hint). Trimmed to ~70% of
 * its original width (the full remainder past the old fixed 1024px status column) — still plenty
 * of room for the controls hint text and the widest equipment names, without hogging space the
 * parameter grid needs more.
 * @returns {number}
 */
Scene_Equip.prototype.rightColumnWidth = function()
{
  const originalRightWidth = Graphics.boxWidth - 1024;
  return Math.round(originalRightWidth * 0.7);
};

/**
 * Overwrites {@link #helpWindowRect}.<br/>
 * Stretches the help window across the full screen width along the bottom, instead of only the
 * status column, since it's the one window in this scene that isn't scoped to either column.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.helpWindowRect = function()
{
  const wx = 0;
  const wy = this.helpAreaTop();
  const ww = Graphics.boxWidth;
  const wh = this.helpAreaHeight();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The height of a one-line top row (actor ribbon on the left, controls hint on the right).
 * @returns {number}
 */
Scene_Equip.prototype.topRowHeight = function()
{
  return this.calcWindowHeight(1, false);
};

/**
 * Gets the rectangle that defines the shape of the actor ribbon window.
 * Spans the full width of the status column.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.actorRibbonRect = function()
{
  const wx = 0;
  const wy = this.mainAreaTop();
  const ww = this.statusWidth();
  const wh = this.topRowHeight();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Gets the rectangle that defines the shape of the controls hint window.
 * Sits directly above the slot window, since that's what its legend describes.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.controlsHintRect = function()
{
  const wx = this.statusWidth();
  const wy = this.mainAreaTop();
  const ww = Graphics.boxWidth - this.statusWidth();
  const wh = this.topRowHeight();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Creates the actor ribbon window.
 */
Scene_Equip.prototype.createActorRibbonWindow = function()
{
  const rect = this.actorRibbonRect();
  this.setActorRibbonWindow(new Window_EquipActorRibbon(rect));
  this.addWindow(this.actorRibbonWindow());
};

/**
 * Creates the controls hint window.
 */
Scene_Equip.prototype.createControlsHintWindow = function()
{
  const rect = this.controlsHintRect();
  this.setControlsHintWindow(new Window_EquipControlsHint(rect));
  this.controlsHintWindow().refresh();
  this.addWindow(this.controlsHintWindow());
};

/**
 * Overwrites {@link #statusWindowRect}.<br/>
 * Shrinks the status window to start below the actor-ribbon row instead of carving out space for
 * a portrait internally.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.statusWindowRect = function()
{
  const wx = 0;
  const wy = this.mainAreaTop() + this.topRowHeight();
  const ww = this.statusWidth();
  const wh = this.mainAreaHeight() - this.topRowHeight();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Overwrites {@link #slotWindowRect}.<br/>
 * Modifies the size of the equip slots window, starting below the controls hint row.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.slotWindowRect = function()
{
  const wx = this.statusWidth();
  const wy = this.mainAreaTop() + this.topRowHeight();
  const ww = Graphics.boxWidth - this.statusWidth();
  const wh = this.slotWindowHeight(6);
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Calculates the slot window height based on slot count.
 * @param {number} equipSlotCount The number of slots.
 * @returns {number} The calculated height for the slot window.
 */
Scene_Equip.prototype.slotWindowHeight = equipSlotCount => 48 * equipSlotCount;

/**
 * Toggles the visibility of the "more" window.
 */
Scene_Equip.prototype.switchToMoreDataFromEquipSlots = function()
{
  this._j.moreVisible = !this._j.moreVisible;
  if (this._j.moreVisible)
  {
    this.slotWindow().refreshMoreData();
    this.slotWindow().deactivate();
    this._moreDataWindow.setHandler("cancel", this.backToSlotsList.bind(this));
    this._moreDataWindow.show();
    this._moreDataWindow.activate();
    this._moreDataWindow.select(0);
  }
  else
  {
    this._moreDataWindow.hide();
    this._moreDataWindow.deactivate();
    this._moreDataWindow.deselect();
    this.slotWindow().activate();
  }
};

/**
 * Toggles the visibility of the "more" window.
 */
Scene_Equip.prototype.switchToMoreDataFromEquipItems = function()
{
  this._j.moreVisible = !this._j.moreVisible;
  if (this._j.moreVisible)
  {
    this.itemWindow().refreshMoreData();
    this.itemWindow().deactivate();
    this._moreDataWindow.setHandler("cancel", this.backToItemsList.bind(this));
    this._moreDataWindow.show();
    this._moreDataWindow.activate();
    this._moreDataWindow.select(0);
  }
  else
  {
    this._moreDataWindow.hide();
    this._moreDataWindow.deactivate();
    this._moreDataWindow.deselect();
    this.itemWindow().activate();
  }
};

/**
 * Extends the slot window to include our additional actions.
 */
J.CMS_E.Aliased.Scene_Equip.set('createSlotWindow', Scene_Equip.prototype.createSlotWindow);
Scene_Equip.prototype.createSlotWindow = function()
{
  // perform original logic.
  J.CMS_E.Aliased.Scene_Equip.get('createSlotWindow').call(this);
  this.slotWindow().setHandler('more', this.switchToMoreDataFromEquipSlots.bind(this));
  this.slotWindow().setHandler('context', this.onContextUnequipSlot.bind(this));
  this.slotWindow().setHandler('actor-next', this.nextActor.bind(this));
  this.slotWindow().setHandler('actor-prev', this.previousActor.bind(this));
  this.slotWindow().setMoreDataWindow(this._moreDataWindow);
};

/**
 * Handles the contextual unequip action from the slot window.
 * Removes the item in the currently focused equip slot, if any.
 */
Scene_Equip.prototype.onContextUnequipSlot = function()
{
  // only act while the slot list owns focus.
  if (this.slotWindow().active === false)
  {
    return;
  }

  // grab the slot index under the cursor.
  const slotId = this.slotWindow().index();

  // clear the slot when something is equipped there.
  this.actor().changeEquip(slotId, null);

  // refresh dependent windows.
  this.statusWindow().refresh();
  this.slotWindow().refresh();
  this.itemWindow().refresh();
  this.refreshActor();

  // remain on the slot list.
  this.slotWindow().activate();
};

/**
 * Overwrites {@link #createItemWindow}.<br/>
 * Prevents hiding the item window.
 */
Scene_Equip.prototype.createItemWindow = function()
{
  const rect = this.itemWindowRect();
  this.setItemWindow(new Window_EquipItem(rect));
  this.itemWindow().setHelpWindow(this.helpWindow());
  this.itemWindow().setStatusWindow(this.statusWindow());
  this.itemWindow().setHandler("more", this.switchToMoreDataFromEquipItems.bind(this));
  this.itemWindow().setHandler("ok", this.onItemOk.bind(this));
  this.itemWindow().setHandler("cancel", this.onItemCancel.bind(this));
  this.itemWindow().setMoreDataWindow(this._moreDataWindow);

  this.slotWindow().setItemWindow(this.itemWindow());

  this.addWindow(this.itemWindow());
};

/**
 * Creates the more data window.
 */
Scene_Equip.prototype.createMoreDataWindow = function()
{
  const rect = this.moreDataRect();
  this._moreDataWindow = new Window_MoreEquipData(rect);
  this._moreDataWindow.hide();
  this._moreDataWindow.deactivate();
  this._moreDataWindow.deselect();
  this._moreDataWindow.opacity = 255;
  this.addWindow(this._moreDataWindow);
};

Scene_Equip.prototype.moreDataRect = function()
{
  const width = 500;
  const wx = this.statusWidth() - width - 4;
  const wy = this.slotWindowRect().y - 4;
  const ww = width;
  const wh = this.mainAreaBottom() - wy;
  return new Rectangle(wx, wy, ww, wh);
};

Scene_Equip.prototype.backToSlotsList = function()
{
  this.switchToMoreDataFromEquipSlots();
};

Scene_Equip.prototype.backToItemsList = function()
{
  this.switchToMoreDataFromEquipItems();
};

/**
 * Gets the rectangle that defines the shape of this window.
 * Starts below the slot window and stops above the bottom help window, so it never runs behind it.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.itemWindowRect = function()
{
  const wx = this.statusWidth();
  const wy = this.slotWindowRect().y + this.slotWindow().height;
  const ww = Graphics.boxWidth - this.statusWidth();
  const wh = this.mainAreaBottom() - wy;
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Overwrites {@link #onSlotOk}.<br/>
 * Prevents hiding the equip window.
 */
Scene_Equip.prototype.onSlotOk = function()
{
  this.itemWindow().activate();
  this.itemWindow().select(0);
};

/**
 * Overwrites {@link #onSlotCancel}.<br/>
 * Replaces the slot cancel functionality with the end of the scene.
 */
Scene_Equip.prototype.onSlotCancel = function()
{
  this.popScene();
};

/**
 * Overwrites {@link #hideItemWindow}.<br/>
 * Prevents hiding the item window.
 */
Scene_Equip.prototype.hideItemWindow = function()
{
  this.slotWindow().activate();
  this.itemWindow().deselect();
};

/**
 * Overwrites {@link #onActorChange}.<br/>
 * Prevents trying to activate a window that was removed from the scene.
 */
Scene_Equip.prototype.onActorChange = function()
{
  Scene_MenuBase.prototype.onActorChange.call(this);
  this.refreshActor();
  this.hideItemWindow();
};

/**
 * Extends the actor refresh to include the more data window.
 */
J.CMS_E.Aliased.Scene_Equip.set('refreshActor', Scene_Equip.prototype.refreshActor);
Scene_Equip.prototype.refreshActor = function()
{
  // perform original logic.
  J.CMS_E.Aliased.Scene_Equip.get('refreshActor').call(this);
  const actor = this.actor();
  this._moreDataWindow.setActor(actor);
  this.actorRibbonWindow().setActor(actor);
};

//region properties
/**
 * Gets the actor ribbon window.
 * @returns {Window_Base} The actorRibbonWindow.
 */
Scene_Equip.prototype.actorRibbonWindow = function()
{
  // hand back the actor ribbon window.
  return this._actorRibbonWindow;
};

/**
 * Sets the actor ribbon window.
 * @param {Window_Base} newActorRibbonWindow The new actorRibbonWindow.
 */
Scene_Equip.prototype.setActorRibbonWindow = function(newActorRibbonWindow)
{
  // assign the actor ribbon window.
  this._actorRibbonWindow = newActorRibbonWindow;
};

/**
 * Gets the controls hint window.
 * @returns {Window_Base} The controlsHintWindow.
 */
Scene_Equip.prototype.controlsHintWindow = function()
{
  // hand back the controls hint window.
  return this._controlsHintWindow;
};

/**
 * Sets the controls hint window.
 * @param {Window_Base} newControlsHintWindow The new controlsHintWindow.
 */
Scene_Equip.prototype.setControlsHintWindow = function(newControlsHintWindow)
{
  // assign the controls hint window.
  this._controlsHintWindow = newControlsHintWindow;
};
//endregion properties
//endregion Scene_Equip