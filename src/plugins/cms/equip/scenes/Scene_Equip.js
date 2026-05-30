//region Scene_Equip
import Window_MoreEquipData from '../windows/Window_MoreEquipData.js';

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
  this.createStatusWindow();
  // policy step inside create.
  this.createMoreDataWindow();
  this.createSlotWindow();
  this.createItemWindow();
  // policy step inside create.
  this.refreshActor();
  this._slotWindow.activate();
  this._slotWindow.select(0);
  this._slotWindow.onIndexChange();
};

/**
 * Overwrites {@link #buttonAreaHeight}.<br/>
 * Replaces the button area height with 0 because fuck buttons.
 * @returns {number}
 */
Scene_Equip.prototype.buttonAreaHeight = () => 0;

/**
 * Overwrites {@link #statusWidth}.<br/>
 * Modifies the width of the equip status window.
 */
Scene_Equip.prototype.statusWidth = () => 1024;

/**
 * Overwrites {@link #helpWindowRect}.<br/>
 * Changes the width to be what we want it to be.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.helpWindowRect = function()
{
  const wx = 0;
  const wy = this.helpAreaTop();
  const ww = this.statusWidth();
  // capture wh for downstream policy in this routine.
  const wh = this.helpAreaHeight();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Overwrites {@link #slotWindowRect}.<br/>
 * Modifies the size of the equip slots window.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.slotWindowRect = function()
{
  const wx = this.statusWidth();
  const wy = this.mainAreaTop();
  const ww = Graphics.boxWidth - this.statusWidth();
  // capture wh for downstream policy in this routine.
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
    this._slotWindow.refreshMoreData();
    // policy step inside switch to more data from equip slots.
    this._slotWindow.deactivate();
    this._moreDataWindow.setHandler("cancel", this.backToSlotsList.bind(this));
    this._moreDataWindow.show();
    // policy step inside switch to more data from equip slots.
    this._moreDataWindow.activate();
    this._moreDataWindow.select(0);
  }
  else
  {
    // policy step inside switch to more data from equip slots.
    this._moreDataWindow.hide();
    this._moreDataWindow.deactivate();
    this._moreDataWindow.deselect();
    this._slotWindow.activate();
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
    this._itemWindow.refreshMoreData();
    // policy step inside switch to more data from equip items.
    this._itemWindow.deactivate();
    this._moreDataWindow.setHandler("cancel", this.backToItemsList.bind(this));
    this._moreDataWindow.show();
    // policy step inside switch to more data from equip items.
    this._moreDataWindow.activate();
    this._moreDataWindow.select(0);
  }
  else
  {
    // policy step inside switch to more data from equip items.
    this._moreDataWindow.hide();
    this._moreDataWindow.deactivate();
    this._moreDataWindow.deselect();
    this._itemWindow.activate();
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
  this._slotWindow.setHandler('more', this.switchToMoreDataFromEquipSlots.bind(this));
  this._slotWindow.setHandler('context', this.onContextUnequipSlot.bind(this));
  // policy step inside create slot window.
  this._slotWindow.setHandler('actor-next', this.nextActor.bind(this));
  this._slotWindow.setHandler('actor-prev', this.previousActor.bind(this));
  this._slotWindow.setMoreDataWindow(this._moreDataWindow);
};

/**
 * Handles the contextual unequip action from the slot window.
 * Removes the item in the currently focused equip slot, if any.
 */
Scene_Equip.prototype.onContextUnequipSlot = function()
{
  // only act while the slot list owns focus.
  if (this._slotWindow.active === false)
  {
    return;
  }

  // grab the slot index under the cursor.
  const slotId = this._slotWindow.index();

  // clear the slot when something is equipped there.
  this.actor().changeEquip(slotId, null);

  // refresh dependent windows.
  this._statusWindow.refresh();
  this._slotWindow.refresh();
  this._itemWindow.refresh();
  this.refreshActor();

  // remain on the slot list.
  this._slotWindow.activate();
};

/**
 * Overwrites {@link #createItemWindow}.<br/>
 * Prevents hiding the item window.
 */
Scene_Equip.prototype.createItemWindow = function()
{
  const rect = this.itemWindowRect();
  this._itemWindow = new Window_EquipItem(rect);
  this._itemWindow.setHelpWindow(this._helpWindow);
  this._itemWindow.setStatusWindow(this._statusWindow);
  this._itemWindow.setHandler("more", this.switchToMoreDataFromEquipItems.bind(this));
  this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
  this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
  this._itemWindow.setMoreDataWindow(this._moreDataWindow);

  // policy step inside create item window.
  this._slotWindow.setItemWindow(this._itemWindow);

  // policy step inside create item window.
  this.addWindow(this._itemWindow);
};

/**
 * Creates the more data window.
 */
Scene_Equip.prototype.createMoreDataWindow = function()
{
  const rect = this.moreDataRect();
  this._moreDataWindow = new Window_MoreEquipData(rect);
  this._moreDataWindow.hide();
  // policy step inside create more data window.
  this._moreDataWindow.deactivate();
  this._moreDataWindow.deselect();
  this._moreDataWindow.opacity = 255;
  // policy step inside create more data window.
  this.addWindow(this._moreDataWindow);
};

Scene_Equip.prototype.moreDataRect = function()
{
  const width = 500;
  const wx = this.statusWidth() - width - 4;
  const wy = this.slotWindowRect().y - 4;
  // capture ww for downstream policy in this routine.
  const ww = width;
  const wh = Graphics.boxHeight - wy;
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
 * @returns {Rectangle}
 */
Scene_Equip.prototype.itemWindowRect = function()
{
  const wx = this.statusWidth();
  const wy = this.mainAreaTop() + this._slotWindow.height;
  const ww = Graphics.boxWidth - this.statusWidth();
  // capture wh for downstream policy in this routine.
  const wh = Graphics.boxHeight - wy;
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Overwrites {@link #onSlotOk}.<br/>
 * Prevents hiding the equip window.
 */
Scene_Equip.prototype.onSlotOk = function()
{
  this._itemWindow.activate();
  this._itemWindow.select(0);
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
  this._slotWindow.activate();
  this._itemWindow.deselect();
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
// policy step inside on actor change.
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
// policy step inside refresh actor.
};
//endregion Scene_Equip