//region Window_SkillEquipList
/**
 * A window responsible for listing equippable skills (filtered).
 * Uses Window_Command to match Aptitude windows style.
 */
class Window_SkillEquipList
  extends Window_Command
{
  //region properties
  /**
   * The actor whose equips are being managed.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The current slot index context used for cost checks.
   * @type {number}
   */
  _slotContext = 0;
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
   * Initializes internal members.
   */
  initMembers()
  {
    // initialize the actor reference.
    this._actor = null;

    // initialize the slot context.
    this._slotContext = 0;
  }

  //endregion init

  //region accessors
  /**
   * Gets the actor bound to this window.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Assigns the actor for this window and refreshes.
   * @param {Game_Actor} actor The actor to assign.
   */
  setActor(actor)
  {
    // assign the actor reference.
    this._actor = actor;

    // refresh with the new actor.
    this.refresh();
  }

  /**
   * Gets the current slot index context for equip checks.
   * @returns {number}
   */
  slotContext()
  {
    return this._slotContext;
  }

  /**
   * Sets the slot context for cost checks and refreshes enabling.
   * @param {number} slotIndex The slot index being targeted.
   */
  setSlotContext(slotIndex)
  {
    // assign the slot index.
    this._slotContext = slotIndex;

    // rebuild to reflect enable/disable + sorting in this context.
    this.refresh();
  }

  /**
   * Gets the current item (skill) at the selection.
   * @returns {RPG_Skill|null}
   */
  item()
  {
    // acquire the current built command from the internal list.
    const cmd = this.commandList()
      .at(this.index());

    // if we have no command at the current index, then there is no skill.
    if (!cmd) return null;

    // extract the id from the payload.
    const ext = cmd.ext || { id: 0 };
    const id = ext.id || 0;

    // return the skill if valid.
    return id > 0
      ? $dataSkills[id]
      : null;
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
   * Builds all commands for this window.
   * Filters the actor's learned skills to those eligible for slot equipping,
   * then sorts by ascending slot cost for the current slot context.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // guard: cannot build without an actor.
    if (!this.actor()) return [];

    // gather learned skills from the actor.
    const learned = this.actor()
      .skills();

    // filter to SKS‑equippable per rules.
    const filtered = learned.filter(skill =>
    {
      // skip invalid entries.
      if (!skill) return false;

      // exclude unslotted.
      if (skill.unslotted) return false;

      // exclude extension skills when J.EXTEND exists.
      if (J.EXTEND && skill.isExtension) return false;

      // include others.
      return true;
    })
      .sort((a, b) =>
      {
        const costA = this.actor()
          .skillSlotCost(a.id, this.slotContext());
        const costB = this.actor()
          .skillSlotCost(b.id, this.slotContext());
        if (costA !== costB) return costA - costB;
        return a.id - b.id;
      });

    // convert to built commands.
    const commands = filtered.map(this.buildCommand, this);

    // return commands.
    return commands;
  }

  /**
   * Builds a single command for the given skill.
   * @param {RPG_Skill} skill The skill to build the command for.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(skill)
  {
    // compute cost for right text.
    const cost = this.actor()
      .skillSlotCost(skill.id, this.slotContext());

    // determine if this skill is currently enabled to equip.
    const enabled = this.actor()
      .canEquipSkillToSlot(this.slotContext(), skill.id);

    // build and return the command.
    const built = new WindowCommandBuilder(skill.name)
      .setSymbol(`skill:${skill.id}`)
      .setExtensionData({ id: skill.id })
      .setIconIndex(skill.iconIndex)
      .setRightText(`${cost}`)
      .setEnabled(enabled)
      .build();

    // return the built command.
    return built;
  }

  //endregion commands
}

export default Window_SkillEquipList;
//endregion Window_SkillEquipList