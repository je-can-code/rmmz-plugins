//region Scene_SkillEquip
import Window_SkillEquipRibbon from '../windows/Window_SkillEquipRibbon.js';
import Window_SkillEquipSlots from '../windows/Window_SkillEquipSlots.js';
import Window_SkillEquipList from '../windows/Window_SkillEquipList.js';
import Window_SkillEquipDetail from '../windows/Window_SkillEquipDetail.js';

/**
 * The scene for viewing and managing skill equip slots.
 *
 * Layout is inherited from {@link Scene_ActorFacetBase}, which supplies the actor ribbon and the control
 * legend and hands down {@link Scene_ActorFacetBase.contentAreaRect} as the region left over. Within it,
 * the slot column takes the same proportional share the sibling facet scenes give their primary list.
 */
class Scene_SkillEquip
  extends Scene_ActorFacetBase
{
  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  //region init
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the SKS members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    // initialize the core SKS namespace.
    this.initCoreMembers();

    // initialize the primary members for the scene.
    this.initPrimaryMembers();
  }

  /**
   * Initializes the core SKS members.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the SKS system.
     */
    this._j._sks = {};
  }

  /**
   * Initializes the primary members for the scene.
   */
  initPrimaryMembers()
  {
    /**
     * The currently highlighted slot index in the slots list.
     * @type {number}
     */
    this._j._sks._focusedSlotIndex = 0;

    /**
     * The last-known slot index, used for change detection.
     * @type {number}
     */
    this._j._sks._lastSlotIndex = -1;

    /**
     * The last-known skill index, used for change detection.
     * @type {number}
     */
    this._j._sks._lastSkillIndex = -1;

    /**
     * A grouping of all windows for this scene.
     */
    this._j._sks._windows = {};

    /**
     * The slots list window displayed on the left.
     * @type {Window_SkillEquipSlots|null}
     */
    this._j._sks._windows._slots = null;

    /**
     * The skills list window displayed on the right.
     * @type {Window_SkillEquipList|null}
     */
    this._j._sks._windows._skills = null;

    /**
     * The detail window displayed beneath the skills list.
     * @type {Window_SkillEquipDetail|null}
     */
    this._j._sks._windows._detail = null;
  }

  //endregion init

  //region accessors
  /**
   * Gets the currently focused slot index.
   * @returns {number}
   */
  focusedSlotIndex()
  {
    return this._j._sks._focusedSlotIndex;
  }

  /**
   * Sets the currently focused slot index.
   * @param {number} index - The slot index to focus.
   */
  setFocusedSlotIndex(index)
  {
    this._j._sks._focusedSlotIndex = index;
  }

  /**
   * Gets the last-known slot index for change detection.
   * @returns {number}
   */
  lastSlotIndex()
  {
    return this._j._sks._lastSlotIndex;
  }

  /**
   * Sets the last-known slot index.
   * @param {number} index - The slot index to record.
   */
  setLastSlotIndex(index)
  {
    this._j._sks._lastSlotIndex = index;
  }

  /**
   * Gets the last-known skill index for change detection.
   * @returns {number}
   */
  lastSkillIndex()
  {
    return this._j._sks._lastSkillIndex;
  }

  /**
   * Sets the last-known skill index.
   * @param {number} index - The skill index to record.
   */
  setLastSkillIndex(index)
  {
    this._j._sks._lastSkillIndex = index;
  }

  //endregion accessors

  //region create
  /**
   * Initialize all resources required for this scene.
   */
  create()
  {
    // perform original logic.
    super.create();

    // create the various display objects on the screen.
    this.createDisplayObjects();
  }

  /**
   * Creates the display objects for this scene.
   */
  createDisplayObjects()
  {
    // create all windows for this scene.
    this.createAllWindows();
  }

  /**
   * Creates all windows for this scene.
   */
  createAllWindows()
  {
    // create the slots window on the left side.
    this.createSlotsWindow();

    // create the skills list window on the right side.
    this.createSkillsListWindow();

    // create the detail window beneath the skills list.
    this.createDetailWindow();

    // wire the windows together after all are created.
    this.wireWindows();

    // apply initial selection and focus.
    this.initializeView();
  }

  //region ribbon
  /**
   * Overrides {@link Scene_ActorFacetBase.buildActorRibbonWindow}.<br/>
   * Supplies the skill equip ribbon, which shows the actor plus their slot capacity summary.
   *
   * Only the contents differ from the default ribbon; the base decides where it sits and how tall it is.
   * @param {Rectangle} rectangle The rectangle to build the window within.
   * @returns {Window_SkillEquipRibbon}
   */
  buildActorRibbonWindow(rectangle)
  {
    return new Window_SkillEquipRibbon(rectangle);
  }

  /**
   * Gets the actor ribbon window under the name this scene refers to it by.
   * @returns {Window_SkillEquipRibbon}
   */
  ribbonWindow()
  {
    return this.getActorRibbonWindow();
  }

  /**
   * The proportion of the content area given to the slot column.
   *
   * The same share the sibling facet scenes give their primary list, leaving the remainder for the pool
   * of candidate skills- which needs the room more, since it lists every skill the actor knows.
   * @returns {number}
   */
  slotColumnRatio()
  {
    return 0.4;
  }

  /**
   * Overrides {@link Scene_MenuFacetBase.hasHelpWindow}.<br/>
   * Declines the help strip across the top.
   *
   * This scene already carries a detail panel beneath the candidate list, and its command windows have
   * no help text of their own, so the strip would have sat empty.
   * @returns {boolean}
   */
  hasHelpWindow()
  {
    return false;
  }

  /**
   * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
   * Describes the controls this scene responds to.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
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
  }

  //endregion ribbon

  //region slots
  /**
   * Creates the slots window on the left side.
   */
  createSlotsWindow()
  {
    // build the rectangle for the window.
    const rect = this.slotsWindowRect();

    // create the window instance.
    const win = new Window_SkillEquipSlots(rect);

    // assign the actor into the window.
    win.setActor(this.actor());

    // set the handler for confirming a slot selection.
    win.setHandler('ok', this.onSlotOk.bind(this));

    // set the handler for canceling from the slot selection.
    win.setHandler('cancel', this.onSlotCancel.bind(this));

    // set the handler for unequipping the skill in the focused slot.
    win.setHandler('context', this.onSlotUnequip.bind(this));
    win.setHandler('actor-prev', this.onCycleActorLeft.bind(this));
    win.setHandler('actor-next', this.onCycleActorRight.bind(this));

    // assign the window reference.
    this.setSlotsWindow(win);

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the slots window on the left.
   * @returns {Rectangle}
   */
  slotsWindowRect()
  {
    // start from the region the base leaves beneath the ribbon.
    const contentArea = this.contentAreaRect();

    // take this column's proportional share of it.
    const ww = Math.round(contentArea.width * this.slotColumnRatio());

    // honour the player's preference for which side the interactive column sits on.
    const wx = this.isRightInputMode()
      ? contentArea.x + contentArea.width - ww
      : contentArea.x;

    // return the rectangle for the slots window, full height of the region.
    return new Rectangle(wx, contentArea.y, ww, contentArea.height);
  }

  /**
   * Gets the slots window.
   * @returns {Window_SkillEquipSlots|null}
   */
  slotsWindow()
  {
    return this._j._sks._windows._slots;
  }

  /**
   * Sets the slots window.
   * @param {Window_SkillEquipSlots} window The window to track.
   */
  setSlotsWindow(window)
  {
    this._j._sks._windows._slots = window;
  }

  //endregion slots

  //region skills list
  /**
   * Creates the skills list window on the right side.
   */
  createSkillsListWindow()
  {
    // build the rectangle for the window.
    const rect = this.skillsListWindowRect();

    // create the window instance.
    const win = new Window_SkillEquipList(rect);

    // assign the actor into the window.
    win.setActor(this.actor());

    // set the handler for confirming a skill selection.
    win.setHandler('ok', this.onSkillOk.bind(this));

    // set the handler for canceling from the skill selection.
    win.setHandler('cancel', this.onSkillCancel.bind(this));

    // assign the window reference.
    this.setSkillsWindow(win);

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the skills list window on the right.
   * @returns {Rectangle}
   */
  skillsListWindowRect()
  {
    // the slots have already claimed their share of the region.
    const contentArea = this.contentAreaRect();
    const slotsRect = this.slotsWindowRect();

    // sit on whichever side the slots did not take.
    const wx = this.isRightInputMode()
      ? contentArea.x
      : slotsRect.x + slotsRect.width;

    // take the remainder of the width rather than a second fraction of it.
    const ww = contentArea.width - slotsRect.width;

    // give the list the upper share of the height; the detail panel gets what is left.
    const wh = Math.floor(contentArea.height * this.skillsListHeightRatio());

    // return the rectangle for the skills list window.
    return new Rectangle(wx, contentArea.y, ww, wh);
  }

  /**
   * The proportion of the region's height given to the candidate list, above its detail panel.
   * @returns {number}
   */
  skillsListHeightRatio()
  {
    return 0.6;
  }

  /**
   * Gets the skills list window.
   * @returns {Window_SkillEquipList|null}
   */
  skillsWindow()
  {
    return this._j._sks._windows._skills;
  }

  /**
   * Sets the skills list window.
   * @param {Window_SkillEquipList} window The window to track.
   */
  setSkillsWindow(window)
  {
    this._j._sks._windows._skills = window;
  }

  //endregion skills list

  //region detail
  /**
   * Creates the detail window beneath the skills list.
   */
  createDetailWindow()
  {
    // build the rectangle for the window.
    const rect = this.detailWindowRect();

    // create the window instance.
    const win = new Window_SkillEquipDetail(rect);

    // assign the actor into the window.
    win.setActor(this.actor());

    // assign the window reference.
    this.setDetailWindow(win);

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the detail window beneath the skills list.
   * @returns {Rectangle}
   */
  detailWindowRect()
  {
    // sit directly beneath the skills list, matching its column exactly.
    const listRect = this.skillsListWindowRect();
    const contentArea = this.contentAreaRect();

    // take whatever height the list left behind, as the remainder rather than a computed size.
    const wh = contentArea.height - listRect.height;

    // return the rectangle for the detail window.
    return new Rectangle(listRect.x, listRect.y + listRect.height, listRect.width, wh);
  }

  /**
   * Gets the detail window.
   * @returns {Window_SkillEquipDetail|null}
   */
  detailWindow()
  {
    return this._j._sks._windows._detail;
  }

  /**
   * Sets the detail window.
   * @param {Window_SkillEquipDetail} window The window to track.
   */
  setDetailWindow(window)
  {
    this._j._sks._windows._detail = window;
  }

  //endregion detail

  //endregion create

  //region update
  /**
   * Extends {@link #update}.<br/>
   * Also watches window indices and keeps dependent windows in sync.
   */
  update()
  {
    // perform original logic.
    super.update();

    // update the detail window based on the current slot selection.
    this.updateSlotDetails();

    // update the detail window based on the current skill selection.
    this.updateSkillDetails();
  }

  /**
   * Updates the skills list context and detail window based on the current slot selection.
   */
  updateSlotDetails()
  {
    // grab the current slot index from the slots window.
    const slotIndex = this.slotsWindow()
      .index();

    // if the slot index has not changed, do nothing.
    if (slotIndex === this.lastSlotIndex()) return;

    // record the updated slot index.
    this.setLastSlotIndex(slotIndex);

    // update the skills list to reflect the new slot context.
    this.skillsWindow()
      .setSlotContext(slotIndex);

    // determine the skill equipped in this slot.
    const idInSlot = this.actor()
      .getSkillIdInSlot(slotIndex);

    // update the detail window to show the skill in this slot.
    this.detailWindow()
      .setSkillId(idInSlot);
  }

  /**
   * Updates the detail window based on the current skill selection.
   */
  updateSkillDetails()
  {
    // grab the current skill index from the skills window.
    const skillIndex = this.skillsWindow()
      .index();

    // if the skill index has not changed, do nothing.
    if (skillIndex === this.lastSkillIndex()) return;

    // record the updated skill index.
    this.setLastSkillIndex(skillIndex);

    // determine the currently selected skill.
    const skill = this.skillsWindow()
      .item();

    // determine the skill id to pass to the detail window.
    const id = skill ? skill.id : 0;

    // if there is a valid skill selected, update the detail window.
    if (id > 0)
    {
      // update the detail window to show the selected skill.
      this.detailWindow()
        .setSkillId(id);
    }
  }

  //endregion update

  //region actions
  /**
   * Extends {@link #onActorChange}.<br/>
   * Also refreshes all SKS windows when the actor changes.
   */
  onActorChange()
  {
    // perform original logic.
    super.onActorChange();

    // get the updated actor reference.
    const updatedActor = this.actor();

    // rebind all windows to the new actor.
    this.rebindAllWindowsToActor(updatedActor);

    // refresh all windows for the new actor.
    this.refreshAll();

    // restore initial focus to the slots window.
    this.slotsWindow()
      .select(0);
    this.slotsWindow()
      .activate();
    this.skillsWindow()
      .deactivate();
  }

  /**
   * Handles confirming a slot selection.
   */
  onSlotOk()
  {
    // record the newly focused slot index.
    const slotIndex = this.slotsWindow()
      .index();

    this.setFocusedSlotIndex(slotIndex);

    // deactivate the slots window while the skill list is active.
    this.slotsWindow()
      .deactivate();

    // move focus to the skills list.
    this.skillsWindow()
      .activate();

    // start the skills list selection from the top.
    this.skillsWindow()
      .select(0);

    // determine the first skill in the list, if any.
    const firstItem = this.skillsWindow()
      .item();

    // determine the skill id to show in the detail window.
    const firstId = firstItem ? firstItem.id : 0;

    // update the detail window for the first item.
    this.detailWindow()
      .setSkillId(firstId);
  }

  /**
   * Handles canceling from the slot selection.
   */
  onSlotCancel()
  {
    // exit the scene.
    this.popScene();
  }

  /**
   * Handles the "context" action from the slot selection.
   * Unequips the skill in the currently focused slot, if one is equipped.
   */
  onSlotUnequip()
  {
    // acquire the currently focused slot entry.
    const entry = this.slotsWindow()
      .item();

    // determine if the slot currently has a skill equipped.
    const isFilled = entry.skillId > 0;

    // if the slot is empty there is nothing to unequip; remain active.
    if (isFilled === false)
    {
      // reactivate the slots window and do nothing further.
      this.slotsWindow()
        .activate();

      // exit early without a payload.
      return;
    }

    // unequip the skill from this slot.
    this.actor()
      .unequipSkillFromSlot(entry.index);

    // refresh the UI to reflect the change.
    this.refreshAll();

    // remain in the scene with the slots window active.
    this.slotsWindow()
      .activate();
  }

  /**
   * Handles confirming a skill selection for the focused slot.
   */
  onSkillOk()
  {
    // determine the focused slot index.
    const slotIndex = this.focusedSlotIndex();

    // determine the selected skill.
    const skill = this.skillsWindow()
      .item();

    // equip the selected skill to the focused slot.
    this.actor()
      .equipSkillToSlot(slotIndex, skill.id);

    // refresh all windows to reflect the change.
    this.refreshAll();

    // deactivate the skills window.
    this.skillsWindow()
      .deactivate();

    // return focus to the slots window.
    this.slotsWindow()
      .activate();
  }

  /**
   * Handles canceling from the skills list.
   */
  onSkillCancel()
  {
    // deactivate the skills window.
    this.skillsWindow()
      .deactivate();

    // return focus to the slots window.
    this.slotsWindow()
      .activate();

    // determine the skill equipped in the currently selected slot.
    const slotIndex = this.slotsWindow()
      .index();

    const skillIdInSlot = this.actor()
      .getSkillIdInSlot(slotIndex);

    // update the detail window to reflect the equipped skill for the current slot.
    this.detailWindow()
      .setSkillId(skillIdInSlot);
  }

  //endregion actions

  //region helpers
  /**
   * Applies the initial selection and focus state for the scene.
   */
  initializeView()
  {
    // start with the first slot selected and active.
    this.slotsWindow()
      .select(0);
    this.slotsWindow()
      .activate();

    // start with the skills window inactive.
    this.skillsWindow()
      .deactivate();
  }

  /**
   * Wires the initial context between windows after all are created.
   */
  wireWindows()
  {
    // provide the initial slot context to the skills list.
    const initialSlotIndex = this.slotsWindow()
      .index();

    this.skillsWindow()
      .setSlotContext(initialSlotIndex);

    // determine the skill equipped in the first slot.
    const firstSlotIndex = this.slotsWindow()
      .index();

    const skillIdInSlot = this.actor()
      .getSkillIdInSlot(firstSlotIndex);

    // set the detail to show the skill in the first slot.
    this.detailWindow()
      .setSkillId(skillIdInSlot);
  }

  /**
   * Rebinds all scene windows to the provided actor.
   * @param {Game_Actor} actor - The actor to bind to all windows.
   */
  rebindAllWindowsToActor(actor)
  {
    // the ribbon is deliberately absent here; the base repoints it in onActorChange.

    // update the slots window with the new actor.
    this.slotsWindow()
      .setActor(actor);

    // update the skills window with the new actor.
    this.skillsWindow()
      .setActor(actor);

    // update the detail window with the new actor.
    this.detailWindow()
      .setActor(actor);
  }

  /**
   * Refreshes all windows in the scene.
   */
  refreshAll()
  {
    // refresh the ribbon window.
    this.ribbonWindow()
      .refresh();

    // refresh the slots list.
    this.slotsWindow()
      .refresh();

    // update the skills list context for the currently selected slot.
    const selectedSlotIndex = this.slotsWindow()
      .index();

    this.skillsWindow()
      .setSlotContext(selectedSlotIndex);

    // refresh the skills list.
    this.skillsWindow()
      .refresh();

    // determine the currently highlighted skill in the list, if any.
    const currentSkill = this.skillsWindow()
      .item();

    // prefer the highlighted skill; fall back to the skill equipped in the current slot.
    const slotIndex = this.slotsWindow()
      .index();

    const skillId = currentSkill
      ? currentSkill.id
      : this.actor()
        .getSkillIdInSlot(slotIndex);

    // update the detail window with the resolved skill.
    this.detailWindow()
      .setSkillId(skillId);
  }

  //endregion helpers
}

export default Scene_SkillEquip;
//endregion Scene_SkillEquip