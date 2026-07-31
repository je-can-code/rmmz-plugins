//region Scene_Equip
import Window_MoreEquipData from '../windows/Window_MoreEquipData.js';
import Window_EquipActorRibbon from '../windows/Window_EquipActorRibbon.js';

/**
 * Re-parents the engine's equip scene onto the shared actor facet skeleton.
 *
 * This scene is one of RPG Maker's own, declared as a function with a hand-built prototype chain, so
 * there is no `extends` clause to change. Re-pointing that chain is real inheritance all the same: the
 * base's rect math and ribbon handling arrive as inherited methods, `super` inside them still resolves
 * correctly, this file's own definitions still shadow anything they mean to override, and the scene
 * remains an instance of {@link Scene_MenuBase} for everything that checks.
 *
 * The base's chain already includes `Scene_MenuBase`, so nothing is lost by pointing at it instead.
 */
Object.setPrototypeOf(Scene_Equip.prototype, Scene_ActorFacetBase.prototype);

/**
 * Initializes this scene.
 */
Scene_Equip.prototype.initialize = function()
{
  // reach the facet skeleton's initialize rather than Scene_MenuBase's directly, so that its own
  // members- the legend and ribbon trackers- get seeded along with this scene's.
  Scene_ActorFacetBase.prototype.initialize.call(this);
};

/**
 * Extends {@link Scene_ActorFacetBase.initMembers}.<br/>
 * Also initializes this scene's own members.
 */
Scene_Equip.prototype.initMembers = function()
{
  // perform original logic, which seeds the shared namespace and the facet skeleton's members.
  Scene_ActorFacetBase.prototype.initMembers.call(this);

  /**
   * Whether the extended equipment detail panel is currently showing.
   * @type {boolean}
   */
  this._j._moreVisible = false;

  /**
   * The panel showing the extended data of the highlighted equipment.
   * @type {Window_MoreEquipData|null}
   */
  this._j._moreDataWindow = null;
};

/**
 * Gets whether the extended equipment detail panel is currently showing.
 * @returns {boolean}
 */
Scene_Equip.prototype.moreVisible = function()
{
  return this._j._moreVisible;
};

/**
 * Sets whether the extended equipment detail panel is currently showing.
 * @param {boolean} moreVisible Whether the panel is showing.
 */
Scene_Equip.prototype.setMoreVisible = function(moreVisible)
{
  this._j._moreVisible = moreVisible;
};

/**
 * Gets the panel showing the extended data of the highlighted equipment.
 * @returns {Window_MoreEquipData}
 */
Scene_Equip.prototype.moreDataWindow = function()
{
  return this._j._moreDataWindow;
};

/**
 * Sets the panel showing the extended data of the highlighted equipment.
 * @param {Window_MoreEquipData} window The window to track.
 */
Scene_Equip.prototype.setMoreDataWindow = function(window)
{
  this._j._moreDataWindow = window;
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
  // the facet skeleton builds the control legend and the actor ribbon.
  Scene_ActorFacetBase.prototype.create.call(this);

  this.createHelpWindow();
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
  return this.contentAreaRect().width - this.rightColumnWidth();
};

/**
 * The proportion of the region given to the right-hand column of slot and item lists.
 * @returns {number}
 */
Scene_Equip.prototype.rightColumnRatio = function()
{
  return 0.32;
};

/**
 * The width of the right-hand column (slot list, item list). Deliberately the smaller share- it holds
 * equipment names, while the parameter grid beside it holds everything those names change.
 * @returns {number}
 */
Scene_Equip.prototype.rightColumnWidth = function()
{
  return Math.round(this.contentAreaRect().width * this.rightColumnRatio());
};

/**
 * Overrides {@link Scene_ActorFacetBase.buildActorRibbonWindow}.<br/>
 * Supplies the equip ribbon; the base decides where it sits and how tall it is.
 * @param {Rectangle} rectangle The rectangle to build the window within.
 * @returns {Window_EquipActorRibbon}
 */
Scene_Equip.prototype.buildActorRibbonWindow = function(rectangle)
{
  return new Window_EquipActorRibbon(rectangle);
};

/**
 * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
 * Describes the controls this scene responds to.
 *
 * These are semantics rather than glyphs, so the legend can draw whichever device the player is holding.
 * @returns {{semantic: (string|string[]), label: string}[]}
 */
Scene_Equip.prototype.controlLegendEntries = function()
{
  return [
    {
      semantic: 'ok',
      label: 'equip',
    },
    {
      semantic: 'context',
      label: 'unequip',
    },
    {
      semantic: [ 'actor-prev', 'actor-next' ],
      label: 'switch character',
    },
    {
      semantic: 'cancel',
      label: 'back',
    },
  ];
};

/**
 * Overwrites {@link #statusWindowRect}.<br/>
 * Shrinks the status window to start below the actor-ribbon row instead of carving out space for
 * a portrait internally.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.statusWindowRect = function()
{
  // the region the base leaves beneath the ribbon.
  const contentArea = this.contentAreaRect();

  return new Rectangle(contentArea.x, contentArea.y, this.statusWidth(), contentArea.height);
};

/**
 * Overwrites {@link #slotWindowRect}.<br/>
 * Modifies the size of the equip slots window, starting below the controls hint row.
 * @returns {Rectangle}
 */
