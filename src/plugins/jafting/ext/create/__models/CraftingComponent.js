//region CraftingComponent
/**
 * A data model for a single component of a recipe in crafting.
 */
class CraftingComponent
{
  static Types = {
    Item: 'i', Weapon: 'w', Armor: 'a', Gold: 'g', SDP: 's',
  }

  static Typed = {
    Gold: () => CraftingComponent.builder
      .id(0)
      .type(CraftingComponent.Types.Gold)
      .build(), SDP: () => CraftingComponent.builder
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
   * Constructor.
   */
  constructor(count, id, type)
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
   * @return {RPG_Item|RPG_Weapon|RPG_Armor|CraftingComponent}
   */
  getItem()
  {
    if (this.isDatabaseEntry())
    {
      return this.#getDatabaseEntry();
    }

    if (this.isGold())
    {
      return this.#getGoldComponent();
    }

    if (this.isSdp())
    {
      return this.#getSdpComponent();
    }

    console.warn("attempted to retrieve an unsupported type; this will probably break.", this);
    return null;
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
        console.error(`unsupported item type found: [${this.#type}]`);
        console.log(this);
        throw new Error("The type of this component is unsupported.");
    }
  }

  /**
   * Gets the underlying component's database data.
   * @return {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  #getDatabaseEntry()
  {
    switch (this.#type)
    {
      case CraftingComponent.Types.Item:
        return $dataItems.at(this.#id);
      case CraftingComponent.Types.Weapon:
        return $dataWeapons.at(this.#id);
      case CraftingComponent.Types.Armor:
        return $dataArmors.at(this.#id);
      default:
        console.warn("attempted to retrieve an unsupported type.", this);
        return null;
    }
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
    // its from the database, so just fetch the quantity as-usual.
    if (this.isDatabaseEntry()) return $gameParty.numItems(this.getItem());

    // its money, so use the party's held amount.
    if (this.isGold()) return $gameParty.gold();

    // accommodate those using the SDP system as well.
    if (J.JAFTING.EXT.CREATE.Metadata.usingSdp())
    {
      // its SDP, so use the leader's points.
      if (this.isSdp()) return $gameParty.leader()
        .getSdpPoints();
    }

    console.warn('an unsupported component type was presented for quantity.', this);

    // we don't even know what is desired, so lets just say none.
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

    // check if this is SDP gain.
    else if (this.isSdp())
    {
      // TODO: update this to only apply to the leader?
      // give the points to each member of the party.
      $gameParty.members()
        .forEach(actor => actor.modSdpPoints(this.#count));
    }
  }

  /**
   * Consumes this particular component based on it's type.
   */
  consume()
  {
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

    // check if this is SDP loss.
    else if (this.isSdp())
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
   * @return {boolean}
   */
  hasEnough()
  {
    // check if this is a database entry.
    if (this.isDatabaseEntry())
    {
      // determine how many the party has of this particular item.
      const count = $gameParty.numItems(this.getItem());

      // if we don't have as many as are required, then we don't have enough.
      return (this.#count <= count);
    }

    // check if this is just gold.
    else if (this.isGold())
    {
      // add the money to the running total.
      return (this.#count <= $gameParty.gold());
    }

    // check if this is SDP gain.
    else if (this.isSdp())
    {
      // TODO: update this to only apply to the leader?
      // give the points to each member of the party.
      return (this.#count <= $gameParty.leader()
        .getSdpPoints());
    }

    // we don't have enough.
    return false;
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

    build()
    {
      const builtComponent = new CraftingComponent(this.#count, this.#id, this.#type)

      this.#clear();

      return builtComponent;
    }

    #clear()
    {
      this.#count = 0;
      this.#id = 0;
      this.#type = String.empty;
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
  }
}

//endregion CraftingComponent