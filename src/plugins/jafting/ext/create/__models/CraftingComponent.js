//region CraftingComponent
/**
 * A data model for a single component of a recipe in crafting.
 */
class CraftingComponent
{
  static Types = {
    Item: 'i',
    Weapon: 'w',
    Armor: 'a',
    Gold: 'g',
    SDP: 's',
  }

  /**
   * The icon shown for a categorical slot that currently has nothing eligible to represent it.
   * @type {number}
   */
  static CategorySlotIconIndex = 93;

  static Typed = {
    Gold: () => CraftingComponent.builder
      .id(0)
      .type(CraftingComponent.Types.Gold)
      .build(),
    SDP: () => CraftingComponent.builder
      .id(0)
      .type(CraftingComponent.Types.SDP)
      .build(),
  }

  /**
   * The number of instances required of the given component.
   * @type {number}
   */
  #count = 0;

  /**
   * The id of the given component.
   * @type {number}
   */
  #id = 0;

  /**
   * The type of the given component.
   * @type {String.empty|'i'|'w'|'a'|'g'|'s'}
   */
  #type = String.empty;

  /**
   * The ingredient types a satisfying entry must carry, or empty when this component names a specific
   * database row instead.
   * @type {string[]}
   */
  #categories = [];

  /**
   * Constructor.
   */
  constructor(count, id, type, categories = [])
  {
    /**
     * How many of this component is required.
     * @type {number}
     */
    this.#count = count;

    /**
     * The id of the underlying component.
     * @type {number}
     */
    this.#id = id;

    /**
     * The type of component this is, such as `i`/`w`/`a`.
     * @type {string}
     */
    this.#type = type;

    /**
     * The ingredient types this component accepts in place of a specific id.
     * @type {string[]}
     */
    this.#categories = categories;
  }

  /**
   * Whether this component is satisfied by any entry carrying its ingredient types, rather than by
   * one specific database row.
   * @returns {boolean}
   */
  isCategorical()
  {
    return this.#categories.length > 0;
  }

  /**
   * The ingredient types a satisfying entry must carry.
   * @returns {string[]}
   */
  categories()
  {
    return this.#categories;
  }

  /**
   * Every inventory entry that could satisfy this component.
   *
   * Scoped to what the party is carrying rather than to the database on purpose: you can only craft
   * with what you hold, and scanning three full datastores on every window refresh is the slow way to
   * reach the same answer.
   * @returns {(RPG_Item|RPG_Weapon|RPG_Armor)[]}
   */
  eligibleEntries()
  {
    const wanted = this.categories();

    // every type the recipe asks for must be present; extra types on the entry never disqualify it.
    return $gameParty.allItems()
      .filter(entry => wanted.every(type => entry.ingredientTypes()
        .includes(type)));
  }

  /**
   * The single eligible entry the party holds the most of.
   *
   * A slot resolves to exactly one entry, so the best candidate is the one most likely to satisfy the
   * required count on its own.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|null} The best candidate, or null when none are held.
   */
  bestEligibleEntry()
  {
    const entries = this.eligibleEntries();

    // nothing eligible is a legitimate state; the slot simply cannot be filled right now.
    if (entries.length === 0) return null;

    return entries.reduce((best, entry) => ($gameParty.numItems(entry) > $gameParty.numItems(best))
      ? entry
      : best);
  }

  /**
   * Sets the count or quantity of this component to a given value.
   * @param {number} count The new value.
   */
  setCount(count)
  {
    this.#count = count;
  }

  /**
   * Gets the underlying item associated with the component.
   *
   * A categorical component has no single row of its own, so it answers with the best entry the party
   * currently holds. That makes this the one accessor here that can return null - a slot with nothing
   * eligible in inventory is an ordinary state, not a broken one.
   *
   * @apinote If the underlying component is gold or SDP points, the object will
   * be of type {@link CraftingComponent}, and also have these properties:
   * <pre>
   * {
   *   name: string,
   *   description: string,
   *   iconIndex: number
   * }
   * </pre>
   * @return {RPG_Item|RPG_Weapon|RPG_Armor|CraftingComponent|null}
   */
  getItem()
  {
    // a categorical slot resolves against inventory rather than against a fixed id.
    if (this.isCategorical()) return this.bestEligibleEntry();

    if (this.isDatabaseEntry())
    {
      return this.#getDatabaseEntry();
    }

    if (this.isGold())
    {
      return this.#getGoldComponent();
    }

    // sdp is all that remains: {@link isDatabaseEntry} throws on an unrecognized type, and gold is the
    // only other thing it answers false for.
    return this.#getSdpComponent();
  }