Scene_Equip.prototype.slotWindowRect = function()
{
  // sit at the top of the right column, beside the parameter grid.
  const contentArea = this.contentAreaRect();

  return new Rectangle(
    contentArea.x + this.statusWidth(),
    contentArea.y,
    this.rightColumnWidth(),
    this.slotWindowHeight(6));
};

/**
 * Calculates the slot window height based on slot count.
 * @param {number} equipSlotCount The number of slots.
 * @returns {number} The calculated height for the slot window.
 */
Scene_Equip.prototype.slotWindowHeight = equipSlotCount => 48 * equipSlotCount;

/**
 * Toggles the extended data panel over the equipment slots.
 */
Scene_Equip.prototype.switchToMoreDataFromEquipSlots = function()
{
  this.toggleMoreData(this.slotWindow(), this.backToSlotsList.bind(this));
};

/**
 * Toggles the extended data panel over whichever list summoned it.
 *
 * The slots and the items wanted the same nine lines with two words changed, so they share them. Which
 * list is underneath, and where cancelling returns to, is the whole of the difference.
 * @param {Window_Selectable} sourceWindow The list the panel was summoned from.
 * @param {Function} onCancel What backing out of the panel should do.
 */
Scene_Equip.prototype.toggleMoreData = function(sourceWindow, onCancel)
{
  // flip the panel's state, then act on whichever state it landed in.
  this.setMoreVisible(!this.moreVisible());

  const moreDataWindow = this.moreDataWindow();

  if (this.moreVisible() === false)
  {
    // put the panel away and hand the cursor back to the list it came from.
    moreDataWindow.hide();
    moreDataWindow.deactivate();
    moreDataWindow.deselect();
    sourceWindow.activate();

    return;
  }

  // fill the panel from whatever the list is currently highlighting.
  sourceWindow.refreshMoreData();
  sourceWindow.deactivate();

  moreDataWindow.setHandler('cancel', onCancel);
  moreDataWindow.show();
  moreDataWindow.activate();
  moreDataWindow.select(0);
};

/**
 * Toggles the extended data panel over the equippable items.
 */
Scene_Equip.prototype.switchToMoreDataFromEquipItems = function()
{
  this.toggleMoreData(this.itemWindow(), this.backToItemsList.bind(this));
};

/**
 * Extends the slot window to include our additional actions.
 */
J.CMS.EXT.EQUIP.Aliased.Scene_Equip.set('createSlotWindow', Scene_Equip.prototype.createSlotWindow);
Scene_Equip.prototype.createSlotWindow = function()
{
  // perform original logic.
  J.CMS.EXT.EQUIP.Aliased.Scene_Equip.get('createSlotWindow').call(this);
  this.slotWindow().setHandler('more', this.switchToMoreDataFromEquipSlots.bind(this));
  this.slotWindow().setHandler('context', this.onContextUnequipSlot.bind(this));
  this.slotWindow().setHandler('actor-next', this.nextActor.bind(this));
  this.slotWindow().setHandler('actor-prev', this.previousActor.bind(this));
  this.slotWindow()
    .setMoreDataWindow(this.moreDataWindow());
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
  this.itemWindow()
    .setMoreDataWindow(this.moreDataWindow());

  this.slotWindow().setItemWindow(this.itemWindow());

  this.addWindow(this.itemWindow());
};

/**
 * Creates the more data window.
 */
Scene_Equip.prototype.createMoreDataWindow = function()
{
  const window = new Window_MoreEquipData(this.moreDataRect());

  // it floats over the parameter grid on demand, so it starts away and fully opaque.
  window.hide();
  window.deactivate();
  window.deselect();
  window.opacity = 255;

  this.setMoreDataWindow(window);
  this.addWindow(window);
};

Scene_Equip.prototype.moreDataRect = function()
{
  // a panel that floats over the parameter grid, hugging the column it describes.
  const contentArea = this.contentAreaRect();
  const width = 500;
  const wx = contentArea.x + this.statusWidth() - width - 4;
  const wy = this.slotWindowRect().y - 4;

  return new Rectangle(wx, wy, width, contentArea.y + contentArea.height - wy);
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
  // fill the rest of the right column beneath the slots.
  const contentArea = this.contentAreaRect();
  const slotRect = this.slotWindowRect();
  const wy = slotRect.y + this.slotWindow().height;

  return new Rectangle(
    slotRect.x,
    wy,
    slotRect.width,
    contentArea.y + contentArea.height - wy);
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
J.CMS.EXT.EQUIP.Aliased.Scene_Equip.set('refreshActor', Scene_Equip.prototype.refreshActor);
Scene_Equip.prototype.refreshActor = function()
{
  // perform original logic.
  J.CMS.EXT.EQUIP.Aliased.Scene_Equip.get('refreshActor').call(this);
  const actor = this.actor();
  this.moreDataWindow()
    .setActor(actor);
  this.actorRibbonWindow().setActor(actor);
};

//region properties
/**
 * Gets the actor ribbon window under the name this scene refers to it by.
 * @returns {Window_EquipActorRibbon}
 */
Scene_Equip.prototype.actorRibbonWindow = function()
{
  return this.getActorRibbonWindow();
};
//endregion properties
//endregion Scene_Equip