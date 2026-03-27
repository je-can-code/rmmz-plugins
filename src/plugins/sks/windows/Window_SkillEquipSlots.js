//region Window_SkillEquipSlots
/**
 * The window listing SKS slots for the current actor.
 * Uses Window_Command to match Aptitude windows style.
 */
class Window_SkillEquipSlots
  extends Window_Command
{
  //region properties
  /**
   * The actor whose equips are being managed.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The number of visible slots to present.
   * @type {number}
   */
  _visibleSlots = 8;
  //endregion properties

  //region init
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize members.
    this.initMembers();
  }

  /**
   * Initializes the members of this window.
   */
  initMembers()
  {
    // initialize the actor.
    this._actor = null;

    // initialize visible slot count.
    this._visibleSlots = 8;
  }

  //endregion init

  //region accessors
  /**
   * Gets the actor bound to this window.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    // return the bound actor.
    return this._actor;
  }

  /**
   * Binds a new actor to this window.
   * @param {Game_Actor} actor The actor to bind.
   */
  setActor(actor)
  {
    // assign the actor reference.
    this._actor = actor;

    // refresh the command list for the new actor.
    this.refresh();
  }

  /**
   * Gets the item (slot entry) at the current index.
   * @returns {{ index:number, skillId:number }|null}
   */
  item()
  {
    // acquire the current built command from the internal list.
    const cmd = this.commandList()
      .at(this.index());

    // if no command, there is no item.
    if (!cmd) return null;

    // return the payload we stored when building commands.
    return cmd.ext || null;
  }

  /**
   * Gets the preferred visible slot count (unused for building; list scrolls as needed).
   * @returns {number}
   */
  visibleSlots()
  {
    // return the configured value.
    return this._visibleSlots;
  }

  /**
   * Sets the preferred visible slot count (note: actual rows derive from actor slots).
   * @param {number} count The number of slots to prefer showing at once.
   */
  setVisibleSlots(count)
  {
    // assign the value.
    this._visibleSlots = count;

    // refresh if the window is already initialized.
    this.refresh();
  }

  //endregion accessors

  //region commands
  /**
   * Rebuilds the command list for the current actor.
   */
  makeCommandList()
  {
    // if we don’t have an actor, there is nothing to build.
    if (!this.actor()) return;

    // build all commands for this window.
    const commands = this.buildCommands();

    // add all built commands to this window.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // guard: cannot build without an actor.
    if (!this.actor()) return [];

    // compute slot capacity for rendering.
    const count = this.computeRenderableSlotCount();

    // build a row for each renderable slot (scrolling handled by Window_Command).
    const commands = [];
    for (let slotIndex = 0; slotIndex < count; slotIndex++)
    {
      commands.push(this.buildCommand(slotIndex));
    }

    // return the completed list of commands.
    return commands;
  }

  /**
   * Builds a single command for the given slot index.
   * @param {number} slotIndex The slot index to build a command for.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(slotIndex)
  {
    // determine the equipped id for that slot.
    const skillId = this.actor()
      .getSkillIdInSlot(slotIndex);

    // resolve label/icon/cost depending on occupancy.
    const isEmpty = skillId === 0;

    // determine the display name and icon for the row.
    const name = isEmpty === false
      ? $dataSkills[skillId].name
      : '- empty -';
    const iconIndex = isEmpty === false
      ? $dataSkills[skillId].iconIndex
      : 0;

    // compute cost text for the right side; explicitly 0 if empty.
    const rightText = isEmpty === false
      ? `${this.actor()
        .skillSlotCost(skillId, slotIndex)}`
      : '0';

    // slots are always selectable; follow-up behavior handled by scene.
    const enabled = true;

    // build the command for this row.
    const built = new WindowCommandBuilder(name)
      .setSymbol(`slot:${slotIndex}`)
      .setExtensionData({
        index: slotIndex,
        skillId
      })
      .setIconIndex(iconIndex)
      .setRightText(rightText)
      .setEnabled(enabled)
      .build();

    // return the built command.
    return built;
  }

  /**
   * Computes how many slot rows to render.
   * Uses the max of: highest equipped slot index + 1, and max slot points.
   * Guarantees at least 1 row.
   * @returns {number}
   */
  computeRenderableSlotCount()
  {
    // start with a baseline derived from points (temporary capacity until a dedicated stat exists).
    const baseline = Number(this.actor().maxSlotPoints()) || 0;

    // find the highest equipped slot index, if any.
    let highest = -1;
    const map = this.actor().slotMap();
    for (const [ slotIndex ] of map)
    {
      if (slotIndex > highest)
      {
        highest = slotIndex;
      }
    }

    // the highest occupied index implies at least that many rows to show.
    const occupiedCount = highest + 1; // if none, becomes 0.

    // compute the final render count.
    const count = Math.max(1, baseline, occupiedCount);

    // return the computed row count.
    return count;
  }

  //endregion commands
}

//endregion Window_SkillEquipSlots