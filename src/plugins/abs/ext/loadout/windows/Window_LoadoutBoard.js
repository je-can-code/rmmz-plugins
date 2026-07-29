//region Window_LoadoutBoard
/**
 * The board showing every assignable slot for every party member at once.
 *
 * This is the only screen in the game that renders more than one actor simultaneously, and it can
 * afford to because it has no permanent picker or detail column competing for the space- its picker
 * opens as a modal over the board rather than beside it. Every other actor-scoped scene carries one,
 * which is why they remain single-actor.
 *
 * Rendering both members side by side answers the question a two-person party actually asks: not
 * "what does Jerald have equipped", but "between the two of them, is anything uncovered".
 *
 * The columns are literal window columns, so moving between actors is ordinary horizontal cursor
 * movement rather than a special binding- the player presses left and right and it simply works.
 */
class Window_LoadoutBoard
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);
  }

  /**
   * Overwrites {@link #maxCols}.<br/>
   * One column per party member.
   * @returns {number}
   */
  maxCols()
  {
    return Math.max(1, $gameParty.size());
  }

  /**
   * Gets the party members rendered by this board, in column order.
   * @returns {Game_Actor[]}
   */
  members()
  {
    return $gameParty.members();
  }

  /**
   * The slot keys this board renders, in row order.
   *
   * Mainhand is deliberately absent- it is supplied by whatever weapon the actor has equipped rather
   * than chosen here, so offering it as a row would imply an assignment the player cannot make.
   * @returns {string[]}
   */
  slotKeys()
  {
    return [
      JABS_Button.Offhand,
      JABS_Button.CombatSkill1,
      JABS_Button.CombatSkill2,
      JABS_Button.CombatSkill3,
      JABS_Button.CombatSkill4,
      JABS_Button.Dodge,
      JABS_Button.Tool,
      JABS_Button.UsableItem,
    ];
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Builds one command per actor per slot, ordered so the grid reads row by row.
   *
   * The engine lays a multi-column list out left to right before wrapping, so the commands must be
   * interleaved by actor rather than grouped by them- otherwise every one of Jerald's slots would
   * occupy the top rows and Rupert's would follow beneath, which is a list, not a board.
   */
  makeCommandList()
  {
    // walk the slots in display order.
    this.slotKeys()
      .forEach(slotKey =>
      {
        // for each slot, emit one command per member so the row spans the board.
        this.members()
          .forEach(actor => this.addBuiltCommand(this.buildSlotCommand(actor, slotKey)));
      });
  }

  /**
   * Builds the command representing one actor's assignment to one slot.
   * @param {Game_Actor} actor The actor owning the slot.
   * @param {string} slotKey The key of the slot being represented.
   * @returns {BuiltWindowCommand}
   */
  buildSlotCommand(actor, slotKey)
  {
    // grab the slot itself so its current assignment can be read.
    const slot = actor.getSkillSlotManager()
      .getSkillSlotByKey(slotKey);

    // an actor whose slots have not been set up yet has nothing to describe.
    const skillId = slot
      ? slot.id
      : 0;

    // resolve what is actually sitting in the slot.
    const skill = skillId > 0
      ? actor.skill(skillId)
      : null;

    // an unassigned slot still renders, because an empty slot is the thing the player came to fix.
    const name = skill
      ? skill.name
      : this.emptySlotText();

    // build the command carrying everything the renderer and the scene both need. the slot's input is
    // deliberately absent- it belongs to the row rather than to either actor, so it renders once in
    // the spine between the columns instead of being repeated in both of them.
    return new WindowCommandBuilder(name).setSymbol(slotKey)
      .setIconIndex(skill
        ? skill.iconIndex
        : 0)
      .setExtensionData({
        actorId: actor.actorId(),
        slotKey,
        skillId,
      })
      .setHelpText(this.describeSlot(actor, slotKey, skill))
      .build();
  }

  /**
   * Describes what a slot currently holds and how it is triggered.
   *
   * Named for both the actor and the input, because the board shows two members at once- "the offhand
   * slot" is ambiguous here in a way it never was on the old single-actor menus.
   * @param {Game_Actor} actor The actor owning the slot.
   * @param {string} slotKey The key of the slot being described.
   * @param {?RPG_Skill} skill Whatever currently occupies the slot, if anything.
   * @returns {string}
   */
  describeSlot(actor, slotKey, skill)
  {
    // describe how this slot is triggered in play.
    const input = this.describeSlotInput(slotKey);

    // an empty slot is described by what it could hold rather than by what it does not.
    if (!skill) return `${actor.name()} has nothing assigned to ${input}.`;

    // an occupied slot names what will happen when that input is used.
    return `${actor.name()} uses ${skill.name} on ${input}.`;
  }

  /**
   * Describes which input fires a given slot, resolved against the player's live bindings.
   *
   * Combat skills are not bound directly- each is the skill trigger modifier held alongside one of
   * the primary buttons- so their description is assembled from the current binding of both halves.
   * Doing it this way rather than writing "L1 + Cross" into a string means remapping either half is
   * immediately reflected here, and a retired button cannot leave a stale label behind.
   * @param {string} slotKey The key of the slot being described.
   * @returns {string}
   */
  describeSlotInput(slotKey)
  {
    // combat skills are composed from two buttons rather than bound to one.
    const composition = JABS_Button.combatSkillComposition(slotKey);

    // a composed slot describes each of its halves, joined.
    if (composition.length > 0)
    {
      return composition.map(button => this.describeButton(button))
        .join(' + ');
    }

    // everything else is bound directly.
    return this.describeButton(slotKey);
  }

  /**
   * Describes a single logical button as the input currently bound to it.
   * @param {string} button The logical button to describe.
   * @returns {string}
   */
  describeButton(button)
  {
    return InputLegendResolver.resolve(button, button);
  }

  //region spine
  /**
   * The proportion of the board's width given to the slot spine running down the middle.
   *
   * The spine is narrower than either actor column because it carries a short fixed label rather than
   * a skill name, and because the assignments are the content- the spine only says which row you are
   * looking at.
   * @returns {number}
   */
  slotSpineRatio()
  {
    return 0.24;
  }

  /**
   * The width of the slot spine.
   * @returns {number}
   */
  slotSpineWidth()
  {
    return Math.floor(this.innerWidth * this.slotSpineRatio());
  }

  /**
   * The width of a single actor's column.
   *
   * Derived as an even share of whatever the spine does not claim, so the two columns always match
   * each other regardless of how wide the spine is configured to be.
   * @returns {number}
   */
  actorColumnWidth()
  {
    return Math.floor((this.innerWidth - this.slotSpineWidth()) / this.maxCols());
  }

  /**
   * Overwrites {@link #itemRect}.<br/>
   * Lays the columns out either side of the slot spine.
   * @param {number} index The index of the command being placed.
   * @returns {Rectangle}
   */
  itemRect(index)
  {
    // work out which column and row this command occupies.
    const column = index % this.maxCols();
    const row = Math.floor(index / this.maxCols());

    // everything left of the spine sits at its natural offset; everything right of it is pushed past.
    const spineOffset = column === 0
      ? 0
      : this.slotSpineWidth();

    // assemble the cell.
    const x = (this.actorColumnWidth() * column) + spineOffset;
    const y = (row * this.itemHeight()) - this.scrollBaseY();

    // return the built rectangle.
    return new Rectangle(x, y, this.actorColumnWidth(), this.itemHeight());
  }

  /**
   * Extends {@link #drawItem}.<br/>
   * Also renders the slot's own label into the spine, once per row.
   * @param {number} index The index of the command being drawn.
   */
  drawItem(index)
  {
    // perform original logic, rendering the assignment into its own column.
    super.drawItem(index);

    // the spine belongs to the row rather than to either column, so only the first column draws it.
    if (index % this.maxCols() !== 0) return;

    // render the label describing this row's slot.
    this.drawSlotSpineLabel(index);
  }

  /**
   * Renders the slot label for the row the given command belongs to.
   * @param {number} index The index of a command in the row being labelled.
   */
  drawSlotSpineLabel(index)
  {
    // grab the row's geometry from the command that triggered this.
    const rect = this.itemRect(index);

    // the spine begins where the first column ends.
    const x = this.actorColumnWidth();

    // labels are chrome describing the row, not content, so they render in the system color.
    this.resetFontSettings();
    this.changeTextColor(ColorManager.systemColor());

    // center the label within the spine so it reads as a divider between the two assignments.
    this.drawText(this.describeSlotInput(this.commandSymbol(index)), x, rect.y, this.slotSpineWidth(), 'center');

    // leave the color as we found it for the next command drawn.
    this.resetTextColor();
  }

  //endregion spine

  /**
   * The text rendered for a slot holding nothing.
   * @returns {string}
   */
  emptySlotText()
  {
    return '- empty -';
  }

  /**
   * The color index the input description renders with.
   * @returns {number}
   */
  inputTextColorIndex()
  {
    return 4;
  }

  /**
   * Gets the extension data of the currently highlighted slot.
   * @returns {?{actorId: number, slotKey: string, skillId: number}}
   */
  currentSlotData()
  {
    // nothing is highlighted when the board has not been selected into yet.
    if (this.index() < 0) return null;

    // hand back whatever the highlighted command is carrying.
    const commandEntry = this.commandEntryAt(this.index());
    if (commandEntry === null) return null;

    return commandEntry.ext;
  }
}

export default Window_LoadoutBoard;
//endregion Window_LoadoutBoard
