//region Window_LoadoutSlots
import LoadoutSlotCatalog from './../_models/LoadoutSlotCatalog.js';

/**
 * One party member's column of assignable slots.
 *
 * The scene builds one of these per member and keeps their selections in lockstep, so a row means
 * the same slot in every column. Only one is ever active; the others stay selected but inactive,
 * which leaves their highlight drawn without animating it. The player therefore sees which slot they
 * are on for everyone at once, while it stays unambiguous whose slot they are about to change.
 */
class Window_LoadoutSlots
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members before building the list.
    super(rect);
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * The actor whose slots this column represents.
     * @type {Game_Actor|null}
     */
    this._actor = null;
  }

  //region properties
  /**
   * Gets the actor whose slots this column represents.
   * @returns {Game_Actor|null} The actor.
   */
  actor()
  {
    // hand back the actor.
    return this._actor;
  }

  /**
   * Sets the actor whose slots this column represents.
   * @param {Game_Actor} newActor The new actor.
   */
  setActor(newActor)
  {
    // assign the actor.
    this._actor = newActor;

    // the entire contents belong to that actor, so nothing is valid until they are rebuilt.
    this.refresh();
  }

  //endregion properties

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Builds one command per assignable slot.
   */
  makeCommandList()
  {
    // nothing is listable until this column knows whose slots it is showing.
    if (!this.actor()) return;

    // one row per slot, in the catalog's order so every column agrees on what a row means.
    LoadoutSlotCatalog.slotKeys()
      .forEach(slotKey => this.addBuiltCommand(this.buildSlotCommand(slotKey)));
  }

  /**
   * Builds the command representing this actor's assignment to one slot.
   * @param {string} slotKey The key of the slot being represented.
   * @returns {BuiltWindowCommand}
   */
  buildSlotCommand(slotKey)
  {
    // resolve what is currently sitting in the slot, whether that is a skill or an item.
    const entry = this.slottedEntry(slotKey);

    // an unassigned slot still renders, because an empty slot is the thing the player came to fix.
    const name = entry
      ? entry.name
      : this.emptySlotText();

    // build the command carrying everything the scene needs to act on it.
    return new WindowCommandBuilder(name).setSymbol(slotKey)
      .setIconIndex(entry
        ? entry.iconIndex
        : 0)
      .setHelpText(this.describeSlot(slotKey, entry))
      .build();
  }

  /**
   * Gets whatever currently occupies one of this actor's slots.
   *
   * The slot resolves its own contents rather than the id being looked up here, because the tool and
   * usable-item slots store item ids while every other slot stores skill ids. Resolving them all
   * against the skill table would silently render whichever skill happened to share an item's id.
   * @param {string} slotKey The key of the slot to inspect.
   * @returns {?RPG_UsableItem|?RPG_Skill}
   */
  slottedEntry(slotKey)
  {
    // grab the slot itself so its current assignment can be read.
    const slot = this.slotByKey(slotKey);

    // an actor whose slots have not been set up yet has nothing to report.
    if (!slot) return null;

    // let the slot decide which database its id belongs to.
    return slot.data(this.actor());
  }

  /**
   * Gets one of this actor's slots by its key.
   * @param {string} slotKey The key of the slot to fetch.
   * @returns {?JABS_SkillSlot}
   */
  slotByKey(slotKey)
  {
    // the manager owns the slots; this window only ever reads them.
    return this.actor()
      .getSkillSlotManager()
      .getSkillSlotByKey(slotKey);
  }

  /**
   * Describes what a slot currently holds and how it is triggered.
   *
   * Named for the actor as well as the input, because the scene shows two members at once- "the offhand
   * slot" would be ambiguous without saying whose.
   * @param {string} slotKey The key of the slot being described.
   * @param {?RPG_UsableItem|?RPG_Skill} entry Whatever currently occupies the slot, if anything.
   * @returns {string}
   */
  describeSlot(slotKey, entry)
  {
    // describe how this slot is triggered in play, tinted so the input reads as a control rather than
    // as another noun in the sentence.
    const input = this.colorizeText(this.slotColorIndex(), LoadoutSlotCatalog.describeInput(slotKey));

    // refer to the actor rather than spelling them out, so a rename reaches this sentence too.
    const actor = this.actorTextCode();

    // an empty slot is described by what it lacks rather than by what it does.
    if (!entry) return `${actor} has nothing assigned to ${input}.`;

    // an occupied slot names what will happen when that input is used.
    return `${actor} uses ${this.entryTextCode(slotKey, entry)} on ${input}.`;
  }

  /**
   * The color index the triggering input renders with.
   *
   * Deliberately not the index {@link Window_Base.translateSkillTextCode} tints skill names with. The
   * sentence holds two nouns- a thing and a control- and painting both the same color collapses that
   * distinction into a wall of one hue. This one is warm where skills are cool, so the eye separates
   * "what happens" from "what you press" without having to read for it.
   * @returns {number}
   */
  slotColorIndex()
  {
    return 6;
  }

  /**
   * The ex-text code naming the actor whose slots this window shows.
   *
   * Deferring to the engine's own actor code rather than interpolating the name means the sentence
   * follows the actor- a rename, or a different party member entirely, needs no change here.
   * @returns {string}
   */
  actorTextCode()
  {
    return `\\N[${this.actor().actorId()}]`;
  }

  /**
   * The ex-text code naming whatever occupies a slot, complete with its icon.
   *
   * Which code applies depends on which database the slot's id belongs to, and the slot itself is asked
   * rather than the key being pattern-matched. That is the same authority {@link JABS_SkillSlot.data}
   * consults, so the sentence can never name a different thing than the slot actually holds- an item
   * rendered as a skill would silently display whichever skill happened to share its id.
   * @param {string} slotKey The key of the slot being described.
   * @param {RPG_UsableItem|RPG_Skill} entry Whatever currently occupies the slot.
   * @returns {string}
   */
  entryTextCode(slotKey, entry)
  {
    // ask the slot which database it draws from.
    const slot = this.slotByKey(slotKey);

    // tool and usable-item slots hold items; every other slot holds a skill.
    return slot.isItem()
      ? `\\item[${entry.id}]`
      : `\\skill[${entry.id}]`;
  }

  /**
   * The text rendered for a slot holding nothing.
   * @returns {string}
   */
  emptySlotText()
  {
    return '- empty -';
  }

  /**
   * Gets the slot key currently highlighted.
   * @returns {string}
   */
  currentSlotKey()
  {
    return LoadoutSlotCatalog.slotKeyAt(this.index());
  }

}

export default Window_LoadoutSlots;
//endregion Window_LoadoutSlots
