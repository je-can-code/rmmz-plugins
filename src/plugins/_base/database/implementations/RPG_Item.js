import RPG_UsableItem from '../core/RPG_UsableItem.js';

//region RPG_Item
/**
 * A class representing a single item entry from the database.
 */
class RPG_Item
  extends RPG_UsableItem
{
  //region properties
  /**
   * Whether or not this item is removed after using it.
   * @type {boolean}
   */
  consumable = true;

  /**
   * The type of item this is:
   * 0 for regular item, 1 for key item, 2 for hiddenA, 3 for hiddenB.
   * @type {number}
   */
  itypeId = 1;

  /**
   * The price of this item.
   * @type {number}
   */
  price = 0;

  /**
   * The type of item this is. Items are always type 1.
   * @type {1}
   */
  kind = 1;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_Item} item The item to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(item, index)
  {
    // supply the base class params.
    super(item, index);

    // map the data.
    this.consumable = item.consumable;
    this.itypeId = item.itypeId;
    this.price = item.price;
  }

  /**
   * Whether or not this database entry is an item.
   * @returns {boolean}
   */
  isItem()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:item`;
  }

  /**
   * Hydrated blank consumable row—symmetry with equip `createEmpty`; useful when rebuilding `$dataItems` slots.
   *
   * @param {number} index database id and `$dataItems` index for this row
   * @returns {RPG_Item}
   */
  static createEmpty(index)
  {
    const raw = {
      id: index,
      animationId: 0,
      // policy step inside create empty.
      consumable: true,
      damage: {
        critical: false,
        // policy step inside create empty.
        elementId: 0,
        formula: '0',
        type: 0,
        // policy step inside create empty.
        variance: 20,
      },
      description: String.empty,
      // policy step inside create empty.
      effects: [],
      hitType: 0,
      iconIndex: 0,
      // policy step inside create empty.
      itypeId: 1,
      name: String.empty,
      note: String.empty,
      // policy step inside create empty.
      occasion: 0,
      price: 0,
      repeats: 1,
      scope: 7,
      speed: 0,
      successRate: 100,
      tpGain: 0,
      meta: {},
    };

    // hand back new RPG_Item(raw, index) to the caller.
    return new RPG_Item(raw, index);
  }
}


export default RPG_Item;
//endregion RPG_Item