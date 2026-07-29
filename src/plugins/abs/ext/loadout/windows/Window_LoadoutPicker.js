//region Window_LoadoutPicker
/**
 * The list of things eligible to be placed into a given slot.
 *
 * This opens as a modal over the board rather than sitting beside it permanently, which is the reason
 * the board can afford to show every party member at once- a picker occupying its own column would
 * take exactly the space the second actor uses.
 *
 * What is eligible depends entirely on the slot: combat slots draw from the actor's equipped combat
 * skills, the dodge slot from their dodge skills, and the tool and usable-item slots from the party's
 * shared inventory. Those pools are owned by JABS and its extensions rather than defined here, so
 * that a skill becoming eligible elsewhere is reflected here without this window being touched.
 */
class Window_LoadoutPicker
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

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * The actor whose slot is being filled.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * The key of the slot being filled.
     * @type {string}
     */
    this._slotKey = String.empty;
  }

  //region properties
  /**
   * Sets the actor.
   * @param {Game_Actor|null} newActor The new actor.
   */
  setActor(newActor)
  {
    // assign the actor.
    this._actor = newActor;
  }

  /**
   * Sets the slot key.
   * @param {string} newSlotKey The new slotKey.
   */
  setSlotKey(newSlotKey)
  {
    // assign the slot key.
    this._slotKey = newSlotKey;
  }
  //endregion properties

  /**
   * Points this window at a particular actor's particular slot and rebuilds accordingly.
   * @param {Game_Actor} actor The actor whose slot is being filled.
   * @param {string} slotKey The key of the slot being filled.
   */
  setTarget(actor, slotKey)
  {
    this.setActor(actor);
    this.setSlotKey(slotKey);

    // the entire contents depend on the target, so nothing is valid until it is rebuilt.
    this.refresh();
    this.select(0);
  }

  /**
   * Gets the actor whose slot is being filled.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Gets the key of the slot being filled.
   * @returns {string}
   */
  slotKey()
  {
    return this._slotKey;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Lists everything eligible for the targeted slot.
   */
  makeCommandList()
  {
    // nothing is listable until a target has been chosen.
    if (!this.actor()) return;

    // list whatever this particular slot accepts.
    this.candidates()
      .forEach(candidate => this.addBuiltCommand(this.buildCandidateCommand(candidate)));
  }

  /**
   * Gets everything eligible to occupy the targeted slot.
   *
   * @returns {(RPG_Skill|RPG_Item)[]}
   */
  candidates()
  {
    // the tool and usable-item slots draw from the party's inventory rather than the actor.
    if (this.slotKey() === JABS_Button.Tool) return this.toolCandidates();
    if (this.slotKey() === JABS_Button.UsableItem) return this.usableItemCandidates();

    // the dodge slot has its own pool of mobility skills.
    if (this.slotKey() === JABS_Button.Dodge) return this.actor()
      .buildDodgeSkillCandidatePool();

    // the offhand accepts a pool of its own, including whatever the mainhand weapon grants.
    if (this.slotKey() === JABS_Button.Offhand) return this.actor()
      .buildOffhandAssignableSkillPool();

    // everything remaining is a combat slot.
    return this.actor()
      .buildCombatSkillCandidatePool();
  }

  /**
   * Gets the party's tools- items explicitly tagged as such.
   * @returns {RPG_Item[]}
   */
  toolCandidates()
  {
    return $gameParty.allItems()
      .filter(item => this.isEligibleItem(item) && item.jabsTool === true);
  }

  /**
   * Gets the party's usable items- consumables that are not tools.
   * @returns {RPG_Item[]}
   */
  usableItemCandidates()
  {
    return $gameParty.allItems()
      .filter(item => this.isEligibleItem(item) && item.jabsTool !== true);
  }

  /**
   * Determines whether an item may occupy a slot at all.
   *
   * Mirrors the gates JABS applies elsewhere: the item must be a genuine always-usable item rather
   * than a weapon or armor that happens to carry a tag, and must not have been explicitly hidden.
   * @param {RPG_Item} item The item to evaluate.
   * @returns {boolean}
   */
  isEligibleItem(item)
  {
    // explicitly hidden items never appear in any menu.
    if (item.jabsHiddenFromMenus) return false;

    // weapons and armor cannot occupy an item slot regardless of their tags.
    if (DataManager.isItem(item) === false) return false;
    if (item.itypeId !== 1) return false;

    // only always-usable items can be triggered from a slot mid-combat.
    return item.occasion === 0;
  }

  /**
   * Builds the command representing a single candidate.
   * @param {RPG_Skill|RPG_Item} candidate The skill or item being offered.
   * @returns {BuiltWindowCommand}
   */
  buildCandidateCommand(candidate)
  {
    // destructure the parts every candidate carries regardless of its kind.
    const {
      id,
      name,
      iconIndex,
      description
    } = candidate;

    // build the command, hanging the id off it for the scene to commit with.
    return new WindowCommandBuilder(name).setSymbol('candidate')
      .setExtensionData(id)
      .setIconIndex(iconIndex)
      .setHelpText(description)
      .setRightText(this.describeQuantity(candidate))
      .build();
  }

  /**
   * Describes how many of a candidate the party holds, where that is meaningful.
   *
   * Skills have no quantity, and neither do items that are not consumed on use, so both render
   * nothing rather than a misleading count.
   * @param {RPG_Skill|RPG_Item} candidate The candidate being described.
   * @returns {string}
   */
  describeQuantity(candidate)
  {
    // skills are always available once known.
    if (DataManager.isItem(candidate) === false) return String.empty;

    // reusable items are effectively unlimited.
    if (candidate.consumable === false) return String.empty;

    // consumables report how many remain.
    return `x${$gameParty.numItems(candidate)}`;
  }
}

export default Window_LoadoutPicker;
//endregion Window_LoadoutPicker
