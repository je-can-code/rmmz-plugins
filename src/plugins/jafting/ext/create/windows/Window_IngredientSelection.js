//region Window_IngredientSelection
/**
 * A window for choosing which inventory entry fills a single categorical ingredient slot.
 *
 * A categorical slot names a kind of thing rather than a database row, so more than one entry can
 * satisfy it. This window is where the player says which one they are spending. It never appears for
 * an id-based slot, and never for a tool - tools are not consumed, so which one is held cannot matter.
 */
class Window_IngredientSelection
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * These cannot be class field declarations: JavaScript applies those only after `super()` returns,
   * by which point the command list has already been built from them and found them undefined.
   */
  initMembers()
  {
    /**
     * The entries the player may choose between for this slot.
     * @type {(RPG_Item|RPG_Weapon|RPG_Armor)[]}
     */
    this._entries = [];

    /**
     * How many of the chosen entry the slot will spend.
     * @type {number}
     */
    this._required = 0;

    /**
     * How much of each entry earlier slots in this same craft have already claimed.
     * @type {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>}
     */
    this._claimed = new Map();
  }

  /**
   * Gets the entries the player may choose between.
   * @returns {(RPG_Item|RPG_Weapon|RPG_Armor)[]}
   */
  entries()
  {
    return this._entries;
  }

  /**
   * Gets how many of the chosen entry this slot will spend.
   * @returns {number}
   */
  required()
  {
    return this._required;
  }

  /**
   * Gets the quantities already claimed by earlier slots in this craft.
   * @returns {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>}
   */
  claimed()
  {
    return this._claimed;
  }

  /**
   * Sets the entries the player may choose between.
   * @param {(RPG_Item|RPG_Weapon|RPG_Armor)[]} entries The eligible entries.
   */
  setEntries(entries)
  {
    this._entries = entries;
  }

  /**
   * Sets how many of the chosen entry this slot will spend.
   * @param {number} required The quantity the slot requires.
   */
  setRequired(required)
  {
    this._required = required;
  }

  /**
   * Sets the quantities already claimed by earlier slots in this craft.
   * @param {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} claimed What earlier slots already took.
   */
  setClaimed(claimed)
  {
    this._claimed = claimed;
  }

  /**
   * Points this window at one categorical slot.
   * @param {(RPG_Item|RPG_Weapon|RPG_Armor)[]} entries The entries eligible for the slot.
   * @param {number} required How many of the chosen entry the slot spends.
   * @param {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} claimed What earlier slots already took.
   */
  setSlot(entries, required, claimed)
  {
    this.setEntries(entries);
    this.setRequired(required);
    this.setClaimed(claimed);
  }

  /**
   * How many of the given entry remain after what earlier slots in this craft have claimed.
   *
   * Raw inventory would offer the player an entry an earlier slot has already spoken for, and the
   * craft would then quietly come up short.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry The entry being measured.
   * @returns {number}
   */
  remainingOf(entry)
  {
    const alreadyClaimed = this.claimed()
      .has(entry)
      ? this.claimed()
        .get(entry)
      : 0;

    return $gameParty.numItems(entry) - alreadyClaimed;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Creates one command per eligible entry.
   */
  makeCommandList()
  {
    // empty the current list.
    this.clearCommandList();

    // grab all the entries available for this slot.
    const commands = this.buildCommands();

    // build all the commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    return this.entries()
      .map(this.buildCommand, this);
  }

  /**
   * Builds a {@link BuiltWindowCommand} for one eligible entry.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry The entry to represent.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(entry)
  {
    const remaining = this.remainingOf(entry);
    const need = this.required();

    // an entry that cannot cover the whole slot on its own is shown but not selectable, so the player
    // can see why it is unavailable rather than wondering where it went.
    const isSufficient = (remaining >= need);
    const quantityColor = isSufficient
      ? 24
      : 18;

    return new WindowCommandBuilder(entry.name)
      .setSymbol(`entry-${entry.id}`)
      .setExtensionData(entry)
      .setIconIndex(entry.iconIndex)
      .setHelpText(entry.name)
      .setEnabled(isSufficient)
      .setRightText(`x${remaining}`)
      .setRightColorIndex(quantityColor)
      .setTextLines([ `(need: ${need})` ])
      .build();
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Gives each row the two full lines it actually draws.
   *
   * A row carries the entry's name and, beneath it, how many the recipe needs. At one and a half lines the second
   * line has nowhere to go and eats the top of the row below it, which is the sort of thing that reads as a broken
   * window rather than a cramped one.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}

export default Window_IngredientSelection;
//endregion Window_IngredientSelection