  getComponentType()
  {
    return this.#type;
  }

  isItem()
  {
    return this.#type === CraftingComponent.Types.Item;
  }

  isWeapon()
  {
    return this.#type === CraftingComponent.Types.Weapon;
  }

  isArmor()
  {
    return this.#type === CraftingComponent.Types.Armor;
  }

  /**
   * Checks if the underlying item associated with this component is an entry
   * derived from the RMMZ database.
   * @return {boolean}
   */
  isDatabaseEntry()
  {
    // a categorical slot is always filled by a real row; it just does not know which one yet.
    if (this.isCategorical()) return true;

    switch (this.#type)
    {
      case CraftingComponent.Types.Item:
      case CraftingComponent.Types.Weapon:
      case CraftingComponent.Types.Armor:
        return true;
      case CraftingComponent.Types.Gold:
      case CraftingComponent.Types.SDP:
        return false;
      default:
        Diagnostics.error(__PLUGIN_NAME__, `unsupported item type found: [${this.#type}]`);
        throw new Error("The type of this component is unsupported.");
    }
  }

  /**
   * Gets the underlying component's database data.
   * @return {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  #getDatabaseEntry()
  {
    // only the three datastore types can arrive here. {@link isDatabaseEntry} throws on a type it does
    // not recognize, and answers false for the two - gold and sdp - that are not database rows at all,
    // so armor is a total fallthrough rather than an assumption.
    if (this.#type === CraftingComponent.Types.Item) return $dataItems.at(this.#id);

    if (this.#type === CraftingComponent.Types.Weapon) return $dataWeapons.at(this.#id);

    return $dataArmors.at(this.#id);
  }

  /**
   * Checks if the underlying item associated with the component is just gold.
   * @return {boolean}
   */
  isGold()
  {
    return this.#type === CraftingComponent.Types.Gold;
  }

  /**
   * Gets the precrafted gold component with the correct quantity.
   * @return {CraftingComponent}
   */
  #getGoldComponent()
  {
    const goldComponent = CraftingComponent.Typed.Gold();
    goldComponent.setCount(this.#count);
    return goldComponent;
  }

  /**
   * Checks if the underlying item associated with the component is just SDP points.
   * @return {boolean}
   */
  isSdp()
  {
    return this.#type === CraftingComponent.Types.SDP;
  }

  /**
   * Gets the precrafted SDP component with the correct quantity.
   * @return {CraftingComponent}
   */
  #getSdpComponent()
  {
    const sdpComponent = CraftingComponent.Typed.SDP();
    sdpComponent.setCount(this.#count);
    return sdpComponent;
  }

  /**
   * Gets the name for this component.
   * @return {string}
   */
  getName()
  {
    // a categorical slot names the kind of thing it wants, not whichever row happens to fill it.
    if (this.isCategorical()) return this.getCategoryLabel();

    // check if this is something from the database.
    if (this.isDatabaseEntry())
    {
      // return the database name.
      return this.getItem().name;
    }

    // otherwise, pivot on the type of the component to determine the name.
    switch (this.#type)
    {
      case CraftingComponent.Types.Gold:
        return TextManager.currencyUnit;
      case CraftingComponent.Types.SDP:
        return TextManager.sdpPoints();
    }
  }

  /**
   * Gets the icon index for this component.
   * @return {number}
   */
  getIconIndex()
  {
    // a categorical slot borrows the icon of whatever is filling it, falling back to a generic slot.
    if (this.isCategorical())
    {
      const best = this.bestEligibleEntry();

      return (best === null)
        ? CraftingComponent.CategorySlotIconIndex
        : best.iconIndex;
    }

    // check if this is something from the database.
    if (this.isDatabaseEntry())
    {
      // return the database name.
      return this.getItem().iconIndex;
    }

    // otherwise, pivot on the type of the component to determine the name.
    switch (this.#type)
    {
      case CraftingComponent.Types.Gold:
        return IconManager.rewardParam(1)
      case CraftingComponent.Types.SDP:
        return IconManager.rewardParam(4);
    }
  }

  /**
   * Gets the quantity held by the party of this component.
   * @return {number}
   */
  getHandledQuantity()
  {
    // a slot resolves to one entry, so the honest figure is the biggest single stack - not the total
    // across every eligible entry, which would advertise a count the slot can never actually spend.
    if (this.isCategorical())
    {
      const best = this.bestEligibleEntry();

      return (best === null)
        ? 0
        : $gameParty.numItems(best);
    }

    // its from the database, so just fetch the quantity as-usual.
    if (this.isDatabaseEntry()) return $gameParty.numItems(this.getItem());

    // its money, so use the party's held amount.
    if (this.isGold()) return $gameParty.gold();

    // accommodate those using the SDP system as well.
    if (J.JAFTING.EXT.CREATE.Metadata.usingSdp())
    {
      // sdp is all that remains: {@link isDatabaseEntry} throws on an unrecognized type, and gold is
      // the only other thing it answers false for.
      // TODO: update this to only apply to the leader?
      return $gameParty.leader()
        .getSdpPoints();
    }

    // an SDP cost with no SDP system installed. Zero is the honest answer rather than a warning: the
    // component is perfectly valid, the optional plugin backing it simply is not here, so the party
    // holds none of this and never can.
    return 0;
  }

  /**
   * Crafts this particular component based on it's type.
   */
  generate()
  {
    // check if this is a database entry.
    if (this.isDatabaseEntry())
    {
      // add the database item to the party inventory.
      $gameParty.gainItem(this.getItem(), this.#count);
    }

    // check if this is just gold.
    else if (this.isGold())
    {
      // add the money to the running total.
      $gameParty.gainGold(this.#count);
    }

    // sdp is all that remains: {@link isDatabaseEntry} throws on an unrecognized type, and gold is the
    // only other thing it answers false for.
    else
    {
      // TODO: update this to only apply to the leader?
      // give the points to each member of the party.
      $gameParty.members()
        .forEach(actor => actor.modSdpPoints(this.#count));
    }
  }

  /**
   * Consumes this particular component based on it's type.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null} selected The entry chosen to fill a categorical slot.
   */
  consume(selected = null)
  {
    // a categorical slot spends whichever entry the player picked, not whatever happens to be first.
    if (this.isCategorical())
    {
      $gameParty.loseItem(selected, this.#count);

      return;
    }

    // check if this is a database entry.
    if (this.isDatabaseEntry())
    {
      // remove the database item to the party inventory.
      $gameParty.loseItem(this.getItem(), this.#count);
    }

    // check if this is just gold.
    else if (this.isGold())
    {
      // remove the money from the running total.
      $gameParty.loseGold(this.#count);
    }

    // sdp is all that remains: {@link isDatabaseEntry} throws on an unrecognized type, and gold is the
    // only other thing it answers false for.
    else
    {
      // TODO: update this to only apply to the leader?
      // remove points from each member of the party.
      $gameParty.members()
        .forEach(actor => actor.modSdpPoints(-this.#count));
    }
  }

  /**
   * Gets the count of this component required for the parent recipe.
   * @return {number}
   */
  quantity()
  {
    return this.#count;
  }

  /**
   * Checks if the party has as many of this component as are required.
   *
   * Every kind of component answers this the same way - compare the requirement against what the
   * party holds - and {@link #getHandledQuantity} is already the one place that knows how to read
   * "what the party holds" for each kind. Asking it rather than re-deriving the figure per type is
   * what keeps the two from drifting apart, which they had: the categorical rule that a slot is
   * filled by exactly one stack lives there, and so does the answer for an SDP cost in a game with
   * no SDP installed.
   * @return {boolean}
   */
  hasEnough()
  {
    return (this.#count <= this.getHandledQuantity());
  }

  /**
   * The display label for a categorical slot, such as `Any Meat`.
   *
   * Categories are authored broad-to-specific, so the last one is the most descriptive thing to show
   * a player - a slot wanting `[protein, meat]` reads better as "Any Meat" than as "Any Protein".
   * @returns {string}
   */
  getCategoryLabel()
  {
    const categories = this.categories();
    const mostSpecific = categories.at(-1);
    const titleCased = mostSpecific.charAt(0)
      .toUpperCase() + mostSpecific.slice(1);

    return `Any ${titleCased}`;
  }

  /**
   * How many of the given entry remain unclaimed within an in-progress allocation.
   *
   * A tally starts empty and only gains a key once something has been deducted from it, so an absent
   * key means nothing has claimed that entry yet and the party's full count is available.
   * @param {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} tally The running allocation.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} entry The entry being measured.
   * @returns {number}
   */
  static remainingOf(tally, entry)
  {
    return tally.has(entry)
      ? tally.get(entry)
      : $gameParty.numItems(entry);
  }

  /**
   * Claims this component's requirement out of an in-progress allocation, deducting what it takes.
   *
   * Checking each component against raw inventory independently is what lets two slots both believe
   * they can spend the same stack - and because `Game_Party.gainItem` clamps at zero, the second
   * `loseItem` is a silent no-op that hands the player a discount. Allocating against a shared,
   * decrementing tally is what makes overlapping slots honest.
   *
   * Candidate choice is best-fit: the smallest eligible stack that still covers the requirement, so
   * larger stacks stay available for the slots that will need them. It is a heuristic rather than an
   * exhaustive search, which is sufficient because a slot only ever resolves to a single entry.
   * @param {Map<RPG_Item|RPG_Weapon|RPG_Armor, number>} tally The running allocation, mutated on success.
   * @returns {boolean} True when this component could be satisfied from what remains.
   */
  allocateFrom(tally)
  {
    // gold and sdp are not drawn from inventory, so they never compete for a stack.
    if (!this.isDatabaseEntry()) return this.hasEnough();

    const candidates = this.isCategorical()
      ? this.eligibleEntries()
      : [ this.getItem() ];

    // only stacks that cover the whole requirement on their own can fill a slot.
    const sufficient = candidates
      .filter(entry => CraftingComponent.remainingOf(tally, entry) >= this.#count);

    // nothing left that can cover this slot means the whole recipe is out of reach.
    if (sufficient.length === 0) return false;

    // best-fit: spend the tightest stack so the roomier ones survive for later slots.
    const chosen = sufficient.reduce((best, entry) =>
      (CraftingComponent.remainingOf(tally, entry) < CraftingComponent.remainingOf(tally, best))
        ? entry
        : best);

    tally.set(chosen, CraftingComponent.remainingOf(tally, chosen) - this.#count);

    return true;
  }

  /**
   * A builder class for building {@link CraftingComponent}s.
   * @type {JAFT_ComponentBuilder}
   */
  static builder = new class JAFT_ComponentBuilder
  {
    /**
     * The number of instances required of the given component.
     * @type {number}
     */
    #count = 0;

    /**
     * The id of the given component.
     * @type {number}
     */
    #id = 0;

    /**
     * The type of the given component.
     * @type {String.empty|'i'|'w'|'a'|'g'|'s'}
     */
    #type = String.empty;

    /**
     * The ingredient types of the given component.
     * @type {string[]}
     */
    #categories = [];

    build()
    {
      const builtComponent = new CraftingComponent(this.#count, this.#id, this.#type, this.#categories)

      this.#clear();

      return builtComponent;
    }

    #clear()
    {
      this.#count = 0;
      this.#id = 0;
      this.#type = String.empty;
      this.#categories = [];
    }

    count(count)
    {
      this.#count = count;
      return this;
    }

    id(id)
    {
      this.#id = id;
      return this;
    }

    type(type)
    {
      this.#type = type;
      return this;
    }

    categories(categories)
    {
      this.#categories = categories;
      return this;
    }
  }
}

export default CraftingComponent;

//endregion CraftingComponent