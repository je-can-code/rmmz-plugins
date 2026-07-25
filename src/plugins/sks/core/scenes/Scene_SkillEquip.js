//region Scene_SkillEquip
import Window_SkillEquipRibbon from '../windows/Window_SkillEquipRibbon.js';
import Window_SkillEquipSlots from '../windows/Window_SkillEquipSlots.js';
import Window_SkillEquipList from '../windows/Window_SkillEquipList.js';
import Window_SkillEquipDetail from '../windows/Window_SkillEquipDetail.js';

/**
 * The scene for viewing and managing skill equip slots.
 */
class Scene_SkillEquip
  extends Scene_MenuBase
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
     * The ribbon window displayed along the top.
     * @type {Window_SkillEquipRibbon|null}
     */
    this._j._sks._windows._ribbon = null;

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
    // create the ribbon window along the top.
    this.createRibbonWindow();

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
   * Creates the ribbon window across the top.
   */
  createRibbonWindow()
  {
    // build the rectangle for the window.
    const rect = this.ribbonWindowRect();

    // create the window instance.
    const win = new Window_SkillEquipRibbon(rect);

    // assign the actor into the window.
    win.setActor(this.actor());

    // assign the window reference.
    this._j._sks._windows._ribbon = win;

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the ribbon window across the top.
   * @returns {Rectangle}
   */
  ribbonWindowRect()
  {
    // the ribbon spans the full width of the screen.
    const ww = Graphics.boxWidth;

    // determine the ribbon height as one line tall.
    const wh = this.calcWindowHeight(1, false);

    // the ribbon always starts at the left edge.
    const wx = 0;

    // determine the y position at the top of the main area.
    const wy = this.mainAreaTop();

    // return the rectangle for the ribbon window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the ribbon window.
   * @returns {Window_SkillEquipRibbon|null}
   */
  ribbonWindow()
  {
    return this._j._sks._windows._ribbon;
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
    this._j._sks._windows._slots = win;

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the slots window on the left.
   * @returns {Rectangle}
   */
  slotsWindowRect()
  {
    // determine the total available height below the ribbon.
    const totalHeight = this.mainAreaHeight() - this.ribbonWindowRect().height;

    // keep the width aligned with the ribbon above it.
    const ww = 420;

    // use the full remaining height below the ribbon.
    const wh = totalHeight;

    // determine the x position based on the current input mode.
    const wx = this.isRightInputMode()
      ? Graphics.boxWidth - ww
      : 0;

    // place the window directly below the ribbon.
    const wy = this.ribbonWindowRect().y + this.ribbonWindowRect().height;

    // return the rectangle for the slots window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the slots window.
   * @returns {Window_SkillEquipSlots|null}
   */
  slotsWindow()
  {
    return this._j._sks._windows._slots;
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
    this._j._sks._windows._skills = win;

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the skills list window on the right.
   * @returns {Rectangle}
   */
  skillsListWindowRect()
  {
    // determine the x position based on the current input mode.
    const wx = this.isRightInputMode()
      ? 0
      : this.slotsWindowRect().x + this.slotsWindowRect().width;

    // fill the remaining width of the screen after the slots column.
    const ww = Graphics.boxWidth - this.slotsWindowRect().width;

    // compute the remaining height below the ribbon shared by both right-side windows.
    const remainingHeight = this.mainAreaHeight() - this.ribbonWindowRect().height;

    // use 60% of the remaining height for the list portion.
    const wh = Math.floor(remainingHeight * 0.6);

    // start directly below the ribbon.
    const wy = this.ribbonWindowRect().y + this.ribbonWindowRect().height;

    // return the rectangle for the skills list window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the skills list window.
   * @returns {Window_SkillEquipList|null}
   */
  skillsWindow()
  {
    return this._j._sks._windows._skills;
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
    this._j._sks._windows._detail = win;

    // add the window to the scene.
    this.addWindow(win);
  }

  /**
   * Builds the rectangle for the detail window beneath the skills list.
   * @returns {Rectangle}
   */
  detailWindowRect()
  {
    // share the same x position as the skills list.
    const wx = this.skillsListWindowRect().x;

    // match the width of the skills list.
    const ww = this.skillsListWindowRect().width;

    // fill the remaining height below both the ribbon and the skills list.
    const wh = this.mainAreaHeight() - this.ribbonWindowRect().height - this.skillsListWindowRect().height;

    // place the window directly beneath the skills list.
    const wy = this.skillsListWindowRect().y + this.skillsListWindowRect().height;

    // return the rectangle for the detail window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the detail window.
   * @returns {Window_SkillEquipDetail|null}
   */
  detailWindow()
  {
    return this._j._sks._windows._detail;
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
    this.setFocusedSlotIndex(this.slotsWindow()
      .index());

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
    const skillIdInSlot = this.actor()
      .getSkillIdInSlot(this.slotsWindow()
        .index());

    // update the detail window to reflect the equipped skill for the current slot.
    this.detailWindow()
      .setSkillId(skillIdInSlot);
  }

  /**
   * Cycles to the previous actor.
   */
  onCycleActorLeft()
  {
    // move to the previous actor.
    this.previousActor();
  }

  /**
   * Cycles to the next actor.
   */
  onCycleActorRight()
  {
    // move to the next actor.
    this.nextActor();
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
    this.skillsWindow()
      .setSlotContext(this.slotsWindow()
        .index());

    // determine the skill equipped in the first slot.
    const skillIdInSlot = this.actor()
      .getSkillIdInSlot(this.slotsWindow()
        .index());

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
    // update the ribbon window with the new actor.
    this.ribbonWindow()
      .setActor(actor);

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
    this.skillsWindow()
      .setSlotContext(this.slotsWindow()
        .index());

    // refresh the skills list.
    this.skillsWindow()
      .refresh();

    // determine the currently highlighted skill in the list, if any.
    const currentSkill = this.skillsWindow()
      .item();

    // prefer the highlighted skill; fall back to the skill equipped in the current slot.
    const skillId = currentSkill
      ? currentSkill.id
      : this.actor().getSkillIdInSlot(this.slotsWindow().index());

    // update the detail window with the resolved skill.
    this.detailWindow()
      .setSkillId(skillId);
  }

  //endregion helpers
}

export default Scene_SkillEquip;
//endregion Scene_SkillEquip