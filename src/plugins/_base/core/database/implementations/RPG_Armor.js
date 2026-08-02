import RPG_EquipItem from '../core/RPG_EquipItem.js';

//region RPG_Armor
/**
 * A class representing a single armor from the database.
 */
class RPG_Armor
  extends RPG_EquipItem
{
  //region properties
  /**
   * The type of armor this is.
   * This number is the index that maps to your armor types.
   * @type {number}
   */
  atypeId = 1;

  /**
   * The type of item this is. Armors are always type 3.
   * @type {3}
   */
  kind = 3;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_Armor} armor The armor to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(armor, index)
  {
    // supply the base class params.
    super(armor, index);

    // map the data.
    this.atypeId = armor.atypeId;
  }

  /**
   * Whether or not this database entry is an armor.
   * @returns {boolean}
   */
  isArmor()
  {
    return true;
  }

  /**
   * Whether or not this database entry is an equip item.
   * @returns {boolean}
   */
  isEquipItem()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:armor`;
  }

  /**
   * Hydrated blank armor row for reclaiming dynamic refinement slots (matches unused DB slot shape, not `null`).
   *
   * @param {number} index database id and `$dataArmors` index for this row
   * @returns {RPG_Armor}
   */
  static createEmpty(index)
  {
    const raw = {
      id: index,
      atypeId: 0,
      etypeId: 2,
      params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
      price: 0,
      traits: [],
      description: String.empty,
      iconIndex: 0,
      name: String.empty,
      note: String.empty,
      meta: {},
    };

    return new RPG_Armor(raw, index);
  }
}

export default RPG_Armor;
//endregion RPG_Armor